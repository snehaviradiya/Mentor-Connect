import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import prisma from '../prisma.js';
import { generateToken } from '../middleware/auth.js';

describe('Bookings and Scheduling Engine', () => {
  let createdBookingId = '';
  let activeBookingId = '';
  const testStudentEmail = 'student.booking.test@adypu.edu.in';
  let studentToken = '';

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: testStudentEmail,
        password: 'not-a-real-password',
        name: 'Sneha Viradiya',
        role: 'STUDENT',
        menteeProfile: { create: {} },
      },
    });
    studentToken = generateToken(user);
  });

  afterAll(async () => {
    // Clean up test bookings
    await prisma.booking.deleteMany({
      where: {
        studentEmail: testStudentEmail,
      },
    });
    await prisma.user.deleteMany({ where: { email: testStudentEmail } });
  });

  describe('POST /api/bookings - Creation and Validation', () => {
    it('creates a new booking matching frontend response contract exactly', async () => {
      const payload = {
        mentorId: 'mentor-1',
        studentName: 'Client supplied name',
        studentEmail: 'client.supplied@adypu.edu.in',
        sessionDate: '2026-11-15',
        timeSlot: '10:00 AM – 11:00 AM IST',
        sessionTopic: 'Backend Architecture & Database Review',
        notes: 'Discussion on PostgreSQL and Prisma relational modeling',
      };

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.bookingId).toBeDefined();
      expect(res.body.data.bookingId.startsWith('bk_')).toBe(true);
      expect(res.body.data.mentorId).toBe('mentor-1');
      expect(res.body.data.mentorName).toBe('Aarav Sharma');
      expect(res.body.data.studentName).toBeUndefined();
      expect(res.body.data.studentEmail).toBeUndefined();
      expect(res.body.data.sessionDate).toBe('2026-11-15');
      expect(res.body.data.timeSlot).toBe('10:00 AM – 11:00 AM IST');
      expect(res.body.data.sessionTopic).toBeUndefined();
      expect(res.body.data.notes).toBeUndefined();
      expect(res.body.data.status).toBe('confirmed');
      expect(res.body.data.createdAt).toBeDefined();

      createdBookingId = res.body.data.bookingId;
      const storedBooking = await prisma.booking.findUnique({ where: { id: createdBookingId } });
      expect(storedBooking.studentName).toBe('Sneha Viradiya');
      expect(storedBooking.studentEmail).toBe(testStudentEmail);
    });

    it('rejects double-booking the same mentor, date, and slot with 409 SLOT_UNAVAILABLE', async () => {
      const duplicatePayload = {
        mentorId: 'mentor-1',
        studentName: 'Another Student',
        studentEmail: 'another@adypu.edu.in',
        sessionDate: '2026-11-15',
        timeSlot: '10:00 AM – 11:00 AM IST', // Same slot as test above
        sessionTopic: 'Duplicate Slot Test',
      };

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(duplicatePayload);

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('fail');
      expect(res.body.code).toBe('SLOT_UNAVAILABLE');
      expect(res.body.message).toContain('already booked for Aarav Sharma');
    });

    it('rejects a session date in the past before checking slot conflicts', async () => {
      const conflictPayload = {
        mentorId: 'mentor-1',
        studentName: 'Student Testing Conflict',
        studentEmail: testStudentEmail,
        sessionDate: '2026-11-01',
        timeSlot: '05:30 PM – 06:30 PM IST (Simulated Conflict Slot)',
        sessionTopic: 'Conflict Slot Check',
      };

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(conflictPayload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toContain('sessionDate cannot be in the past');
    });

    it('rejects booking with invalid/missing mentor ID with 404 MENTOR_NOT_FOUND', async () => {
      const payload = {
        mentorId: 'nonexistent-mentor-id',
        studentName: 'Sneha Viradiya',
        studentEmail: testStudentEmail,
        sessionDate: '2026-11-20',
        timeSlot: '10:00 AM – 11:00 AM IST',
        sessionTopic: 'Test Missing Mentor',
      };

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(payload);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('MENTOR_NOT_FOUND');
      expect(res.body.message).toContain('Mentor with ID nonexistent-mentor-id does not exist');
    });

    it('rejects booking when sessionDate is in the past with 400 VALIDATION_ERROR', async () => {
      const pastPayload = {
        mentorId: 'mentor-1',
        studentName: 'Sneha Viradiya',
        studentEmail: testStudentEmail,
        sessionDate: '2020-01-01', // Date in the past
        timeSlot: '10:00 AM – 11:00 AM IST',
        sessionTopic: 'Past Date Test',
      };

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(pastPayload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toContain('sessionDate cannot be in the past');
    });

    it('rejects booking when studentEmail is invalid with 400 VALIDATION_ERROR', async () => {
      const invalidEmailPayload = {
        mentorId: 'mentor-1',
        studentName: 'Sneha Viradiya',
        studentEmail: 'not-an-email-address',
        sessionDate: '2026-11-20',
        timeSlot: '10:00 AM – 11:00 AM IST',
        sessionTopic: 'Invalid Email Test',
      };

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(invalidEmailPayload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toContain('Please provide a valid email address.');
    });

    it('rejects booking when sessionTopic exceeds 150 characters with 400 VALIDATION_ERROR', async () => {
      const longTopicPayload = {
        mentorId: 'mentor-1',
        studentName: 'Sneha Viradiya',
        studentEmail: testStudentEmail,
        sessionDate: '2026-11-20',
        timeSlot: '10:00 AM – 11:00 AM IST',
        sessionTopic: 'A'.repeat(151),
      };

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(longTopicPayload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toContain('sessionTopic cannot exceed 150 characters.');
    });

    it('rejects non-existent calendar date (e.g. 2026-02-31) with 400 VALIDATION_ERROR', async () => {
      const invalidDatePayload = {
        mentorId: 'mentor-1',
        studentName: 'Sneha Viradiya',
        studentEmail: testStudentEmail,
        sessionDate: '2026-02-31',
        timeSlot: '10:00 AM – 11:00 AM IST',
        sessionTopic: 'Invalid calendar date check',
      };

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(invalidDatePayload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toContain('sessionDate is required in YYYY-MM-DD format.');
    });

    it('rejects malformed or empty timeSlot with 400 VALIDATION_ERROR', async () => {
      const malformedSlotPayload = {
        mentorId: 'mentor-1',
        studentName: 'Sneha Viradiya',
        studentEmail: testStudentEmail,
        sessionDate: '2026-11-20',
        timeSlot: '  ',
        sessionTopic: 'Empty slot test',
      };

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(malformedSlotPayload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toContain('timeSlot is required.');
    });
  });

  describe('GET /api/bookings - Listing and Querying', () => {
    it('lists bookings filtered by studentEmail', async () => {
      const res = await request(app)
        .get(`/api/bookings?studentEmail=${testStudentEmail}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.bookings.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.bookings[0].studentEmail).toBe(testStudentEmail);
    });

    it('lists bookings filtered by mentorId', async () => {
      const res = await request(app)
        .get('/api/bookings?mentorId=mentor-1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings.length).toBeGreaterThanOrEqual(1);
      res.body.data.bookings.forEach((b) => {
        expect(b.mentorId).toBe('mentor-1');
      });
    });
  });

  describe('GET /api/bookings/:id - Single Booking Lookup', () => {
    it('retrieves booking details for a valid bookingId', async () => {
      const res = await request(app)
        .get(`/api/bookings/${createdBookingId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.bookingId).toBe(createdBookingId);
      expect(res.body.data.mentorName).toBe('Aarav Sharma');
    });

    it('returns 404 BOOKING_NOT_FOUND when bookingId does not exist', async () => {
      const res = await request(app)
        .get('/api/bookings/bk_nonexistent_999')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
      expect(res.body.code).toBe('BOOKING_NOT_FOUND');
    });
  });

  describe('PATCH /api/bookings/:id/cancel and Re-booking Slot Release', () => {
    it('cancels an active booking and marks status as cancelled', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${createdBookingId}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.bookingId).toBe(createdBookingId);
      expect(res.body.data.status).toBe('cancelled');
    });

    it('rejects cancelling an already cancelled booking with 400 INVALID_STATUS_TRANSITION', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${createdBookingId}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
      expect(res.body.message).toContain('already cancelled');
    });

    it('releases the time slot so it can now be booked by another request without 409 conflict', async () => {
      // Re-attempt booking the same slot that was previously booked and then cancelled
      const rebookPayload = {
        mentorId: 'mentor-1',
        studentName: 'New Student',
        studentEmail: testStudentEmail,
        sessionDate: '2026-11-15',
        timeSlot: '10:00 AM – 11:00 AM IST', // Slot was previously booked, now cancelled
        sessionTopic: 'Booking Released Slot',
      };

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(rebookPayload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('confirmed');
      activeBookingId = res.body.data.bookingId;
    });
  });

  describe('PATCH /api/bookings/:id/reschedule', () => {
    it('rejects rescheduling a cancelled booking with 400 INVALID_STATUS_TRANSITION', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${createdBookingId}/reschedule`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          sessionDate: '2026-11-25',
          timeSlot: '02:00 PM – 03:00 PM IST',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
      expect(res.body.message).toContain('Cannot reschedule a cancelled booking');
    });

    it('reschedules an active booking to an open date and slot', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${activeBookingId}/reschedule`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          sessionDate: '2026-11-25',
          timeSlot: '02:00 PM – 03:00 PM IST',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.sessionDate).toBe('2026-11-25');
      expect(res.body.data.timeSlot).toBe('02:00 PM – 03:00 PM IST');
    });

    it('rejects malformed reschedule dates with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${activeBookingId}/reschedule`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ sessionDate: '2026-99-99', timeSlot: '02:00 PM – 03:00 PM IST' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects rescheduling to a date in the past with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${activeBookingId}/reschedule`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ sessionDate: '2020-01-01', timeSlot: '02:00 PM – 03:00 PM IST' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects rescheduling to a date and slot that is already booked', async () => {
      // Create a second active booking to collide with
      const secondBooking = await prisma.booking.create({
        data: {
          id: 'bk_collision_target',
          mentorId: 'mentor-1',
          studentName: 'Target Student',
          studentEmail: testStudentEmail,
          sessionDate: '2026-11-26',
          timeSlot: '10:00 AM – 11:00 AM IST',
          sessionTopic: 'Collision target',
          status: 'confirmed',
        },
      });

      const res = await request(app)
        .patch(`/api/bookings/${activeBookingId}/reschedule`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          sessionDate: '2026-11-26',
          timeSlot: '10:00 AM – 11:00 AM IST',
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('SLOT_UNAVAILABLE');

      await prisma.booking.deleteMany({ where: { id: secondBooking.id } });
    });
  });

  describe('Concurrency and Database-level Conflict Safety', () => {
    it('handles two simultaneous concurrent requests for the same mentor, date, and slot: exactly one succeeds and one receives 409', async () => {
      const concurrencyDate = '2026-11-27';
      const slot = '02:00 PM – 03:00 PM IST';

      const reqA = request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          mentorId: 'mentor-1',
          studentName: 'Concurrent Student A',
          studentEmail: testStudentEmail,
          sessionDate: concurrencyDate,
          timeSlot: slot,
          sessionTopic: 'Concurrency Test Session A',
        });

      const reqB = request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          mentorId: 'mentor-1',
          studentName: 'Concurrent Student B',
          studentEmail: testStudentEmail,
          sessionDate: concurrencyDate,
          timeSlot: slot,
          sessionTopic: 'Concurrency Test Session B',
        });

      const [resA, resB] = await Promise.all([reqA, reqB]);

      const statuses = [resA.status, resB.status].sort();
      expect(statuses).toEqual([201, 409]);

      const conflictRes = resA.status === 409 ? resA : resB;
      expect(conflictRes.body.status).toBe('fail');
      expect(conflictRes.body.code).toBe('SLOT_UNAVAILABLE');
    });

    it('allows concurrent requests for different mentors on the same date and slot', async () => {
      const targetDate = '2026-11-28';
      const slot = '10:00 AM – 11:00 AM IST';

      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            mentorId: 'mentor-1',
            studentName: 'Student 1',
            studentEmail: testStudentEmail,
            sessionDate: targetDate,
            timeSlot: slot,
            sessionTopic: 'Mentor 1 Session',
          }),
        request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            mentorId: 'mentor-2',
            studentName: 'Student 2',
            studentEmail: testStudentEmail,
            sessionDate: targetDate,
            timeSlot: slot,
            sessionTopic: 'Mentor 2 Session',
          }),
      ]);

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
    });

    it('allows concurrent requests for different slots for the same mentor', async () => {
      const targetDate = '2026-11-29';

      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            mentorId: 'mentor-1',
            studentName: 'Student Slot 1',
            studentEmail: testStudentEmail,
            sessionDate: targetDate,
            timeSlot: '10:00 AM – 11:00 AM IST',
            sessionTopic: 'Slot 1 Session',
          }),
        request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            mentorId: 'mentor-1',
            studentName: 'Student Slot 2',
            studentEmail: testStudentEmail,
            sessionDate: targetDate,
            timeSlot: '04:00 PM – 05:00 PM IST',
            sessionTopic: 'Slot 2 Session',
          }),
      ]);

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
    });
  });
});
