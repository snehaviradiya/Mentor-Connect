import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import prisma from '../prisma.js';
import { generateToken } from '../middleware/auth.js';

describe('Feature D: Enforce Completed-Session Review Eligibility', () => {
  let studentUser;
  let otherStudentUser;
  let mentorUser;
  let studentToken;
  let otherStudentToken;
  let mentorToken;
  let scheduledSessionId;
  let completedSessionId;

  beforeAll(async () => {
    // 1. Create Student
    studentUser = await prisma.user.create({
      data: {
        email: 'review.student@adypu.edu.in',
        password: 'password123',
        name: 'Review Student',
        role: 'STUDENT',
        menteeProfile: { create: {} },
      },
      include: { menteeProfile: true },
    });
    studentToken = generateToken(studentUser);

    // 2. Create Other Student
    otherStudentUser = await prisma.user.create({
      data: {
        email: 'review.other@adypu.edu.in',
        password: 'password123',
        name: 'Other Student',
        role: 'STUDENT',
        menteeProfile: { create: {} },
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

    // 4. Create Scheduled Session
    const booking1 = await prisma.booking.create({
      data: {
        id: `bk_rev_sched_${Date.now()}`,
        mentorId: 'mentor-1',
        menteeId: studentUser.menteeProfile.id,
        studentName: studentUser.name,
        studentEmail: studentUser.email,
        sessionDate: '2026-11-28',
        timeSlot: '10:00 AM – 11:00 AM IST',
        sessionTopic: 'Future Incomplete Session',
        status: 'confirmed',
      },
    });

    const sess1 = await prisma.session.create({
      data: {
        id: `sess_rev_sched_${Date.now()}`,
        bookingId: booking1.id,
        mentorId: 'mentor-1',
        studentId: studentUser.id,
        status: 'SCHEDULED',
        meetingRoomId: `room-${booking1.id}`,
      },
    });
    scheduledSessionId = sess1.id;

    // 5. Create Completed Session
    const booking2 = await prisma.booking.create({
      data: {
        id: `bk_rev_comp_${Date.now()}`,
        mentorId: 'mentor-1',
        menteeId: studentUser.menteeProfile.id,
        studentName: studentUser.name,
        studentEmail: studentUser.email,
        sessionDate: '2026-11-05',
        timeSlot: '10:00 AM – 11:00 AM IST',
        sessionTopic: 'Past Completed Mentorship Consultation',
        status: 'completed',
      },
    });

    const sess2 = await prisma.session.create({
      data: {
        id: `sess_rev_comp_${Date.now()}`,
        bookingId: booking2.id,
        mentorId: 'mentor-1',
        studentId: studentUser.id,
        status: 'COMPLETED',
        meetingRoomId: `room-${booking2.id}`,
        completedAt: new Date(),
      },
    });
    completedSessionId = sess2.id;
  });

  afterAll(async () => {
    await prisma.sessionReview.deleteMany({
      where: {
        sessionId: { in: [scheduledSessionId, completedSessionId] },
      },
    });
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

  it('rejects review submission for a session that is NOT completed (400)', async () => {
    const res = await request(app)
      .post(`/api/sessions/${scheduledSessionId}/reviews`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        rating: 5,
        feedback: 'Premature review attempt',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SESSION_NOT_COMPLETED');
    expect(res.body.message).toContain('completed mentorship sessions');
  });

  it('submits verified review for a COMPLETED session by the assigned student', async () => {
    const res = await request(app)
      .post(`/api/sessions/${completedSessionId}/reviews`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        rating: 5,
        feedback: 'Incredible deep dive into system design and caching strategies!',
        tags: ['Clear Explanations', 'System Design Depth'],
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.review.rating).toBe(5);
    expect(res.body.data.review.reviewerName).toBe('Review Student');
    expect(res.body.data.review.tags).toContain('Clear Explanations');
  });

  it('rejects duplicate review for the same session by the same student (409)', async () => {
    const res = await request(app)
      .post(`/api/sessions/${completedSessionId}/reviews`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        rating: 4,
        feedback: 'Trying to review again',
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('REVIEW_ALREADY_EXISTS');
  });

  it('rejects review submission from non-attending student (403)', async () => {
    const res = await request(app)
      .post(`/api/sessions/${completedSessionId}/reviews`)
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({
        rating: 5,
        feedback: 'Intruding review',
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('validates rating is an integer between 1 and 5 (400)', async () => {
    // Temporarily create another completed session
    const b = await prisma.booking.create({
      data: {
        id: `bk_val_rate_${Date.now()}`,
        mentorId: 'mentor-1',
        menteeId: studentUser.menteeProfile.id,
        studentName: studentUser.name,
        studentEmail: studentUser.email,
        sessionDate: '2026-11-06',
        timeSlot: '02:00 PM – 03:00 PM IST',
        sessionTopic: 'Rating Validation',
        status: 'completed',
      },
    });

    const s = await prisma.session.create({
      data: {
        id: `sess_val_rate_${Date.now()}`,
        bookingId: b.id,
        mentorId: 'mentor-1',
        studentId: studentUser.id,
        status: 'COMPLETED',
        meetingRoomId: `room-${b.id}`,
      },
    });

    const res = await request(app)
      .post(`/api/sessions/${s.id}/reviews`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        rating: 6, // Invalid
        feedback: 'Out of range',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');

    // Cleanup
    await prisma.session.delete({ where: { id: s.id } });
    await prisma.booking.delete({ where: { id: b.id } });
  });

  it('retrieves mentor verified reviews with average rating via public endpoint', async () => {
    const res = await request(app).get('/api/mentors/mentor-1/reviews');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.mentorId).toBe('mentor-1');
    expect(res.body.data.totalReviews).toBeGreaterThanOrEqual(1);
    expect(res.body.data.averageRating).toBeGreaterThanOrEqual(1);
    expect(res.body.data.reviews[0].studentName).toBe('Review Student');
  });
});
