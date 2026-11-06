import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { generateToken } from '../middleware/auth.js';
import prisma from '../prisma.js';

describe('Mentor Discovery and Profile APIs', () => {
  let mentor1User = null;
  let mentor1Token = '';
  let mentor2Token = '';

  beforeAll(async () => {
    mentor1User = await prisma.user.findFirst({
      where: { email: 'aarav.sharma@mentorconnect.adypu.edu.in' },
      include: { mentorProfile: true },
    });
    mentor1Token = generateToken(mentor1User);

    const mentor2User = await prisma.user.findFirst({
      where: { email: 'priya.kulkarni@mentorconnect.adypu.edu.in' },
      include: { mentorProfile: true },
    });
    mentor2Token = generateToken(mentor2User);
  });

  describe('GET /api/mentors', () => {
    it('returns list of mentors with parsed expertise and topics matching client requirements', async () => {
      const res = await request(app).get('/api/mentors');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.mentors)).toBe(true);
      expect(res.body.data.mentors.length).toBeGreaterThanOrEqual(8);

      // Verify structure of first mentor
      const mentor = res.body.data.mentors.find((m) => m.id === 'mentor-1');
      expect(mentor).toBeDefined();
      expect(mentor.name).toBe('Aarav Sharma');
      expect(mentor.email).toBeUndefined();
      expect(mentor.category).toBe('Software Engineering');
      expect(Array.isArray(mentor.expertise)).toBe(true);
      expect(mentor.expertise).toContain('React');
      expect(mentor.avatarInitials).toBe('AS');
      expect(Array.isArray(mentor.mentoringTopics)).toBe(true);
    });

    it('filters mentors by category', async () => {
      const res = await request(app).get('/api/mentors?category=UI/UX Design');

      expect(res.status).toBe(200);
      expect(res.body.data.mentors.length).toBeGreaterThanOrEqual(1);
      res.body.data.mentors.forEach((m) => {
        expect(m.category).toBe('UI/UX Design');
      });
    });

    it('searches mentors by keyword matching skill or bio', async () => {
      const res = await request(app).get('/api/mentors?search=Kubernetes');

      expect(res.status).toBe(200);
      expect(res.body.data.mentors.length).toBeGreaterThanOrEqual(1);
      const rohan = res.body.data.mentors.find((m) => m.name === 'Rohan Deshmukh');
      expect(rohan).toBeDefined();
    });

    it('returns empty list when no mentors match search query', async () => {
      const res = await request(app).get('/api/mentors?search=NonExistentSkill12345');

      expect(res.status).toBe(200);
      expect(res.body.data.mentors.length).toBe(0);
      expect(res.body.data.total).toBe(0);
      expect(res.body.data.totalPages).toBe(0);
    });

    it('paginates mentors with page and limit parameters, returning pagination metadata', async () => {
      const res = await request(app).get('/api/mentors?page=1&limit=3');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.mentors.length).toBe(3);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(3);
      expect(res.body.data.total).toBeGreaterThanOrEqual(8);
      expect(res.body.data.totalPages).toBeGreaterThanOrEqual(3);
    });

    it('retrieves non-overlapping mentors on subsequent page', async () => {
      const page1Res = await request(app).get('/api/mentors?page=1&limit=3');
      const page2Res = await request(app).get('/api/mentors?page=2&limit=3');

      expect(page1Res.status).toBe(200);
      expect(page2Res.status).toBe(200);

      const page1Ids = page1Res.body.data.mentors.map((m) => m.id);
      const page2Ids = page2Res.body.data.mentors.map((m) => m.id);

      expect(page1Ids.length).toBe(3);
      expect(page2Ids.length).toBe(3);
      page2Ids.forEach((id) => {
        expect(page1Ids).not.toContain(id);
      });
    });

    it('rejects invalid page parameter with 400 VALIDATION_ERROR', async () => {
      const res = await request(app).get('/api/mentors?page=-5');

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.message).toContain('page parameter must be a positive integer');
    });

    it('rejects invalid limit parameter with 400 VALIDATION_ERROR', async () => {
      const res = await request(app).get('/api/mentors?limit=100');

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.message).toContain('limit parameter must be an integer between 1 and 50');
    });

    it('combines database category filtering with pagination', async () => {
      const res = await request(app).get(
        '/api/mentors?category=Software%20Engineering&page=1&limit=2'
      );

      expect(res.status).toBe(200);
      expect(res.body.data.mentors.length).toBeLessThanOrEqual(2);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(2);
      res.body.data.mentors.forEach((m) => {
        expect(m.category).toBe('Software Engineering');
      });
    });
  });

  describe('GET /api/mentors/:id', () => {
    it('retrieves detailed mentor profile for existing ID', async () => {
      const res = await request(app).get('/api/mentors/mentor-1');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.mentor.id).toBe('mentor-1');
      expect(res.body.data.mentor.name).toBe('Aarav Sharma');
      expect(res.body.data.mentor.email).toBeUndefined();
      expect(res.body.data.mentor.education).toContain('ADYPU');
      expect(res.body.data.mentor.availabilities.length).toBeGreaterThan(0);
    });

    it('returns 404 MENTOR_NOT_FOUND when mentor ID does not exist', async () => {
      const res = await request(app).get('/api/mentors/nonexistent-mentor-id');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
      expect(res.body.code).toBe('MENTOR_NOT_FOUND');
      expect(res.body.message).toContain('Mentor with ID nonexistent-mentor-id does not exist');
    });
  });

  describe('GET /api/mentors/:id/availability', () => {
    it('retrieves all configured availability slots for mentor', async () => {
      const res = await request(app).get('/api/mentors/mentor-1/availability');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.slots.length).toBeGreaterThanOrEqual(4);
    });

    it('calculates occupied slots and marks conflict demo slot as booked on 2026-11-01', async () => {
      const res = await request(app).get(
        '/api/mentors/mentor-1/availability?date=2026-11-01'
      );

      expect(res.status).toBe(200);
      const conflictSlot = res.body.data.slots.find((s) =>
        s.label.includes('Simulated Conflict Slot')
      );
      expect(conflictSlot).toBeDefined();
      expect(conflictSlot.isBooked).toBe(true);
      expect(conflictSlot.isBookable).toBe(false);

      const openSlot = res.body.data.slots.find((s) =>
        s.label.includes('10:00 AM – 11:00 AM IST')
      );
      expect(openSlot).toBeDefined();
      expect(openSlot.isBooked).toBe(false);
      expect(openSlot.isBookable).toBe(true);
    });

    it('rejects invalid date query parameter with 400 VALIDATION_ERROR', async () => {
      const res = await request(app).get(
        '/api/mentors/mentor-1/availability?date=2026-99-99'
      );

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.message).toContain('Expected valid calendar date');
    });

    it('filters slots by specific-date availability accurately', async () => {
      // Add a date-specific availability slot to mentor-2
      const specificSlot = await prisma.mentorAvailability.create({
        data: {
          mentorId: 'mentor-2',
          slotLabel: '06:00 PM – 07:00 PM IST (Special Guest Slot)',
          specificDate: '2026-12-15',
          isBookable: true,
        },
      });

      // When queried for the specific date, slot is present
      const matchRes = await request(app).get(
        '/api/mentors/mentor-2/availability?date=2026-12-15'
      );
      expect(matchRes.status).toBe(200);
      const foundMatch = matchRes.body.data.slots.find(
        (s) => s.label === specificSlot.slotLabel
      );
      expect(foundMatch).toBeDefined();

      // When queried for a different date, slot is omitted
      const diffRes = await request(app).get(
        '/api/mentors/mentor-2/availability?date=2026-12-16'
      );
      expect(diffRes.status).toBe(200);
      const foundDiff = diffRes.body.data.slots.find(
        (s) => s.label === specificSlot.slotLabel
      );
      expect(foundDiff).toBeUndefined();

      await prisma.mentorAvailability.deleteMany({
        where: { id: specificSlot.id },
      });
    });
  });

  describe('PUT /api/mentors/:id/availability', () => {
    it('rejects unauthenticated request with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .put('/api/mentors/mentor-1/availability')
        .send({ slots: ['09:00 AM – 10:00 AM IST'] });

      expect(res.status).toBe(401);
    });

    it('rejects mentor modifying another mentor profile with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .put('/api/mentors/mentor-1/availability')
        .set('Authorization', `Bearer ${mentor2Token}`) // mentor 2 trying to update mentor 1
        .send({ slots: ['09:00 AM – 10:00 AM IST'] });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('allows mentor to update their own availability schedule', async () => {
      const newSlots = [
        '10:00 AM – 11:00 AM IST',
        '02:00 PM – 03:00 PM IST',
        '04:00 PM – 05:00 PM IST',
        '05:30 PM – 06:30 PM IST (Simulated Conflict Slot)',
      ];

      const res = await request(app)
        .put('/api/mentors/mentor-1/availability')
        .set('Authorization', `Bearer ${mentor1Token}`)
        .send({ slots: newSlots });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.slots.length).toBe(4);
    });
  });
});
