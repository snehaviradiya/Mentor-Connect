import prisma from '../prisma.js';
import { AppError } from '../middleware/errorHandler.js';

function parseJsonSafe(val, fallback = []) {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function formatMentorRecord(mentor) {
  return {
    id: mentor.id,
    name: mentor.user?.name || mentor.name || 'Mentor',
    email: mentor.user?.email || mentor.email,
    title: mentor.title,
    category: mentor.category,
    expertise: parseJsonSafe(mentor.expertise, []),
    bio: mentor.bio,
    sampleAvailability: mentor.sampleAvailability,
    avatarInitials: mentor.avatarInitials,
    education: mentor.education,
    experience: mentor.experience,
    mentoringTopics: parseJsonSafe(mentor.mentoringTopics, []),
    availabilities: mentor.availabilities || [],
  };
}

/**
 * List mentors with optional category filtering and search query matching.
 */
export async function getAllMentors(req, res, next) {
  try {
    const { category, search, q } = req.query;
    const searchTerm = (search || q || '').trim().toLowerCase();

    const mentors = await prisma.mentorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        availabilities: true,
      },
      orderBy: { id: 'asc' },
    });

    let formatted = mentors.map(formatMentorRecord);

    // Apply category filter if not "All"
    if (category && category.toLowerCase() !== 'all') {
      formatted = formatted.filter(
        (m) => m.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Apply search filter (matches name, title, bio, or any expertise tag)
    if (searchTerm) {
      formatted = formatted.filter((m) => {
        const nameMatch = m.name.toLowerCase().includes(searchTerm);
        const titleMatch = m.title.toLowerCase().includes(searchTerm);
        const bioMatch = m.bio.toLowerCase().includes(searchTerm);
        const expertiseMatch = m.expertise.some((skill) =>
          skill.toLowerCase().includes(searchTerm)
        );
        return nameMatch || titleMatch || bioMatch || expertiseMatch;
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        mentors: formatted,
        total: formatted.length,
      },
      mentors: formatted, // For dual compatibility with any client caller
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get individual mentor profile by ID.
 */
export async function getMentorById(req, res, next) {
  try {
    const { id } = req.params;

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        availabilities: true,
      },
    });

    if (!mentor) {
      return next(
        new AppError(`Mentor with ID ${id} does not exist`, 404, 'MENTOR_NOT_FOUND')
      );
    }

    const formatted = formatMentorRecord(mentor);

    res.status(200).json({
      status: 'success',
      data: {
        mentor: formatted,
      },
      mentor: formatted,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get mentor availability and slot status for a specific date.
 */
export async function getMentorAvailability(req, res, next) {
  try {
    const { id } = req.params;
    const { date } = req.query; // YYYY-MM-DD

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id },
      include: {
        availabilities: true,
      },
    });

    if (!mentor) {
      return next(
        new AppError(`Mentor with ID ${id} does not exist`, 404, 'MENTOR_NOT_FOUND')
      );
    }

    // If date is provided, find any existing active bookings for that date
    let bookedSlots = [];
    if (date) {
      const activeBookings = await prisma.booking.findMany({
        where: {
          mentorId: id,
          sessionDate: date,
          status: { not: 'cancelled' },
        },
        select: {
          timeSlot: true,
        },
      });
      bookedSlots = activeBookings.map((b) => b.timeSlot);
    }

    const slotsWithStatus = mentor.availabilities.map((slot) => {
      const isBooked = bookedSlots.includes(slot.slotLabel);
      return {
        id: slot.id,
        label: slot.slotLabel,
        isBookable: slot.isBookable && !isBooked,
        isBooked,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        mentorId: id,
        date: date || null,
        slots: slotsWithStatus,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Configure availability slots for a mentor profile.
 */
export async function updateMentorAvailability(req, res, next) {
  try {
    const { id } = req.params;
    const { slots } = req.body; // Array of slot strings: ["10:00 AM – 11:00 AM IST", ...]

    if (!Array.isArray(slots) || slots.length === 0) {
      return next(
        new AppError('slots must be a non-empty array of slot strings.', 400, 'VALIDATION_ERROR')
      );
    }

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id },
    });

    if (!mentor) {
      return next(
        new AppError(`Mentor with ID ${id} does not exist`, 404, 'MENTOR_NOT_FOUND')
      );
    }

    // Authorization check: if authenticated user is a mentor, must be their own profile (or admin)
    if (req.user && req.user.role === 'MENTOR' && mentor.userId !== req.user.id) {
      return next(new AppError('You can only update your own availability schedule.', 403, 'FORBIDDEN'));
    }

    // Replace slots in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.mentorAvailability.deleteMany({
        where: { mentorId: id },
      });

      for (const slotLabel of slots) {
        await tx.mentorAvailability.create({
          data: {
            mentorId: id,
            slotLabel,
            isBookable: true,
          },
        });
      }
    });

    const updatedSlots = await prisma.mentorAvailability.findMany({
      where: { mentorId: id },
    });

    res.status(200).json({
      status: 'success',
      data: {
        mentorId: id,
        slots: updatedSlots,
      },
    });
  } catch (err) {
    next(err);
  }
}
