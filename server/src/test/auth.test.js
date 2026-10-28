import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import prisma from '../prisma.js';

describe('Authentication and Authorization API', () => {
  const testStudentEmail = `test.student.${Date.now()}@adypu.edu.in`;
  const testMentorEmail = `test.mentor.${Date.now()}@mentorconnect.adypu.edu.in`;
  const testPassword = 'SecurePassword123!';
  let studentToken = '';

  afterAll(async () => {
    // Clean up created test accounts
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testStudentEmail, testMentorEmail],
        },
      },
    });
  });

  describe('POST /api/auth/register', () => {
    it('registers a new STUDENT user, hashes password, and returns a JWT token', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test Student',
        email: testStudentEmail,
        password: testPassword,
        role: 'STUDENT',
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testStudentEmail.toLowerCase());
      expect(res.body.data.user.role).toBe('STUDENT');
      expect(res.body.data.user.password).toBeUndefined(); // Never expose hashed password

      studentToken = res.body.data.token;

      // Verify password was indeed hashed in database
      const dbUser = await prisma.user.findUnique({
        where: { email: testStudentEmail.toLowerCase() },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(testPassword);
      expect(dbUser.password.startsWith('$2')).toBe(true); // bcrypt prefix
    });

    it('rejects duplicate email registration with 409 DUPLICATE_EMAIL', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate Student',
        email: testStudentEmail,
        password: testPassword,
        role: 'STUDENT',
      });

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('fail');
      expect(res.body.code).toBe('DUPLICATE_EMAIL');
    });

    it('rejects registration with short password (< 6 chars) with 400 VALIDATION_ERROR', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Short Pwd',
        email: 'short@adypu.edu.in',
        password: '123',
        role: 'STUDENT',
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toContain('Password is required and must be at least 6 characters.');
    });

    it('registers a new MENTOR user with profile and expertise', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Dr. Mentor Test',
        email: testMentorEmail,
        password: testPassword,
        role: 'MENTOR',
        title: 'Lead Architect',
        category: 'Cloud & DevOps',
        expertise: ['AWS', 'Kubernetes'],
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.role).toBe('MENTOR');
      expect(res.body.data.user.mentorProfile).toBeDefined();
      expect(res.body.data.user.mentorProfile.category).toBe('Cloud & DevOps');
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates valid credentials and returns JWT token and user profile', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testStudentEmail,
        password: testPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testStudentEmail.toLowerCase());
    });

    it('rejects invalid password with 401 INVALID_CREDENTIALS', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testStudentEmail,
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects non-existent email with 401 INVALID_CREDENTIALS', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@adypu.edu.in',
        password: testPassword,
      });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    it('retrieves user profile when valid Bearer token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe(testStudentEmail.toLowerCase());
      expect(res.body.data.user.role).toBe('STUDENT');
    });

    it('rejects unauthenticated request with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('rejects malformed or forged token with 401 TOKEN_INVALID', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_INVALID');
    });
  });
});
