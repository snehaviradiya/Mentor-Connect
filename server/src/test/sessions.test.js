import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import prisma from '../prisma.js';
import { generateToken } from '../middleware/auth.js';

describe('Feature A: Mentorship Session Lifecycle', () => {
  let studentUser;
  let otherStudentUser;
  let mentorUser;
  let studentToken;
  let otherStudentToken;
  let mentorToken;
  let bookingId;
  let createdSessionId;

  beforeAll(async () => {
    // 1. Create Student
    studentUser = await prisma.user.create({
      data: {
        email: 'sneha.session.test@adypu.edu.in',
        password: 'password123',
        name: 'Sneha Viradiya',
        role: 'STUDENT',
        menteeProfile: { create: { university: 'ADYPU', major: 'Computer Eng' } },
      },
      include: { menteeProfile: true },
    });
    studentToken = generateToken(studentUser);

    // 2. Create Unrelated Student
    otherStudentUser = await prisma.user.create({
      data: {
        email: 'other.student@adypu.edu.in',
        password: 'password123',
        name: 'Other Student',
        role: 'STUDENT',
        menteeProfile: { create: { university: 'ADYPU', major: 'IT' } },
      },
      include: { menteeProfile: true },
    });
    otherStudentToken = generateToken(otherStudentUser);

    // 3. Find Mentor 1
    mentorUser = await prisma.user.findFirst({
      where: { mentorProfile: { id: 'mentor-1' } },
      include: { mentorProfile: true },
    });
    mentorToken = generateToken(mentorUser);

    // 4. Create confirmed booking
    const booking = await prisma.booking.create({
      data: {
        id: `bk_sess_test_${Date.now()}`,
        mentorId: 'mentor-1',
        menteeId: studentUser.menteeProfile.id,
        studentName: studentUser.name,
        studentEmail: studentUser.email,
        sessionDate: '2026-11-20',
        timeSlot: '10:00 AM – 11:00 AM IST',
        sessionTopic: 'Session Lifecycle Architecture',
        status: 'confirmed',
      },
    });
    bookingId = booking.id;
  });

  afterAll(async () => {
    // Cleanup sessions, bookings, and test users
    await prisma.session.deleteMany({
      where: {
        OR: [
          { studentId: studentUser.id },
          { studentId: otherStudentUser.id },
        ],
      },
    });
    await prisma.booking.deleteMany({
      where: {
        OR: [
          { studentEmail: studentUser.email },
          { studentEmail: otherStudentUser.email },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: [studentUser.email, otherStudentUser.email] },
      },
    });
  });

  describe('POST /api/sessions - Derivation and Creation', () => {
    it('creates a persistent mentorship session from a confirmed booking', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ bookingId });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.session).toBeDefined();
      expect(res.body.data.session.bookingId).toBe(bookingId);
      expect(res.body.data.session.status).toBe('SCHEDULED');
      expect(res.body.data.session.meetingRoomId).toContain('mentor-connect-session-');
      expect(res.body.data.session.studentId).toBe(studentUser.id);
      expect(res.body.data.session.mentorId).toBe('mentor-1');

      createdSessionId = res.body.data.session.id;
    });

    it('rejects duplicate session creation for the same booking (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ bookingId });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('SESSION_ALREADY_EXISTS');
    });

    it('rejects unauthorized third-party user from creating session for booking (403)', async () => {
      // Create another booking
      const newBooking = await prisma.booking.create({
        data: {
          id: `bk_sess_unauth_${Date.now()}`,
          mentorId: 'mentor-1',
          menteeId: studentUser.menteeProfile.id,
          studentName: studentUser.name,
          studentEmail: studentUser.email,
          sessionDate: '2026-11-21',
          timeSlot: '10:00 AM – 11:00 AM IST',
          sessionTopic: 'Unauthorized test',
          status: 'confirmed',
        },
      });

      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({ bookingId: newBooking.id });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/sessions/:id - Scoped Authorization', () => {
    it('allows assigned student to access session details', async () => {
      const res = await request(app)
        .get(`/api/sessions/${createdSessionId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.session.id).toBe(createdSessionId);
      expect(res.body.data.session.booking).toBeDefined();
      expect(res.body.data.session.booking.sessionTopic).toBe('Session Lifecycle Architecture');
    });

    it('allows assigned mentor to access session details', async () => {
      const res = await request(app)
        .get(`/api/sessions/${createdSessionId}`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.session.id).toBe(createdSessionId);
    });

    it('denies access to an unrelated student (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/sessions/${createdSessionId}`)
        .set('Authorization', `Bearer ${otherStudentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('Status Transitions: start, complete, cancel', () => {
    it('starts a scheduled session transitioning to IN_PROGRESS', async () => {
      const res = await request(app)
        .patch(`/api/sessions/${createdSessionId}/start`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.session.status).toBe('IN_PROGRESS');
      expect(res.body.data.session.startedAt).toBeDefined();
    });

    it('completes an in-progress session and updates linked booking status to completed', async () => {
      const res = await request(app)
        .patch(`/api/sessions/${createdSessionId}/complete`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.session.status).toBe('COMPLETED');
      expect(res.body.data.session.completedAt).toBeDefined();

      // Verify linked booking is also completed
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      expect(booking.status).toBe('completed');
    });

    it('rejects starting a completed session (400)', async () => {
      const res = await request(app)
        .patch(`/api/sessions/${createdSessionId}/start`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('cancels a session and releases booking status to cancelled', async () => {
      // Create a fresh booking and session to cancel
      const cancelBooking = await prisma.booking.create({
        data: {
          id: `bk_sess_cancel_${Date.now()}`,
          mentorId: 'mentor-1',
          menteeId: studentUser.menteeProfile.id,
          studentName: studentUser.name,
          studentEmail: studentUser.email,
          sessionDate: '2026-11-22',
          timeSlot: '02:00 PM – 03:00 PM IST',
          sessionTopic: 'Cancellation Test',
          status: 'confirmed',
        },
      });

      const sessRes = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ bookingId: cancelBooking.id });

      const sessId = sessRes.body.data.session.id;

      const cancelRes = await request(app)
        .patch(`/api/sessions/${sessId}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.session.status).toBe('CANCELLED');

      const updatedBooking = await prisma.booking.findUnique({ where: { id: cancelBooking.id } });
      expect(updatedBooking.status).toBe('cancelled');
    });
  });
});
