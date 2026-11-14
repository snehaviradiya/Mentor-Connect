import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import prisma from '../prisma.js';
import { generateToken } from '../middleware/auth.js';

describe('Booking ownership and role authorization', () => {
  const suffix = Date.now().toString();
  const identities = {};
  const profileIds = {
    mentorA: `mentor-security-a-${suffix}`,
    mentorB: `mentor-security-b-${suffix}`,
  };
  const bookingIds = {
    studentA: `booking-security-a-${suffix}`,
    studentB: `booking-security-b-${suffix}`,
  };
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  async function createIdentity(key, role) {
    const user = await prisma.user.create({
      data: {
        email: `${key}.${suffix}@example.com`,
        password: 'not-a-real-password',
        name: `${key} user`,
        role,
      },
    });
    identities[key] = { user, token: generateToken(user) };

    if (role === 'STUDENT') {
      identities[key].profile = await prisma.menteeProfile.create({ data: { userId: user.id } });
    }
    if (role === 'MENTOR') {
      identities[key].profile = await prisma.mentorProfile.create({
        data: {
          id: profileIds[key],
          userId: user.id,
          title: 'Test Mentor',
          category: 'Software Engineering',
          expertise: '[]',
          bio: 'Authorization test profile',
          avatarInitials: 'TM',
        },
      });
    }
  }

  beforeAll(async () => {
    await createIdentity('studentA', 'STUDENT');
    await createIdentity('studentB', 'STUDENT');
    await createIdentity('mentorA', 'MENTOR');
    await createIdentity('mentorB', 'MENTOR');
    await createIdentity('admin', 'ADMIN');

    await prisma.booking.createMany({
      data: [
        {
          id: bookingIds.studentA,
          mentorId: profileIds.mentorA,
          menteeId: identities.studentA.profile.id,
          studentName: identities.studentA.user.name,
          studentEmail: identities.studentA.user.email,
          sessionDate: futureDate,
          timeSlot: '10:00 AM',
          sessionTopic: 'Private topic A',
          notes: 'Private notes A',
          status: 'confirmed',
        },
        {
          id: bookingIds.studentB,
          mentorId: profileIds.mentorB,
          menteeId: identities.studentB.profile.id,
          studentName: identities.studentB.user.name,
          studentEmail: identities.studentB.user.email,
          sessionDate: futureDate,
          timeSlot: '11:00 AM',
          sessionTopic: 'Private topic B',
          notes: 'Private notes B',
          status: 'confirmed',
        },
      ],
    });
  });

  afterAll(async () => {
    const cleanupBookingIds = Object.values(bookingIds);
    await prisma.booking.deleteMany({ where: { id: { in: cleanupBookingIds } } });
    await prisma.user.deleteMany({
      where: { email: { in: Object.values(identities).map(({ user }) => user.email) } },
    });
  });

  it('requires authentication for booking reads and mutations', async () => {
    const list = await request(app).get('/api/bookings');
    const detail = await request(app).get(`/api/bookings/${bookingIds.studentA}`);
    const cancel = await request(app).patch(`/api/bookings/${bookingIds.studentA}/cancel`);
    const reschedule = await request(app)
      .patch(`/api/bookings/${bookingIds.studentA}/reschedule`)
      .send({ sessionDate: futureDate, timeSlot: '12:00 PM' });

    expect(list.status).toBe(401);
    expect(detail.status).toBe(401);
    expect(cancel.status).toBe(401);
    expect(reschedule.status).toBe(401);
  });

  it('scopes student results to the authenticated profile regardless of query filters', async () => {
    const response = await request(app)
      .get(`/api/bookings?studentEmail=${identities.studentB.user.email}&mentorId=${profileIds.mentorB}`)
      .set('Authorization', `Bearer ${identities.studentA.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.bookings.map(({ bookingId }) => bookingId)).toEqual([bookingIds.studentA]);
  });

  it('requires an authenticated student to create a booking', async () => {
    const created = await request(app).post('/api/bookings').send({
      mentorId: profileIds.mentorA,
      studentName: identities.studentA.user.name,
      studentEmail: identities.studentA.user.email,
      sessionDate: futureDate,
      timeSlot: '01:00 PM',
      sessionTopic: 'Guest booking ownership check',
    });
    expect(created.status).toBe(401);
    expect(created.body.code).toBe('UNAUTHORIZED');
    expect(await prisma.booking.findFirst({
      where: { studentEmail: identities.studentA.user.email, sessionTopic: 'Guest booking ownership check' },
    })).toBeNull();
  });

  it('scopes mentors to their own assigned bookings despite a supplied mentorId', async () => {
    const response = await request(app)
      .get(`/api/bookings?mentorId=${profileIds.mentorB}`)
      .set('Authorization', `Bearer ${identities.mentorA.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.bookings.some(({ bookingId }) => bookingId === bookingIds.studentA)).toBe(true);
    expect(response.body.data.bookings.some(({ bookingId }) => bookingId === bookingIds.studentB)).toBe(false);
    expect(response.body.data.bookings.every(({ mentorId }) => mentorId === profileIds.mentorA)).toBe(true);
  });

  it('returns 404 when another student or mentor requests a private booking', async () => {
    const studentResponse = await request(app)
      .get(`/api/bookings/${bookingIds.studentA}`)
      .set('Authorization', `Bearer ${identities.studentB.token}`);
    const mentorResponse = await request(app)
      .get(`/api/bookings/${bookingIds.studentB}`)
      .set('Authorization', `Bearer ${identities.mentorA.token}`);

    expect(studentResponse.status).toBe(404);
    expect(mentorResponse.status).toBe(404);
  });

  it('does not allow another student to cancel or reschedule a booking', async () => {
    const cancel = await request(app)
      .patch(`/api/bookings/${bookingIds.studentA}/cancel`)
      .set('Authorization', `Bearer ${identities.studentB.token}`);
    const reschedule = await request(app)
      .patch(`/api/bookings/${bookingIds.studentA}/reschedule`)
      .set('Authorization', `Bearer ${identities.studentB.token}`)
      .send({ sessionDate: futureDate, timeSlot: '01:00 PM' });
    const unchanged = await prisma.booking.findUnique({ where: { id: bookingIds.studentA } });

    expect(cancel.status).toBe(404);
    expect(reschedule.status).toBe(404);
    expect(unchanged.status).toBe('confirmed');
    expect(unchanged.timeSlot).toBe('10:00 AM');
  });

  it('allows admins to inspect and manage bookings without exposing account secrets', async () => {
    const response = await request(app)
      .get(`/api/bookings?mentorId=${profileIds.mentorB}`)
      .set('Authorization', `Bearer ${identities.admin.token}`);
    const cancel = await request(app)
      .patch(`/api/bookings/${bookingIds.studentB}/cancel`)
      .set('Authorization', `Bearer ${identities.admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.bookings.map(({ bookingId }) => bookingId)).toEqual([bookingIds.studentB]);
    expect(response.body.data.bookings[0].mentorEmail).toBeUndefined();
    expect(response.body.data.bookings[0].password).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain('not-a-real-password');
    expect(JSON.stringify(response.body)).not.toContain(identities.admin.token);
    expect(cancel.status).toBe(200);
  });

  it('allows admins to update mentor availability but blocks other roles and mentors', async () => {
    const unauthorizedMentor = await request(app)
      .put(`/api/mentors/${profileIds.mentorB}/availability`)
      .set('Authorization', `Bearer ${identities.mentorA.token}`)
      .send({ slots: ['02:00 PM'] });
    const unauthorizedStudent = await request(app)
      .put(`/api/mentors/${profileIds.mentorA}/availability`)
      .set('Authorization', `Bearer ${identities.studentA.token}`)
      .send({ slots: ['02:00 PM'] });
    const adminUpdate = await request(app)
      .put(`/api/mentors/${profileIds.mentorB}/availability`)
      .set('Authorization', `Bearer ${identities.admin.token}`)
      .send({ slots: ['02:00 PM'] });

    expect(unauthorizedMentor.status).toBe(403);
    expect(unauthorizedStudent.status).toBe(403);
    expect(adminUpdate.status).toBe(200);
  });
});