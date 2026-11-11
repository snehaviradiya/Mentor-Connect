import prisma from '../prisma.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Generate a unique, stable meeting room ID for a session
 */
export function generateMeetingRoomId(sessionId) {
  return `mentor-connect-session-${sessionId}`;
}

/**
 * Resolve session access scope for authenticated user.
 * Admin can access all.
 * Student can access their own sessions (by studentId / menteeProfile).
 * Mentor can access their own sessions (by mentorProfile.id).
 */
export async function getAuthorizedSession(sessionId, user) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      booking: {
        include: {
          mentor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
      },
      resources: true,
      reviews: true,
    },
  });

  if (!session) {
    throw new AppError('Mentorship session not found.', 404, 'SESSION_NOT_FOUND');
  }

  if (user.role === 'ADMIN') {
    return session;
  }

  const isAssignedStudent = session.studentId === user.id;
  const isAssignedMentor = user.mentorProfile && session.mentorId === user.mentorProfile.id;

  if (!isAssignedStudent && !isAssignedMentor) {
    throw new AppError('You do not have permission to access this mentorship session.', 403, 'FORBIDDEN');
  }

  return session;
}

/**
 * Format session record for client responses
 */
export function formatSessionResponse(session) {
  return {
    id: session.id,
    sessionId: session.id,
    bookingId: session.bookingId,
    mentorId: session.mentorId,
    studentId: session.studentId,
    status: session.status,
    meetingRoomId: session.meetingRoomId,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    cancelledAt: session.cancelledAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    booking: session.booking
      ? {
          id: session.booking.id,
          studentName: session.booking.studentName,
          studentEmail: session.booking.studentEmail,
          sessionDate: session.booking.sessionDate,
          timeSlot: session.booking.timeSlot,
          sessionTopic: session.booking.sessionTopic,
          notes: session.booking.notes,
          status: session.booking.status,
          mentorName: session.booking.mentor?.user?.name || 'Mentor',
          mentorTitle: session.booking.mentor?.title || '',
        }
      : undefined,
    resourceCount: session.resources ? session.resources.length : 0,
    reviewCount: session.reviews ? session.reviews.length : 0,
  };
}

export async function ensureSessionForBooking(tx, booking, studentUserId = null) {
  const existingSession = await tx.session.findUnique({
    where: { bookingId: booking.id },
  });

  if (existingSession) {
    return existingSession;
  }

  const resolvedStudentId = studentUserId || booking.mentee?.userId || null;
  if (!resolvedStudentId) {
    const studentUser = await tx.user.findUnique({ where: { email: booking.studentEmail } });
    if (!studentUser) {
      throw new AppError('Unable to resolve the student profile for this booking.', 400, 'INVALID_BOOKING_DATA');
    }
  }

  const finalStudentId = resolvedStudentId || (await tx.user.findUnique({ where: { email: booking.studentEmail } }))?.id;
  if (!finalStudentId) {
    throw new AppError('Unable to resolve the student profile for this booking.', 400, 'INVALID_BOOKING_DATA');
  }

  const sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  return await tx.session.create({
    data: {
      id: sessionId,
      bookingId: booking.id,
      mentorId: booking.mentorId,
      studentId: finalStudentId,
      status: 'SCHEDULED',
      meetingRoomId: generateMeetingRoomId(booking.id),
    },
  });
}

