import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import prisma from '../prisma.js';
import { generateToken } from '../middleware/auth.js';

describe('Feature B: Embedded Jitsi Video Meeting Integration', () => {
  let studentUser;
  let otherStudentUser;
  let mentorUser;
  let studentToken;
  let otherStudentToken;
  let mentorToken;
  let bookingId;
  let sessionId;

  beforeAll(async () => {
    // 1. Create Student
    studentUser = await prisma.user.create({
      data: {
        email: 'meeting.student@adypu.edu.in',
        password: 'password123',
        name: 'Meeting Student',
        role: 'STUDENT',
        menteeProfile: { create: {} },
      },
      include: { menteeProfile: true },
    });
    studentToken = generateToken(studentUser);

    // 2. Create Other Student
    otherStudentUser = await prisma.user.create({
      data: {
        email: 'meeting.other@adypu.edu.in',
        password: 'password123',
        name: 'Unrelated Student',
        role: 'STUDENT',
        menteeProfile: { create: {} },
      },
      include: { menteeProfile: true },
    });
    otherStudentToken = generateToken(otherStudentUser);

    // 3. Find Mentor 2
    mentorUser = await prisma.user.findFirst({
      where: { mentorProfile: { id: 'mentor-2' } },
      include: { mentorProfile: true },
    });
    mentorToken = generateToken(mentorUser);

    // 4. Create confirmed booking
    const booking = await prisma.booking.create({
      data: {
        id: `bk_meeting_test_${Date.now()}`,
        mentorId: 'mentor-2',
        menteeId: studentUser.menteeProfile.id,
        studentName: studentUser.name,
        studentEmail: studentUser.email,
        sessionDate: '2026-11-25',
        timeSlot: '02:00 PM – 03:00 PM IST',
        sessionTopic: 'AI Research Guidance Meeting',
        status: 'confirmed',
      },
    });
    bookingId = booking.id;

    // 5. Create Session
    const sess = await prisma.session.create({
      data: {
        id: `sess_meeting_${Date.now()}`,
        bookingId: booking.id,
        mentorId: 'mentor-2',
        studentId: studentUser.id,
        status: 'SCHEDULED',
        meetingRoomId: `mentor-connect-session-${booking.id}`,
      },
    });
    sessionId = sess.id;
  });

  afterAll(async () => {
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

  it('allows assigned student to retrieve secure meeting configuration', async () => {
    const res = await request(app)
      .get(`/api/sessions/${sessionId}/meeting`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.meeting).toBeDefined();

    const m = res.body.data.meeting;
    expect(m.sessionId).toBe(sessionId);
    expect(m.bookingId).toBe(bookingId);
    expect(m.domain).toBe('meet.jit.si');
    expect(m.roomName).toContain('mentor-connect-session-');
    expect(m.meetingUrl).toBe(`https://meet.jit.si/${m.roomName}`);
    expect(m.canJoin).toBe(true);
    expect(m.userRole).toBe('participant');
    expect(m.participant.name).toBe(studentUser.name);
    expect(m.config.subject).toBe('AI Research Guidance Meeting');

    // Verify secrets are not exposed
    expect(m.jwtSecret).toBeUndefined();
    expect(m.token).toBeUndefined();
  });

  it('allows assigned mentor to access meeting as moderator', async () => {
    const res = await request(app)
      .get(`/api/sessions/${sessionId}/meeting`)
      .set('Authorization', `Bearer ${mentorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.meeting.userRole).toBe('moderator');
    expect(res.body.data.meeting.canJoin).toBe(true);
  });

  it('rejects unauthorized students from accessing meeting details (403)', async () => {
    const res = await request(app)
      .get(`/api/sessions/${sessionId}/meeting`)
      .set('Authorization', `Bearer ${otherStudentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('rejects unauthenticated requests (401)', async () => {
    const res = await request(app).get(`/api/sessions/${sessionId}/meeting`);
    expect(res.status).toBe(401);
  });

  it('sets canJoin to false with notice when session is completed', async () => {
    // Mark session completed
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
    });

    const res = await request(app)
      .get(`/api/sessions/${sessionId}/meeting`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.meeting.canJoin).toBe(false);
    expect(res.body.data.meeting.statusNotice).toContain('concluded');
  });

  it('sets canJoin to false with notice when session is cancelled', async () => {
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'CANCELLED' },
    });

    const res = await request(app)
      .get(`/api/sessions/${sessionId}/meeting`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.meeting.canJoin).toBe(false);
    expect(res.body.data.meeting.statusNotice).toContain('cancelled');
  });
});
