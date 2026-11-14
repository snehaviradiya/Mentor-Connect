import prisma from '../prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { ensureSessionForBooking, syncSessionWithBooking } from './sessionController.js';
import { createUserNotification } from './notificationController.js';
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
    const { mentorId, studentName, studentEmail, sessionDate, timeSlot, sessionTopic, notes } = req.body;

    // 1. Verify mentor existence
    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        availabilities: true,
      },
    });

    if (!mentor) {
      return next(
        new AppError(`Mentor with ID ${mentorId} does not exist`, 404, 'MENTOR_NOT_FOUND')
      );
    }

    const mentorName = mentor.user?.name || 'Mentor';

    // 2. Validate requested slot against mentor's configured availability schedule
    const targetDayOfWeek = new Date(`${sessionDate}T00:00:00.000Z`).getUTCDay();
    const matchingSlot = mentor.availabilities.find((slot) => {
      if (slot.slotLabel !== timeSlot) return false;
      if (slot.specificDate) return slot.specificDate === sessionDate;
      if (slot.dayOfWeek !== null && slot.dayOfWeek !== undefined) {
        return slot.dayOfWeek === targetDayOfWeek;
      }
      return true;
    });

    if (!matchingSlot) {
      throw new AppError(
        `The selected time slot (${timeSlot}) is not offered by ${mentorName} on ${sessionDate}.`,
        400,
        'SLOT_NOT_AVAILABLE'
      );
    }

    if (!matchingSlot.isBookable) {
      throw new AppError(
        `The selected time slot (${timeSlot}) is currently marked as unavailable for booking.`,
        400,
        'SLOT_NOT_BOOKABLE'
      );
    }

    // 3. Identify linked mentee profile if available (via authenticated session or email lookup)
    if (!req.user.menteeProfile) {
      throw new AppError('Student profile is unavailable.', 403, 'FORBIDDEN');
    }
    const menteeId = req.user.menteeProfile.id;
    const verifiedStudentName = req.user.name;
    const verifiedStudentEmail = req.user.email;

    // 3. Concurrency-safe atomic transaction for conflict check & creation
    const transactionResult = await prisma.$transaction(async (tx) => {
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
      const booking = await tx.booking.create({
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

      const session = await ensureSessionForBooking(tx, booking, req.user.id);
      return { booking, session };
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

    await Promise.all([
      createUserNotification(mentor.userId, {
        type: 'BOOKING_CONFIRMED',
        title: 'New booking confirmed',
        message: `A student booked your ${sessionDate} ${timeSlot} session.`,
        entityType: 'booking',
        entityId: transactionResult.booking.id,
      }),
      req.user.id
        ? createUserNotification(req.user.id, {
            type: 'BOOKING_CONFIRMED',
            title: 'Booking confirmed',
            message: `Your ${sessionDate} ${timeSlot} session with ${mentorName} is confirmed.`,
            entityType: 'booking',
            entityId: transactionResult.booking.id,
          })
        : null,
    ]);

    const newBooking = transactionResult.booking;

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
      include: {
        mentor: {
          include: {
            user: { select: { id: true } },
          },
        },
        mentee: {
          include: { user: { select: { id: true } } },
        },
      },
    });

    if (!booking) throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');

    if (booking.status === 'cancelled') {
      throw new AppError('Booking is already cancelled.', 400, 'INVALID_STATUS_TRANSITION');
    }
    if (booking.status === 'completed') {
      throw new AppError('Cannot cancel a completed booking.', 400, 'INVALID_STATUS_TRANSITION');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const bookingUpdate = await tx.booking.update({
        where: { id },
        data: { status: 'cancelled' },
      });

      await syncSessionWithBooking(tx, bookingUpdate.id, 'cancelled');

      return bookingUpdate;
    });

    const notifications = [
      booking.mentor?.user?.id
        ? createUserNotification(booking.mentor.user.id, {
            type: 'BOOKING_CANCELLED',
            title: 'Booking cancelled',
            message: `The ${booking.sessionDate} ${booking.timeSlot} booking has been cancelled.`,
            entityType: 'booking',
            entityId: updated.id,
          })
        : null,
      booking.mentee?.user?.id
        ? createUserNotification(booking.mentee.user.id, {
            type: 'BOOKING_CANCELLED',
            title: 'Booking cancelled',
            message: `Your ${booking.sessionDate} ${booking.timeSlot} session has been cancelled.`,
            entityType: 'booking',
            entityId: updated.id,
          })
        : null,
    ].filter(Boolean);

    await Promise.all(notifications);

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
            user: { select: { id: true, name: true } },
            availabilities: true,
          },
        },
        mentee: {
          include: { user: { select: { id: true } } },
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

    // Validate rescheduled slot against mentor's configured availability
    const targetDayOfWeek = new Date(`${sessionDate}T00:00:00.000Z`).getUTCDay();
    const matchingSlot = booking.mentor.availabilities.find((slot) => {
      if (slot.slotLabel !== timeSlot) return false;
      if (slot.specificDate) return slot.specificDate === sessionDate;
      if (slot.dayOfWeek !== null && slot.dayOfWeek !== undefined) {
        return slot.dayOfWeek === targetDayOfWeek;
      }
      return true;
    });

    if (!matchingSlot) {
      throw new AppError(
        `The selected time slot (${timeSlot}) is not offered by ${mentorName} on ${sessionDate}.`,
        400,
        'SLOT_NOT_AVAILABLE'
      );
    }

    if (!matchingSlot.isBookable) {
      throw new AppError(
        `The selected time slot (${timeSlot}) is currently marked as unavailable for booking.`,
        400,
        'SLOT_NOT_BOOKABLE'
      );
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({ where: { bookingId: id } });
      if (session && (session.status === 'IN_PROGRESS' || session.status === 'COMPLETED')) {
        throw new AppError(
          'Cannot reschedule a session that has already started or concluded.',
          400,
          'INVALID_STATUS_TRANSITION'
        );
      }

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

      const updated = await tx.booking.update({
        where: { id },
        data: {
          sessionDate,
          timeSlot,
          status: 'confirmed',
        },
      });

      await syncSessionWithBooking(tx, updated.id, 'rescheduled');
      return updated;
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
