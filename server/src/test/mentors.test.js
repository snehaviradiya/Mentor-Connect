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
    });
  });

  describe('GET /api/mentors/:id', () => {
    it('retrieves detailed mentor profile for existing ID', async () => {
      const res = await request(app).get('/api/mentors/mentor-1');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.mentor.id).toBe('mentor-1');
      expect(res.body.data.mentor.name).toBe('Aarav Sharma');
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
