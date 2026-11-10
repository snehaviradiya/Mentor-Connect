import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import request from 'supertest';
import { io as Client } from 'socket.io-client';
import app from '../app.js';
import prisma from '../prisma.js';
import { initChatSocket } from '../socket/chatSocket.js';
import { generateToken } from '../middleware/auth.js';

describe('Feature C: Real-Time Session Chat via Socket.IO & REST', () => {
  let server;
  let serverPort;
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
        email: 'chat.student@adypu.edu.in',
        password: 'password123',
        name: 'Chat Student',
        role: 'STUDENT',
        menteeProfile: { create: {} },
      },
      include: { menteeProfile: true },
    });
    studentToken = generateToken(studentUser);

    // 2. Create Unrelated Student
    otherStudentUser = await prisma.user.create({
      data: {
        email: 'chat.other@adypu.edu.in',
        password: 'password123',
        name: 'Unrelated Student',
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

    // 4. Create confirmed booking
    const booking = await prisma.booking.create({
      data: {
        id: `bk_chat_test_${Date.now()}`,
        mentorId: 'mentor-1',
        menteeId: studentUser.menteeProfile.id,
        studentName: studentUser.name,
        studentEmail: studentUser.email,
        sessionDate: '2026-11-26',
        timeSlot: '04:00 PM – 05:00 PM IST',
        sessionTopic: 'Real-Time Chat & State Synchronization',
        status: 'confirmed',
      },
    });
    bookingId = booking.id;

    // 5. Create Session
    const sess = await prisma.session.create({
      data: {
        id: `sess_chat_${Date.now()}`,
        bookingId: booking.id,
        mentorId: 'mentor-1',
        studentId: studentUser.id,
        status: 'SCHEDULED',
        meetingRoomId: `mentor-connect-session-${booking.id}`,
      },
    });
    sessionId = sess.id;

    // 6. Start test HTTP server with Socket.IO
    server = http.createServer(app);
    initChatSocket(server);
    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await prisma.chatMessage.deleteMany({
      where: { sessionId },
    });
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

  describe('REST Message Endpoints', () => {
    it('allows student to send a message via REST', async () => {
      const res = await request(app)
        .post(`/api/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          content: 'Hello Mentor, excited for our consultation!',
          messageType: 'TEXT',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.message.content).toBe('Hello Mentor, excited for our consultation!');
      expect(res.body.data.message.senderName).toBe('Chat Student');
    });

    it('rejects empty message content (400)', async () => {
      const res = await request(app)
        .post(`/api/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ content: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('denies message posting from unauthorized student (403)', async () => {
      const res = await request(app)
        .post(`/api/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({ content: 'Sneaking in' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('retrieves paginated message history', async () => {
      const res = await request(app)
        .get(`/api/sessions/${sessionId}/messages?page=1&limit=10`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.messages).toBeInstanceOf(Array);
      expect(res.body.data.messages.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('WebSocket Real-Time Socket.IO Flow', () => {
    it('rejects unauthenticated socket connections', async () => {
      const client = Client(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        reconnection: false,
      });

      const err = await new Promise((resolve) => {
        client.on('connect_error', (error) => resolve(error));
      });

      expect(err).toBeDefined();
      expect(err.message).toContain('Authentication token required');
      client.close();
    });

    it('connects authenticated socket, joins session, and receives broadcast messages', async () => {
      // 1. Connect student client
      const studentSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: studentToken },
        transports: ['websocket'],
      });

      // 2. Connect mentor client
      const mentorSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: mentorToken },
        transports: ['websocket'],
      });

      await Promise.all([
        new Promise((resolve) => studentSocket.on('connect', resolve)),
        new Promise((resolve) => mentorSocket.on('connect', resolve)),
      ]);

      // 3. Join session room for both
      const joinStudentRes = await new Promise((resolve) => {
        studentSocket.emit('join_session', { sessionId }, resolve);
      });
      expect(joinStudentRes.status).toBe('ok');

      const joinMentorRes = await new Promise((resolve) => {
        mentorSocket.emit('join_session', { sessionId }, resolve);
      });
      expect(joinMentorRes.status).toBe('ok');

      // 4. Mentor sends message, student listens for 'new_message'
      const receivedPromise = new Promise((resolve) => {
        studentSocket.on('new_message', (msg) => {
          if (msg.content === 'Welcome to the session! Let’s review your architecture.') {
            resolve(msg);
          }
        });
      });

      const sendAck = await new Promise((resolve) => {
        mentorSocket.emit(
          'send_message',
          {
            sessionId,
            content: 'Welcome to the session! Let’s review your architecture.',
            messageType: 'TEXT',
          },
          resolve
        );
      });

      expect(sendAck.status).toBe('ok');

      const receivedMsg = await receivedPromise;
      expect(receivedMsg.content).toBe('Welcome to the session! Let’s review your architecture.');
      expect(receivedMsg.sessionId).toBe(sessionId);

      // Verify persistence in DB
      const dbMsg = await prisma.chatMessage.findFirst({
        where: { sessionId, content: 'Welcome to the session! Let’s review your architecture.' },
      });
      expect(dbMsg).toBeDefined();

      studentSocket.close();
      mentorSocket.close();
    });
  });
});
