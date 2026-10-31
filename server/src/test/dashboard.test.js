import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import prisma from '../prisma.js';

let studentToken = '';
let mentorToken = '';
let adminToken = '';
let studentEmail = '';
let mentorId = '';
let createdBookingId = '';

beforeAll(async () => {
  // Register student
  studentEmail = `dash.student.${Date.now()}@adypu.edu.in`;
  const studentPwd = 'SecurePwd123!';
  await request(app).post('/api/auth/register').send({
    name: 'Dash Student',
    email: studentEmail,
    password: studentPwd,
    role: 'STUDENT',
  });
  const loginResStudent = await request(app).post('/api/auth/login').send({ email: studentEmail, password: studentPwd });
  studentToken = loginResStudent.body.data.token;

  // Register mentor
  const mentorEmail = `dash.mentor.${Date.now()}@adypu.edu.in`;
  const mentorPwd = 'SecurePwd123!';
  const mentorReg = await request(app).post('/api/auth/register').send({
    name: 'Dash Mentor',
    email: mentorEmail,
    password: mentorPwd,
    role: 'MENTOR',
    title: 'Mentor Title',
    category: 'Software Engineering',
    expertise: ['Node.js'],
  });
  const loginResMentor = await request(app).post('/api/auth/login').send({ email: mentorEmail, password: mentorPwd });
  mentorToken = loginResMentor.body.data.token;
  // Extract mentor profile id from token payload via decoding (but easier: fetch mentor profile)
  const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${mentorToken}`);
  mentorId = meRes.body.data.user.mentorProfile.id;

  // Register admin (allow role ADMIN)
  const adminEmail = `dash.admin.${Date.now()}@adypu.edu.in`;
  const adminPwd = 'SecurePwd123!';
  await request(app).post('/api/auth/register').send({
    name: 'Dash Admin',
    email: adminEmail,
    password: adminPwd,
    role: 'ADMIN',
  });
  const loginResAdmin = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPwd });
  adminToken = loginResAdmin.body.data.token;

  // Create a booking for student with the mentor
  const bookingRes = await request(app)
    .post('/api/bookings')
    .send({
      mentorId,
      studentName: 'Dash Student',
      studentEmail,
      sessionDate: '2099-01-01', // future date
      timeSlot: '10:00 AM – 11:00 AM IST',
      sessionTopic: 'Future Session',
    });
  createdBookingId = bookingRes.body.data.bookingId;
});

afterAll(async () => {
  // Clean up created data
  await prisma.booking.deleteMany({ where: { studentEmail } });
  await prisma.user.deleteMany({ where: { email: { in: [studentEmail] } } });
  await prisma.user.deleteMany({ where: { email: { contains: 'dash.mentor' } } });
  await prisma.user.deleteMany({ where: { email: { contains: 'dash.admin' } } });
});

describe('Dashboard APIs', () => {
  it('Student dashboard accessible for authenticated student', async () => {
    const res = await request(app)
      .get('/api/dashboard/student')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.profile.email).toBe(studentEmail);
    expect(res.body.data.statistics.totalBookings).toBeGreaterThanOrEqual(1);
  });

  it('Student dashboard rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/dashboard/student');
    expect(res.status).toBe(401);
  });

  it('Mentor cannot access student dashboard', async () => {
    const res = await request(app)
      .get('/api/dashboard/student')
      .set('Authorization', `Bearer ${mentorToken}`);
    expect(res.status).toBe(403);
  });

  it('Admin cannot access student dashboard (role restriction)', async () => {
    const res = await request(app)
      .get('/api/dashboard/student')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  it('Mentor dashboard accessible for authenticated mentor', async () => {
    const res = await request(app)
      .get('/api/dashboard/mentor')
      .set('Authorization', `Bearer ${mentorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.profile.id).toBe(mentorId);
    expect(res.body.data.statistics.totalBookings).toBeGreaterThanOrEqual(1);
  });

  it('Mentor dashboard rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/dashboard/mentor');
    expect(res.status).toBe(401);
  });

  it('Student cannot access mentor dashboard', async () => {
    const res = await request(app)
      .get('/api/dashboard/mentor')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });
});
