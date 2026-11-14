import prisma from '../prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { getTodayDateString, isValidDateString } from '../middleware/validator.js';

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

const CANONICAL_CATEGORIES = [
  'Software Engineering',
  'Data Science & AI',
  'Cloud & DevOps',
  'UI/UX Design',
  'Product & Strategy',
];

/**
 * List mentors with database-side filtering, keyword search, and pagination.
 */
export async function getAllMentors(req, res, next) {
  try {
    const { category, search, q } = req.query;

    // 1. Pagination parameters and validation
    const page = req.query.page !== undefined ? Number(req.query.page) : 1;
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : 10;

    if (req.query.page !== undefined && (!Number.isInteger(page) || page < 1)) {
      return next(
        new AppError('page parameter must be a positive integer >= 1.', 400, 'VALIDATION_ERROR')
      );
    }

    if (req.query.limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 50)) {
      return next(
        new AppError('limit parameter must be an integer between 1 and 50.', 400, 'VALIDATION_ERROR')
      );
    }

    // 2. Build database-side query filter
    const where = {};

    if (category && category.toLowerCase() !== 'all') {
      const canonical = CANONICAL_CATEGORIES.find(
        (c) => c.toLowerCase() === category.toLowerCase()
      ) || category;
      where.category = { equals: canonical };
    }

    const searchTerm = (search || q || '').trim();
    if (searchTerm) {
      where.OR = [
        { user: { name: { contains: searchTerm } } },
        { title: { contains: searchTerm } },
        { bio: { contains: searchTerm } },
        { expertise: { contains: searchTerm } },
        { mentoringTopics: { contains: searchTerm } },
      ];
    }

    const skip = (page - 1) * limit;

    // 3. Database queries for count and paginated items in parallel
    const [total, mentors] = await Promise.all([
      prisma.mentorProfile.count({ where }),
      prisma.mentorProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          availabilities: true,
        },
        orderBy: { id: 'asc' },
      }),
    ]);

    const formatted = mentors.map(formatMentorRecord);
    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

    res.status(200).json({
      status: 'success',
      data: {
        mentors: formatted,
        total,
        page,
        limit,
        totalPages,
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

    if (date !== undefined && !isValidDateString(date)) {
      return next(
        new AppError('Invalid date format. Expected valid calendar date in YYYY-MM-DD format.', 400, 'VALIDATION_ERROR')
      );
    }

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

    const targetDayOfWeek = date
      ? new Date(`${date}T00:00:00.000Z`).getUTCDay()
      : null;

    const applicableSlots = date
      ? mentor.availabilities.filter((slot) => {
          if (slot.specificDate) return slot.specificDate === date;
          if (slot.dayOfWeek !== null && slot.dayOfWeek !== undefined) {
            return slot.dayOfWeek === targetDayOfWeek;
          }
          return true;
        })
      : mentor.availabilities;

    const slotsWithStatus = applicableSlots.map((slot) => {
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
    const { slots } = req.body;

    if (!Array.isArray(slots) || slots.length === 0) {
      return next(
        new AppError('slots must be a non-empty array.', 400, 'VALIDATION_ERROR')
      );
    }

    const normalizedSlots = [];
    for (const slot of slots) {
      const value = typeof slot === 'string' ? { slotLabel: slot } : slot;
      if (!value || typeof value !== 'object' ||
        typeof value.slotLabel !== 'string' ||
        value.slotLabel.trim().length < 3 || value.slotLabel.trim().length > 100 ||
        (value.dayOfWeek !== undefined && (!Number.isInteger(value.dayOfWeek) || value.dayOfWeek < 0 || value.dayOfWeek > 6)) ||
        (value.specificDate !== undefined && !isValidDateString(value.specificDate)) ||
        (value.dayOfWeek !== undefined && value.specificDate !== undefined) ||
        (value.isBookable !== undefined && typeof value.isBookable !== 'boolean')) {
        return next(new AppError('Each slot must include a valid label and either a weekday or specific date.', 400, 'VALIDATION_ERROR'));
      }
      normalizedSlots.push({
        slotLabel: value.slotLabel.trim(),
        dayOfWeek: value.dayOfWeek ?? null,
        specificDate: value.specificDate ?? null,
        isBookable: value.isBookable ?? true,
      });
    }

    const duplicateKeys = normalizedSlots.map((slot) =>
      `${slot.slotLabel}|${slot.dayOfWeek ?? ''}|${slot.specificDate ?? ''}`
    );
    if (new Set(duplicateKeys).size !== duplicateKeys.length) {
      return next(new AppError('Availability slots must be unique for each day or date.', 400, 'VALIDATION_ERROR'));
    }

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id },
    });

    if (!mentor) {
      return next(
        new AppError(`Mentor with ID ${id} does not exist`, 404, 'MENTOR_NOT_FOUND')
      );
    }

    if (req.user.role === 'MENTOR' && mentor.userId !== req.user.id) {
      return next(new AppError('You can only update your own availability schedule.', 403, 'FORBIDDEN'));
    }

    // Keep availability rows for active bookings so later cancellation can reopen the same slot.
    await prisma.$transaction(async (tx) => {
      const activeBookings = await tx.booking.findMany({
        where: {
          mentorId: id,
          status: { not: 'cancelled' },
          sessionDate: { gte: getTodayDateString() },
        },
        select: { timeSlot: true },
      });
      const activeLabels = [...new Set(activeBookings.map((booking) => booking.timeSlot))];

      await tx.mentorAvailability.deleteMany({
        where: {
          mentorId: id,
          ...(activeLabels.length ? { slotLabel: { notIn: activeLabels } } : {}),
        },
      });
      await tx.mentorAvailability.createMany({
        data: normalizedSlots
          .filter((slot) => !activeLabels.includes(slot.slotLabel))
          .map((slot) => ({ ...slot, mentorId: id })),
      });
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

/**
 * Update mentor profile attributes (bio, title, expertise, availability, etc.).
 */
export async function updateMentorProfile(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      bio,
      category,
      expertise,
      sampleAvailability,
      education,
      experience,
      mentoringTopics,
    } = req.body;

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!mentor) {
      return next(
        new AppError(`Mentor with ID ${id} does not exist`, 404, 'MENTOR_NOT_FOUND')
      );
    }

    if (req.user.role === 'MENTOR' && mentor.userId !== req.user.id) {
      return next(
        new AppError('You can only update your own profile.', 403, 'FORBIDDEN')
      );
    }

    const dataToUpdate = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (bio !== undefined) dataToUpdate.bio = bio;
    if (category !== undefined) dataToUpdate.category = category;
    if (expertise !== undefined) {
      dataToUpdate.expertise = typeof expertise === 'string' ? expertise : JSON.stringify(expertise);
    }
    if (sampleAvailability !== undefined) dataToUpdate.sampleAvailability = sampleAvailability;
    if (education !== undefined) dataToUpdate.education = education;
    if (experience !== undefined) dataToUpdate.experience = experience;
    if (mentoringTopics !== undefined) {
      dataToUpdate.mentoringTopics =
        typeof mentoringTopics === 'string' ? mentoringTopics : JSON.stringify(mentoringTopics);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const profile = await tx.mentorProfile.update({
        where: { id },
        data: dataToUpdate,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          availabilities: true,
        },
      });
      if (req.body.name !== undefined) {
        await tx.user.update({
          where: { id: mentor.userId },
          data: { name: String(req.body.name).trim() },
        });
        profile.user.name = String(req.body.name).trim();
      }
      return profile;
    });

    const formatted = formatMentorRecord(updated);

    res.status(200).json({
      status: 'success',
      data: {
        mentor: formatted,
      },
    });
  } catch (err) {
    next(err);
  }
}
