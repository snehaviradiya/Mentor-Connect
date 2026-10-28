import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import prisma from '../prisma.js';

describe('Bookings and Scheduling Engine', () => {
  let createdBookingId = '';
  const testStudentEmail = 'student.booking.test@adypu.edu.in';

  afterAll(async () => {
    // Clean up test bookings
    await prisma.booking.deleteMany({
      where: {
        studentEmail: testStudentEmail,
      },
    });
  });

  describe('POST /api/bookings - Creation and Validation', () => {
    it('creates a new booking matching frontend response contract exactly', async () => {
      const payload = {
        mentorId: 'mentor-1',
        studentName: 'Sneha Viradiya',
        studentEmail: testStudentEmail,
        sessionDate: '2026-11-15',
        timeSlot: '10:00 AM – 11:00 AM IST',
        sessionTopic: 'Backend Architecture & Database Review',
        notes: 'Discussion on PostgreSQL and Prisma relational modeling',
      };

      const res = await request(app).post('/api/bookings').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.bookingId).toBeDefined();
      expect(res.body.data.bookingId.startsWith('bk_')).toBe(true);
      expect(res.body.data.mentorId).toBe('mentor-1');
      expect(res.body.data.mentorName).toBe('Aarav Sharma');
      expect(res.body.data.studentName).toBe('Sneha Viradiya');
      expect(res.body.data.studentEmail).toBe(testStudentEmail);
      expect(res.body.data.sessionDate).toBe('2026-11-15');
      expect(res.body.data.timeSlot).toBe('10:00 AM – 11:00 AM IST');
      expect(res.body.data.sessionTopic).toBe('Backend Architecture & Database Review');
      expect(res.body.data.notes).toBe('Discussion on PostgreSQL and Prisma relational modeling');
      expect(res.body.data.status).toBe('confirmed');
      expect(res.body.data.createdAt).toBeDefined();

      createdBookingId = res.body.data.bookingId;
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

      const res = await request(app).post('/api/bookings').send(duplicatePayload);

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('fail');
      expect(res.body.code).toBe('SLOT_UNAVAILABLE');
      expect(res.body.message).toContain('already booked for Aarav Sharma');
    });

    it('rejects booking the pre-seeded conflict slot (slot-4 on 2026-11-01) with 409', async () => {
      const conflictPayload = {
        mentorId: 'mentor-1',
        studentName: 'Student Testing Conflict',
        studentEmail: testStudentEmail,
        sessionDate: '2026-11-01',
        timeSlot: '05:30 PM – 06:30 PM IST (Simulated Conflict Slot)',
        sessionTopic: 'Conflict Slot Check',
      };

      const res = await request(app).post('/api/bookings').send(conflictPayload);

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('SLOT_UNAVAILABLE');
      expect(res.body.message).toContain('already booked for Aarav Sharma');
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

      const res = await request(app).post('/api/bookings').send(payload);

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

      const res = await request(app).post('/api/bookings').send(pastPayload);

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

      const res = await request(app).post('/api/bookings').send(invalidEmailPayload);

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

      const res = await request(app).post('/api/bookings').send(longTopicPayload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toContain('sessionTopic cannot exceed 150 characters.');
    });
  });

  describe('GET /api/bookings - Listing and Querying', () => {
    it('lists bookings filtered by studentEmail', async () => {
      const res = await request(app).get(`/api/bookings?studentEmail=${testStudentEmail}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.bookings.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.bookings[0].studentEmail).toBe(testStudentEmail);
    });

    it('lists bookings filtered by mentorId', async () => {
      const res = await request(app).get('/api/bookings?mentorId=mentor-1');

      expect(res.status).toBe(200);
      expect(res.body.data.bookings.length).toBeGreaterThanOrEqual(1);
      res.body.data.bookings.forEach((b) => {
        expect(b.mentorId).toBe('mentor-1');
      });
    });
  });

  describe('GET /api/bookings/:id - Single Booking Lookup', () => {
    it('retrieves booking details for a valid bookingId', async () => {
      const res = await request(app).get(`/api/bookings/${createdBookingId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.bookingId).toBe(createdBookingId);
      expect(res.body.data.mentorName).toBe('Aarav Sharma');
    });

    it('returns 404 BOOKING_NOT_FOUND when bookingId does not exist', async () => {
      const res = await request(app).get('/api/bookings/bk_nonexistent_999');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
      expect(res.body.code).toBe('BOOKING_NOT_FOUND');
    });
  });

  describe('PATCH /api/bookings/:id/cancel and Re-booking Slot Release', () => {
    it('cancels an active booking and marks status as cancelled', async () => {
      const res = await request(app).patch(`/api/bookings/${createdBookingId}/cancel`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.bookingId).toBe(createdBookingId);
      expect(res.body.data.status).toBe('cancelled');
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

      const res = await request(app).post('/api/bookings').send(rebookPayload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('confirmed');
    });
  });

  describe('PATCH /api/bookings/:id/reschedule', () => {
    it('reschedules an existing booking to an open date and slot', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${createdBookingId}/reschedule`)
        .send({
          sessionDate: '2026-11-25',
          timeSlot: '02:00 PM – 03:00 PM IST',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.sessionDate).toBe('2026-11-25');
      expect(res.body.data.timeSlot).toBe('02:00 PM – 03:00 PM IST');
    });

    it('rejects rescheduling to a date and slot that is already booked', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${createdBookingId}/reschedule`)
        .send({
          sessionDate: '2026-11-01',
          timeSlot: '05:30 PM – 06:30 PM IST (Simulated Conflict Slot)',
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('SLOT_UNAVAILABLE');
    });
  });
});
