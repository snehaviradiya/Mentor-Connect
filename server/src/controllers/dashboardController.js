import prisma from '../prisma.js';
import { AppError } from '../middleware/errorHandler.js';

/** Helper to determine if a booking is upcoming */
function isUpcoming(sessionDate) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return sessionDate >= today && sessionDate !== '';
}

/** Helper to determine if a booking is past */
function isPast(sessionDate) {
  const today = new Date().toISOString().split('T')[0];
  return sessionDate < today && sessionDate !== '';
}

/**
 * Student dashboard – returns profile and booking analytics.
 */
export async function getStudentDashboard(req, res, next) {
  try {
    const user = req.user; // guaranteed by auth middleware
    if (user.role !== 'STUDENT') {
      return next(new AppError('Student role required.', 403, 'FORBIDDEN'));
    }

    // Fetch bookings for this student (by email)
    const bookings = await prisma.booking.findMany({
      where: { studentEmail: user.email },
      orderBy: { sessionDate: 'desc' },
    });

    const upcoming = bookings.filter((b) => b.status !== 'cancelled' && isUpcoming(b.sessionDate));
    const past = bookings.filter((b) => b.status !== 'cancelled' && isPast(b.sessionDate));
    const cancelled = bookings.filter((b) => b.status === 'cancelled');

    const response = {
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      statistics: {
        totalBookings: bookings.length,
        upcomingCount: upcoming.length,
        pastCount: past.length,
        cancelledCount: cancelled.length,
      },
      bookings: {
        upcoming,
        past,
        cancelled,
      },
    };

    res.status(200).json({ status: 'success', data: response });
  } catch (err) {
    next(err);
  }
}

/**
 * Mentor dashboard – returns profile and booking analytics for the mentor.
 */
export async function getMentorDashboard(req, res, next) {
  try {
    const user = req.user;
    if (user.role !== 'MENTOR') {
      return next(new AppError('Mentor role required.', 403, 'FORBIDDEN'));
    }
    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: user.mentorProfile.id },
      include: { user: true },
    });
    if (!mentor) {
      return next(new AppError('Mentor profile not found.', 404, 'MENTOR_NOT_FOUND'));
    }

    const bookings = await prisma.booking.findMany({
      where: { mentorId: mentor.id },
      orderBy: { sessionDate: 'desc' },
    });

    const upcoming = bookings.filter((b) => b.status !== 'cancelled' && isUpcoming(b.sessionDate));
    const past = bookings.filter((b) => b.status !== 'cancelled' && isPast(b.sessionDate));
    const cancelled = bookings.filter((b) => b.status === 'cancelled');

    const response = {
      profile: {
        id: mentor.id,
        userId: mentor.userId,
        title: mentor.title,
        category: mentor.category,
        bio: mentor.bio,
        avatarInitials: mentor.avatarInitials,
        createdAt: mentor.createdAt,
      },
      statistics: {
        totalBookings: bookings.length,
        upcomingCount: upcoming.length,
        pastCount: past.length,
        cancelledCount: cancelled.length,
      },
      bookings: {
        upcoming,
        past,
        cancelled,
      },
    };

    res.status(200).json({ status: 'success', data: response });
  } catch (err) {
    next(err);
  }
}

