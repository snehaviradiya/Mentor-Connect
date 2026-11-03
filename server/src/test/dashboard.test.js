import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import prisma from '../prisma.js';
import { generateToken } from '../middleware/auth.js';

describe('Protected student and mentor dashboards', () => {
  const suffix = Date.now().toString();
  const bookingIds = ['upcoming', 'past', 'cancelled'].map((key) => `dashboard-${key}-${suffix}`);
  const identities = {};
  const profileIds = {
    mentor: `dashboard-mentor-${suffix}`,
    emptyMentor: `dashboard-empty-mentor-${suffix}`,
  };
  const dateOffset = (days) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };

  async function createUser(key, role) {
    const user = await prisma.user.create({
      data: {
        email: `${key}.${suffix}@example.com`,
        password: 'not-a-real-password',
        name: `${key} dashboard user`,
        role,
      },
    });
    identities[key] = { user, token: generateToken(user) };
    return user;
  }

  beforeAll(async () => {
    const student = await createUser('student', 'STUDENT');
    const emptyStudent = await createUser('empty-student', 'STUDENT');
    const mentor = await createUser('mentor', 'MENTOR');
    const emptyMentor = await createUser('empty-mentor', 'MENTOR');
    const menteeProfile = await prisma.menteeProfile.create({
      data: { userId: student.id, university: 'Test University', major: 'Computing', graduationYear: 2027 },
    });
    await prisma.menteeProfile.create({ data: { userId: emptyStudent.id } });

    const mentorProfile = await prisma.mentorProfile.create({
      data: {
        id: profileIds.mentor,
        userId: mentor.id,
        title: 'Dashboard Test Mentor',
        category: 'Software Engineering',
        expertise: '[]',
        bio: 'Dashboard test profile',
        sampleAvailability: 'Weekdays',
        avatarInitials: 'DT',
      },
    });
    await prisma.mentorProfile.create({
      data: {
        id: profileIds.emptyMentor,
        userId: emptyMentor.id,
        title: 'Empty Dashboard Mentor',
        category: 'Software Engineering',
        expertise: '[]',
        bio: 'Empty dashboard test profile',
        avatarInitials: 'ED',
      },
    });

    await prisma.mentorAvailability.createMany({
      data: [
        { mentorId: mentorProfile.id, slotLabel: '10:00 AM', dayOfWeek: 1, isBookable: true },
        { mentorId: mentorProfile.id, slotLabel: '02:00 PM', specificDate: dateOffset(10), isBookable: false },
      ],
    });

    await prisma.booking.createMany({
      data: [
        {
          id: bookingIds[0],
          mentorId: mentorProfile.id,
          menteeId: menteeProfile.id,
          studentName: student.name,
          studentEmail: student.email,
          sessionDate: dateOffset(10),
          timeSlot: '10:00 AM',
          sessionTopic: 'Upcoming session',
          status: 'confirmed',
        },
        {
          id: bookingIds[1],
          mentorId: mentorProfile.id,
          menteeId: menteeProfile.id,
          studentName: student.name,
          studentEmail: student.email,
          sessionDate: dateOffset(-10),
          timeSlot: '11:00 AM',
          sessionTopic: 'Past session',
          status: 'completed',
        },
        {
          id: bookingIds[2],
          mentorId: mentorProfile.id,
          menteeId: menteeProfile.id,
          studentName: student.name,
          studentEmail: student.email,
          sessionDate: dateOffset(-5),
          timeSlot: '12:00 PM',
          sessionTopic: 'Cancelled session',
          status: 'cancelled',
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    await prisma.user.deleteMany({
      where: { email: { in: Object.values(identities).map(({ user }) => user.email) } },
    });
  });

  it('requires authentication and the matching role for both dashboard routes', async () => {
    const studentUnauthenticated = await request(app).get('/api/dashboard/student');
    const mentorUnauthenticated = await request(app).get('/api/dashboard/mentor');
    const studentWrongRole = await request(app)
      .get('/api/dashboard/student')
      .set('Authorization', `Bearer ${identities.mentor.token}`);
    const mentorWrongRole = await request(app)
      .get('/api/dashboard/mentor')
      .set('Authorization', `Bearer ${identities.student.token}`);

    expect(studentUnauthenticated.status).toBe(401);
    expect(mentorUnauthenticated.status).toBe(401);
    expect(studentWrongRole.status).toBe(403);
    expect(mentorWrongRole.status).toBe(403);
  });

  it('returns student profile, date partitions, activity, and aggregate counts without secrets', async () => {
    const response = await request(app)
      .get('/api/dashboard/student')
      .set('Authorization', `Bearer ${identities.student.token}`);
    const dashboard = response.body.data.student;

    expect(response.status).toBe(200);
    expect(dashboard.profile.email).toBe(identities.student.user.email);
    expect(dashboard.profile.university).toBe('Test University');
    expect(dashboard.summary).toEqual({
      totalBookings: 3,
      upcomingSessions: 1,
      pastSessions: 1,
      cancelledSessions: 1,
    });
    expect(dashboard.upcomingSessions[0].bookingId).toBe(bookingIds[0]);
    expect(dashboard.pastSessions[0].bookingId).toBe(bookingIds[1]);
    expect(dashboard.cancelledSessions[0].bookingId).toBe(bookingIds[2]);
    expect(dashboard.recentActivity).toHaveLength(3);
    expect(JSON.stringify(response.body)).not.toContain('not-a-real-password');
    expect(JSON.stringify(response.body)).not.toContain(identities.student.token);
  });

  it('returns a zeroed student dashboard for an empty booking history', async () => {
    const response = await request(app)
      .get('/api/dashboard/student')
      .set('Authorization', `Bearer ${identities['empty-student'].token}`);
    const dashboard = response.body.data.student;

    expect(response.status).toBe(200);
    expect(dashboard.summary).toEqual({
      totalBookings: 0,
      upcomingSessions: 0,
      pastSessions: 0,
      cancelledSessions: 0,
    });
    expect(dashboard.upcomingSessions).toEqual([]);
    expect(dashboard.pastSessions).toEqual([]);
    expect(dashboard.cancelledSessions).toEqual([]);
    expect(dashboard.recentActivity).toEqual([]);
  });

  it('returns mentor appointments and availability summary scoped to that mentor', async () => {
    const response = await request(app)
      .get('/api/dashboard/mentor')
      .set('Authorization', `Bearer ${identities.mentor.token}`);
    const dashboard = response.body.data.mentor;

    expect(response.status).toBe(200);
    expect(dashboard.profile.id).toBe(profileIds.mentor);
    expect(dashboard.summary).toEqual({
      totalBookings: 3,
      upcomingAppointments: 1,
      pastAppointments: 1,
      cancelledAppointments: 1,
    });
    expect(dashboard.upcomingAppointments[0].student.email).toBe(identities.student.user.email);
    expect(dashboard.availabilitySummary).toMatchObject({
      totalSlots: 2,
      bookableSlots: 1,
      weeklySlots: 1,
      datedSlots: 1,
    });
    expect(dashboard.recentActivity).toHaveLength(3);
    expect(JSON.stringify(response.body)).not.toContain('not-a-real-password');
    expect(JSON.stringify(response.body)).not.toContain(identities.mentor.token);
  });

  it('returns a zeroed mentor dashboard for an empty booking history', async () => {
    const response = await request(app)
      .get('/api/dashboard/mentor')
      .set('Authorization', `Bearer ${identities['empty-mentor'].token}`);
    const dashboard = response.body.data.mentor;

    expect(response.status).toBe(200);
    expect(dashboard.summary).toEqual({
      totalBookings: 0,
      upcomingAppointments: 0,
      pastAppointments: 0,
      cancelledAppointments: 0,
    });
    expect(dashboard.upcomingAppointments).toEqual([]);
    expect(dashboard.pastAppointments).toEqual([]);
    expect(dashboard.cancelledAppointments).toEqual([]);
    expect(dashboard.recentActivity).toEqual([]);
    expect(dashboard.availabilitySummary.totalSlots).toBe(0);
  });
});