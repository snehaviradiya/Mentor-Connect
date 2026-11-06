import prisma from '../prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { isValidDateString, isValidTimeSlot, getTodayDateString } from '../middleware/validator.js';

function generateBookingId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 6);
  return `bk_${timestamp}${randomPart}`;
}

function getBookingScope(user) {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'STUDENT' && user.menteeProfile) {
    return { menteeId: user.menteeProfile.id };
  }
  if (user.role === 'MENTOR' && user.mentorProfile) {
    return { mentorId: user.mentorProfile.id };
  }
  throw new AppError('You do not have permission to access bookings.', 403, 'FORBIDDEN');
}

function bookingProjection(booking) {
  return {
    bookingId: booking.id,
    id: booking.id,
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
  };
}

function isUniqueConflictError(err) {
  return (
    err?.code === 'P2002' ||
    err?.message?.includes('UNIQUE constraint failed') ||
    err?.message?.includes('idx_bookings_active_unique')
  );
}

/**
 * Create a new mentorship booking session with concurrency-safe conflict verification.
 */
export async function createBooking(req, res, next) {
  try {
    if (req.user && req.user.role !== 'STUDENT') {
      throw new AppError('Only students can create bookings.', 403, 'FORBIDDEN');
    }
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
    let verifiedStudentName = studentName;
    let verifiedStudentEmail = studentEmail;
    if (req.user) {
      if (!req.user.menteeProfile) {
        throw new AppError('Student profile is unavailable.', 403, 'FORBIDDEN');
      }
      menteeId = req.user.menteeProfile.id;
      verifiedStudentName = req.user.name;
      verifiedStudentEmail = req.user.email;
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
          studentName: verifiedStudentName,
          studentEmail: verifiedStudentEmail,
          sessionDate,
          timeSlot,
          sessionTopic,
          notes: notes || '',
          status: 'confirmed',
        },
      });
    }).catch((err) => {
      if (isUniqueConflictError(err)) {
        throw new AppError(
          `The selected time slot (${sessionDate} at ${timeSlot}) is already booked for ${mentorName}`,
          409,
          'SLOT_UNAVAILABLE'
        );
      }
      throw err;
    });

    res.status(201).json({
      status: 'success',
      data: {
        bookingId: newBooking.id,
        mentorId: newBooking.mentorId,
        mentorName,
        sessionDate: newBooking.sessionDate,
        timeSlot: newBooking.timeSlot,
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
    const filter = getBookingScope(req.user);
    if (req.user.role === 'ADMIN') {
      if (studentEmail) filter.studentEmail = String(studentEmail).toLowerCase();
      if (mentorId) filter.mentorId = String(mentorId);
    }
    if (status) {
      if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
        throw new AppError('Invalid booking status.', 400, 'VALIDATION_ERROR');
      }
      filter.status = status;
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

    const formatted = bookings.map(bookingProjection);

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
    const scope = getBookingScope(req.user);

    const booking = await prisma.booking.findFirst({
      where: { id, ...scope },
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

    if (!booking) throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');

    res.status(200).json({ status: 'success', data: bookingProjection(booking) });
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

    const booking = await prisma.booking.findFirst({
      where: { id, ...getBookingScope(req.user) },
    });

    if (!booking) throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');

    if (booking.status === 'cancelled') {
      throw new AppError('Booking is already cancelled.', 400, 'INVALID_STATUS_TRANSITION');
    }
    if (booking.status === 'completed') {
      throw new AppError('Cannot cancel a completed booking.', 400, 'INVALID_STATUS_TRANSITION');
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
    const todayStr = getTodayDateString();

    if (!isValidDateString(sessionDate) || sessionDate < todayStr || !isValidTimeSlot(timeSlot)) {
      return next(
        new AppError('Both sessionDate and timeSlot are required to reschedule.', 400, 'VALIDATION_ERROR')
      );
    }

    const booking = await prisma.booking.findFirst({
      where: { id, ...getBookingScope(req.user) },
      include: {
        mentor: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!booking) throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');

    if (booking.status === 'cancelled') {
      throw new AppError('Cannot reschedule a cancelled booking.', 400, 'INVALID_STATUS_TRANSITION');
    }
    if (booking.status === 'completed') {
      throw new AppError('Cannot reschedule a completed booking.', 400, 'INVALID_STATUS_TRANSITION');
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
    }).catch((err) => {
      if (isUniqueConflictError(err)) {
        throw new AppError(
          `The selected time slot (${sessionDate} at ${timeSlot}) is already booked for ${mentorName}`,
          409,
          'SLOT_UNAVAILABLE'
        );
      }
      throw err;
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
