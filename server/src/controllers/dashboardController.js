import prisma from '../prisma.js';
import { AppError } from '../middleware/errorHandler.js';

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function partitionBookings(bookings) {
  const today = todayDateString();
  const cancelled = bookings.filter((booking) => booking.status === 'cancelled');
  const active = bookings.filter((booking) => booking.status !== 'cancelled');

  return {
    upcoming: active.filter((booking) => booking.sessionDate >= today),
    past: active.filter((booking) => booking.sessionDate < today),
    cancelled,
  };
}

function recentBookings(bookings) {
  return [...bookings]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 5);
}

function formatStudentBooking(booking) {
  return {
    bookingId: booking.id,
    mentor: {
      id: booking.mentor.id,
      name: booking.mentor.user.name,
      title: booking.mentor.title,
      category: booking.mentor.category,
    },
    sessionDate: booking.sessionDate,
    timeSlot: booking.timeSlot,
    sessionTopic: booking.sessionTopic,
    status: booking.status,
    createdAt: booking.createdAt,
  };
}

function formatMentorBooking(booking) {
  return {
    bookingId: booking.id,
    student: {
      name: booking.studentName,
      email: booking.studentEmail,
    },
    sessionDate: booking.sessionDate,
    timeSlot: booking.timeSlot,
    sessionTopic: booking.sessionTopic,
    status: booking.status,
    createdAt: booking.createdAt,
  };
}

export async function getStudentDashboard(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        menteeProfile: {
          select: {
            id: true,
            university: true,
            major: true,
            graduationYear: true,
            bookings: {
              orderBy: [{ sessionDate: 'asc' }, { createdAt: 'desc' }],
              include: {
                mentor: {
                  select: {
                    id: true,
                    title: true,
                    category: true,
                    user: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user?.menteeProfile) {
      throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');
    }

    const bookings = user.menteeProfile.bookings;
    const partitioned = partitionBookings(bookings);
    const format = formatStudentBooking;

    res.status(200).json({
      status: 'success',
      data: {
        student: {
          profile: {
            id: user.menteeProfile.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            university: user.menteeProfile.university,
            major: user.menteeProfile.major,
            graduationYear: user.menteeProfile.graduationYear,
          },
          summary: {
            totalBookings: bookings.length,
            upcomingSessions: partitioned.upcoming.length,
            pastSessions: partitioned.past.length,
            cancelledSessions: partitioned.cancelled.length,
          },
          upcomingSessions: partitioned.upcoming.map(format),
          pastSessions: partitioned.past.map(format),
          cancelledSessions: partitioned.cancelled.map(format),
          recentActivity: recentBookings(bookings).map(format),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMentorDashboard(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        mentorProfile: {
          select: {
            id: true,
            title: true,
            category: true,
            bio: true,
            sampleAvailability: true,
            availabilities: {
              orderBy: [{ dayOfWeek: 'asc' }, { specificDate: 'asc' }, { slotLabel: 'asc' }],
              select: {
                id: true,
                slotLabel: true,
                dayOfWeek: true,
                specificDate: true,
                isBookable: true,
              },
            },
            bookings: {
              orderBy: [{ sessionDate: 'asc' }, { createdAt: 'desc' }],
            },
          },
        },
      },
    });

    if (!user?.mentorProfile) {
      throw new AppError('Mentor profile not found.', 404, 'PROFILE_NOT_FOUND');
    }

    const { bookings, availabilities } = user.mentorProfile;
    const partitioned = partitionBookings(bookings);
    const format = formatMentorBooking;

    res.status(200).json({
      status: 'success',
      data: {
        mentor: {
          profile: {
            id: user.mentorProfile.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            title: user.mentorProfile.title,
            category: user.mentorProfile.category,
            bio: user.mentorProfile.bio,
            sampleAvailability: user.mentorProfile.sampleAvailability,
          },
          summary: {
            totalBookings: bookings.length,
            upcomingAppointments: partitioned.upcoming.length,
            pastAppointments: partitioned.past.length,
            cancelledAppointments: partitioned.cancelled.length,
          },
          upcomingAppointments: partitioned.upcoming.map(format),
          pastAppointments: partitioned.past.map(format),
          cancelledAppointments: partitioned.cancelled.map(format),
          availabilitySummary: {
            totalSlots: availabilities.length,
            bookableSlots: availabilities.filter((slot) => slot.isBookable).length,
            weeklySlots: availabilities.filter((slot) => slot.dayOfWeek !== null).length,
            datedSlots: availabilities.filter((slot) => slot.specificDate !== null).length,
            slots: availabilities.map((slot) => ({
              id: slot.id,
              label: slot.slotLabel,
              dayOfWeek: slot.dayOfWeek,
              specificDate: slot.specificDate,
              isBookable: slot.isBookable,
            })),
          },
          recentActivity: recentBookings(bookings).map(format),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}