export async function syncSessionWithBooking(tx, bookingId, nextBookingStatus) {
  const session = await tx.session.findUnique({ where: { bookingId } });
  if (!session) {
    return null;
  }

  if (nextBookingStatus === 'cancelled') {
    return await tx.session.update({
      where: { id: session.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }

  if (nextBookingStatus === 'completed') {
    return await tx.session.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
    return session;
  }

  return await tx.session.update({
    where: { id: session.id },
    data: {
      status: 'SCHEDULED',
      startedAt: session.startedAt || null,
    },
  });
}

/**
 * POST /api/sessions
 * Create or derive a persistent mentorship session from a confirmed booking.
 */
export async function createSession(req, res, next) {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return next(new AppError('bookingId is required to create a session.', 400, 'VALIDATION_ERROR'));
    }

    // 1. Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        mentor: true,
        mentee: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!booking) {
      return next(new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND'));
    }

    if (booking.status === 'cancelled') {
      return next(
        new AppError('Cannot create a mentorship session for a cancelled booking.', 400, 'INVALID_BOOKING_STATUS')
      );
    }

    // 2. Authorization: user must be admin, the assigned student, or the assigned mentor
    const userId = req.user.id;
    const isMentor = req.user.mentorProfile && booking.mentorId === req.user.mentorProfile.id;
    const isStudent = (booking.mentee && booking.mentee.userId === userId) || booking.studentEmail === req.user.email;

    if (req.user.role !== 'ADMIN' && !isMentor && !isStudent) {
      return next(
        new AppError('You do not have permission to create a session for this booking.', 403, 'FORBIDDEN')
      );
    }

    // 3. Check if session already exists for this booking
    const existingSession = await prisma.session.findUnique({
      where: { bookingId },
    });

    if (existingSession) {
      return next(
        new AppError('A mentorship session already exists for this booking.', 409, 'SESSION_ALREADY_EXISTS')
      );
    }

    // Identify student User ID
    let studentUserId = booking.mentee?.userId;
    if (!studentUserId) {
      // Look up user by email
      const user = await prisma.user.findUnique({ where: { email: booking.studentEmail } });
      studentUserId = user ? user.id : userId;
    }

    // Generate session ID
    const newSession = await prisma.$transaction(async (tx) => {
      // Create session with temp room ID, then finalize
      const tempId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const room = generateMeetingRoomId(tempId);

      return await tx.session.create({
        data: {
          id: tempId,
          bookingId: booking.id,
          mentorId: booking.mentorId,
          studentId: studentUserId,
          status: 'SCHEDULED',
          meetingRoomId: room,
        },
        include: {
          booking: {
            include: {
              mentor: {
                include: {
                  user: {
                    select: { name: true, email: true },
                  },
                },
              },
            },
          },
        },
      });
    });

    res.status(201).json({
      status: 'success',
      message: 'Mentorship session created successfully.',
      data: {
        session: formatSessionResponse(newSession),
      },
    });
  } catch (err) {
    if (err?.code === 'P2002') {
      return next(new AppError('A mentorship session already exists for this booking.', 409, 'SESSION_ALREADY_EXISTS'));
    }
    next(err);
  }
}

/**
 * GET /api/sessions
 * List all sessions accessible to the authenticated user (filtered by upcoming, past, status)
 */
export async function listSessions(req, res, next) {
  try {
    const { status } = req.query;
    const where = {};

    if (req.user.role === 'ADMIN') {
      // all
    } else if (req.user.role === 'MENTOR' && req.user.mentorProfile) {
      where.mentorId = req.user.mentorProfile.id;
    } else {
      where.studentId = req.user.id;
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          include: {
            mentor: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
        resources: true,
        reviews: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        sessions: sessions.map(formatSessionResponse),
        total: sessions.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/sessions/:id
 * Retrieve session details by ID
 */
export async function getSessionById(req, res, next) {
  try {
    const { id } = req.params;
    const session = await getAuthorizedSession(id, req.user);

    res.status(200).json({
      status: 'success',
      data: {
        session: formatSessionResponse(session),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/sessions/:id/start
 * Transition session from SCHEDULED to IN_PROGRESS.
 */
export async function startSession(req, res, next) {
  try {
    const { id } = req.params;
    const session = await getAuthorizedSession(id, req.user);

    // Only assigned mentor, student, or admin can start session
    if (session.status === 'IN_PROGRESS') {
      return res.status(200).json({
        status: 'success',
        message: 'Session is already in progress.',
        data: { session: formatSessionResponse(session) },
      });
    }

    if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
      throw new AppError(
        `Cannot start a session that has already been ${session.status.toLowerCase()}.`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const updated = await prisma.session.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: session.startedAt || new Date(),
      },
      include: {
        booking: {
          include: {
            mentor: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Mentorship session started successfully.',
      data: {
        session: formatSessionResponse(updated),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/sessions/:id/complete
 * Transition session from IN_PROGRESS or SCHEDULED to COMPLETED.
 */
export async function completeSession(req, res, next) {
  try {
    const { id } = req.params;
    const session = await getAuthorizedSession(id, req.user);

    if (session.status === 'COMPLETED') {
      return res.status(200).json({
        status: 'success',
        message: 'Session is already completed.',
        data: { session: formatSessionResponse(session) },
      });
    }

    if (session.status === 'CANCELLED') {
      throw new AppError(
        'Cannot complete a cancelled session.',
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Mark linked booking completed as well
      await tx.booking.update({
        where: { id: session.bookingId },
        data: { status: 'completed' },
      });

      return await tx.session.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
        include: {
          booking: {
            include: {
              mentor: {
                include: { user: { select: { name: true } } },
              },
            },
          },
        },
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Mentorship session marked as completed.',
      data: {
        session: formatSessionResponse(updated),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/sessions/:id/cancel
 * Cancel a session
 */
export async function cancelSession(req, res, next) {
  try {
    const { id } = req.params;
    const session = await getAuthorizedSession(id, req.user);

    if (session.status === 'CANCELLED') {
      throw new AppError('Session is already cancelled.', 400, 'INVALID_STATUS_TRANSITION');
    }

    if (session.status === 'COMPLETED') {
      throw new AppError('Cannot cancel a completed session.', 400, 'INVALID_STATUS_TRANSITION');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Release booking status to cancelled so time slot can be re-used
      await tx.booking.update({
        where: { id: session.bookingId },
        data: { status: 'cancelled' },
      });

      return await tx.session.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
        include: {
          booking: {
            include: {
              mentor: {
                include: { user: { select: { name: true } } },
              },
            },
          },
        },
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Mentorship session cancelled successfully.',
      data: {
        session: formatSessionResponse(updated),
      },
    });
  } catch (err) {
    next(err);
  }
}
