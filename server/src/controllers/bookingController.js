import prisma from '../prisma.js';
import { AppError } from '../middleware/errorHandler.js';

function generateBookingId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 6);
  return `bk_${timestamp}${randomPart}`;
}

/**
 * Create a new mentorship booking session with concurrency-safe conflict verification.
 */
export async function createBooking(req, res, next) {
  try {
    const { mentorId, studentName, studentEmail, sessionDate, timeSlot, sessionTopic, notes } = req.body;

    // 1. Verify mentor existence
    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!mentor) {
      return next(
        new AppError(`Mentor with ID ${mentorId} does not exist`, 404, 'MENTOR_NOT_FOUND')
      );
    }

    const mentorName = mentor.user?.name || 'Mentor';

    // 2. Identify linked mentee profile if available (via authenticated session or email lookup)
    let menteeId = null;
    if (req.user?.menteeProfile?.id) {
      menteeId = req.user.menteeProfile.id;
    } else {
      const existingMenteeUser = await prisma.user.findUnique({
        where: { email: studentEmail },
        include: { menteeProfile: true },
      });
      if (existingMenteeUser?.menteeProfile) {
        menteeId = existingMenteeUser.menteeProfile.id;
      }
    }

    // 3. Concurrency-safe atomic transaction for conflict check & creation
    const newBooking = await prisma.$transaction(async (tx) => {
      // Check for any active (non-cancelled) booking on the exact same mentor, date, and slot
      const conflictingBooking = await tx.booking.findFirst({
        where: {
          mentorId,
          sessionDate,
          timeSlot,
          status: { not: 'cancelled' },
        },
      });

      if (conflictingBooking) {
        throw new AppError(
          `The selected time slot (${sessionDate} at ${timeSlot}) is already booked for ${mentorName}`,
          409,
          'SLOT_UNAVAILABLE'
        );
      }

      const bookingId = generateBookingId();

      return await tx.booking.create({
        data: {
          id: bookingId,
          mentorId,
          menteeId,
          studentName,
          studentEmail,
          sessionDate,
          timeSlot,
          sessionTopic,
          notes: notes || '',
          status: 'confirmed',
        },
      });
    });

    res.status(201).json({
      status: 'success',
      data: {
        bookingId: newBooking.id,
        mentorId: newBooking.mentorId,
        mentorName,
        studentName: newBooking.studentName,
        studentEmail: newBooking.studentEmail,
        sessionDate: newBooking.sessionDate,
        timeSlot: newBooking.timeSlot,
        sessionTopic: newBooking.sessionTopic,
        notes: newBooking.notes,
        status: newBooking.status,
        createdAt: newBooking.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * List bookings with filtering for mentors, students, or administrative reporting.
 */
export async function listBookings(req, res, next) {
  try {
    const { studentEmail, mentorId, status } = req.query;
    const filter = {};

    // Filter by student email
    if (studentEmail) {
      filter.studentEmail = studentEmail.toLowerCase();
    }

    // Filter by mentor ID
    if (mentorId) {
      filter.mentorId = mentorId;
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // If user is authenticated as STUDENT without query params, scope to their bookings
    if (req.user && req.user.role === 'STUDENT' && !studentEmail) {
      filter.studentEmail = req.user.email;
    }

    // If user is authenticated as MENTOR without query params, scope to their mentor bookings
    if (req.user && req.user.role === 'MENTOR' && req.user.mentorProfile && !mentorId) {
      filter.mentorId = req.user.mentorProfile.id;
    }

    const bookings = await prisma.booking.findMany({
      where: filter,
      include: {
        mentor: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { sessionDate: 'desc' },
    });

    const formatted = bookings.map((b) => ({
      bookingId: b.id,
      id: b.id,
      mentorId: b.mentorId,
      mentorName: b.mentor?.user?.name || 'Mentor',
      studentName: b.studentName,
      studentEmail: b.studentEmail,
      sessionDate: b.sessionDate,
      timeSlot: b.timeSlot,
      sessionTopic: b.sessionTopic,
      notes: b.notes,
      status: b.status,
      createdAt: b.createdAt,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        bookings: formatted,
        total: formatted.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get individual booking record by ID.
 */
export async function getBookingById(req, res, next) {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        mentor: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!booking) {
      return next(
        new AppError(`Booking record with ID ${id} does not exist`, 404, 'BOOKING_NOT_FOUND')
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        bookingId: booking.id,
        mentorId: booking.mentorId,
        mentorName: booking.mentor?.user?.name || 'Mentor',
        studentName: booking.studentName,
        studentEmail: booking.studentEmail,
        sessionDate: booking.sessionDate,
        timeSlot: booking.timeSlot,
        sessionTopic: booking.sessionTopic,
        notes: booking.notes,
        status: booking.status,
        createdAt: booking.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel a booked session and release its time slot.
 */
export async function cancelBooking(req, res, next) {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        mentor: true,
      },
    });

    if (!booking) {
      return next(
        new AppError(`Booking record with ID ${id} does not exist`, 404, 'BOOKING_NOT_FOUND')
      );
    }

    // Role verification if authenticated
    if (req.user) {
      const isOwnerStudent = req.user.email.toLowerCase() === booking.studentEmail.toLowerCase();
      const isOwnerMentor = req.user.mentorProfile && req.user.mentorProfile.id === booking.mentorId;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isOwnerStudent && !isOwnerMentor && !isAdmin) {
        return next(
          new AppError('You do not have permission to cancel this appointment.', 403, 'FORBIDDEN')
        );
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.status(200).json({
      status: 'success',
      message: 'Booking cancelled successfully. The time slot is now open for new reservations.',
      data: {
        bookingId: updated.id,
        status: updated.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Reschedule an existing booking to a new date and time slot.
 */
export async function rescheduleBooking(req, res, next) {
  try {
    const { id } = req.params;
    const { sessionDate, timeSlot } = req.body;

    if (!sessionDate || !timeSlot) {
      return next(
        new AppError('Both sessionDate and timeSlot are required to reschedule.', 400, 'VALIDATION_ERROR')
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        mentor: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!booking) {
      return next(
        new AppError(`Booking record with ID ${id} does not exist`, 404, 'BOOKING_NOT_FOUND')
      );
    }

    const mentorName = booking.mentor?.user?.name || 'Mentor';

    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Check for slot collisions with other active bookings
      const conflict = await tx.booking.findFirst({
        where: {
          id: { not: id },
          mentorId: booking.mentorId,
          sessionDate,
          timeSlot,
          status: { not: 'cancelled' },
        },
      });

      if (conflict) {
        throw new AppError(
          `The selected time slot (${sessionDate} at ${timeSlot}) is already booked for ${mentorName}`,
          409,
          'SLOT_UNAVAILABLE'
        );
      }

      return await tx.booking.update({
        where: { id },
        data: {
          sessionDate,
          timeSlot,
          status: 'confirmed',
        },
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Booking rescheduled successfully.',
      data: {
        bookingId: updatedBooking.id,
        sessionDate: updatedBooking.sessionDate,
        timeSlot: updatedBooking.timeSlot,
        status: updatedBooking.status,
      },
    });
  } catch (err) {
    next(err);
  }
}
