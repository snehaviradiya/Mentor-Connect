import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import prisma from '../prisma.js';
import { generateToken } from '../middleware/auth.js';

describe('Feature D: Persistent Session Resource Sharing', () => {
  let studentUser;
  let otherStudentUser;
  let mentorUser;
  let studentToken;
  let otherStudentToken;
  let mentorToken;
  let bookingId;
  let sessionId;

  beforeAll(async () => {
    studentUser = await prisma.user.create({
      data: {
        email: 'resource.student@adypu.edu.in',
        password: 'password123',
        name: 'Resource Student',
        role: 'STUDENT',
        menteeProfile: { create: {} },
      },
      include: { menteeProfile: true },
    });
    studentToken = generateToken(studentUser);

    otherStudentUser = await prisma.user.create({
      data: {
        email: 'resource.other@adypu.edu.in',
        password: 'password123',
        name: 'Other Student',
        role: 'STUDENT',
        menteeProfile: { create: {} },
      },
      include: { menteeProfile: true },
    });
    otherStudentToken = generateToken(otherStudentUser);

    mentorUser = await prisma.user.findFirst({
      where: { mentorProfile: { id: 'mentor-1' } },
      include: { mentorProfile: true },
    });
    mentorToken = generateToken(mentorUser);

    const booking = await prisma.booking.create({
      data: {
        id: `bk_res_test_${Date.now()}`,
        mentorId: 'mentor-1',
        menteeId: studentUser.menteeProfile.id,
        studentName: studentUser.name,
        studentEmail: studentUser.email,
        sessionDate: '2026-11-27',
        timeSlot: '10:00 AM – 11:00 AM IST',
        sessionTopic: 'System Architecture & Resources',
        status: 'confirmed',
      },
    });
    bookingId = booking.id;

    const sess = await prisma.session.create({
      data: {
        id: `sess_res_${Date.now()}`,
        bookingId: booking.id,
        mentorId: 'mentor-1',
        studentId: studentUser.id,
        status: 'SCHEDULED',
        meetingRoomId: `mentor-connect-session-${booking.id}`,
      },
    });
    sessionId = sess.id;
  });

  afterAll(async () => {
    await prisma.sessionResource.deleteMany({ where: { sessionId } });
    await prisma.session.deleteMany({
      where: {
        OR: [{ studentId: studentUser.id }, { studentId: otherStudentUser.id }],
      },
    });
    await prisma.booking.deleteMany({
      where: {
        OR: [{ studentEmail: studentUser.email }, { studentEmail: otherStudentUser.email }],
      },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [studentUser.email, otherStudentUser.email] } },
    });
  });

  it('allows mentor to share a resource link in the session', async () => {
    const res = await request(app)
      .post(`/api/sessions/${sessionId}/resources`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        title: 'System Design Primer',
        url: 'https://github.com/donnemartin/system-design-primer',
        description: 'Comprehensive guide for scaling architecture',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.resource.title).toBe('System Design Primer');
    expect(res.body.data.resource.url).toBe('https://github.com/donnemartin/system-design-primer');
    expect(res.body.data.resource.sharedBy.role).toBe('MENTOR');
  });

  it('rejects invalid resource URL (400)', async () => {
    const res = await request(app)
      .post(`/api/sessions/${sessionId}/resources`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Broken Resource',
        url: 'not-a-valid-url',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('retrieves shared resources for session participants', async () => {
    const res = await request(app)
      .get(`/api/sessions/${sessionId}/resources`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.resources).toBeInstanceOf(Array);
    expect(res.body.data.resources.length).toBe(1);
    expect(res.body.data.resources[0].title).toBe('System Design Primer');
  });

  it('denies resource access to unrelated student (403)', async () => {
    const res = await request(app)
      .get(`/api/sessions/${sessionId}/resources`)
      .set('Authorization', `Bearer ${otherStudentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});
