import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import { getAuthorizedSession } from '../controllers/sessionController.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mentor-connect-secure-dev-jwt-secret-key-2026';

let ioInstance = null;

export function getIO() {
  return ioInstance;
}

export function initChatSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow all local dev origins or match configured CORS_ORIGIN
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!authHeader) {
        return next(new Error('Authentication token required'));
      }

      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return next(new Error('Invalid or expired authentication token'));
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          mentorProfile: true,
          menteeProfile: true,
        },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  // Connection Handler
  io.on('connection', (socket) => {
    // 1. Join Session Room
    socket.on('join_session', async (payload, callback) => {
      try {
        const sessionId = payload?.sessionId;
        if (!sessionId) {
          if (callback) callback({ error: 'sessionId is required' });
          return;
        }

        await getAuthorizedSession(sessionId, socket.user);

        const roomName = `session:${sessionId}`;
        socket.join(roomName);

        const recentMessages = await prisma.chatMessage.findMany({
          where: { sessionId },
          orderBy: { createdAt: 'asc' },
          take: 50,
        });

        const senderIds = [...new Set(recentMessages.map((m) => m.senderId))];
        const users = await prisma.user.findMany({
          where: { id: { in: senderIds } },
          select: { id: true, name: true, role: true, avatar: true },
        });
        const senderMap = new Map(users.map((user) => [user.id, user]));

        const formattedMessages = recentMessages.map((message) => {
          const sender = senderMap.get(message.senderId);
          return {
            id: message.id,
            sessionId: message.sessionId,
            senderId: message.senderId,
            senderName: sender?.name || 'User',
            senderRole: sender?.role || 'STUDENT',
            senderAvatar: sender?.avatar || null,
            content: message.content,
            messageType: message.messageType,
            createdAt: message.createdAt,
          };
        });

        if (callback) {
          callback({
            status: 'ok',
            sessionId,
            userId: socket.user.id,
            joinedAt: new Date().toISOString(),
            messages: formattedMessages,
          });
        }

        socket.to(roomName).emit('user_joined', {
          sessionId,
          userId: socket.user.id,
          userName: socket.user.name,
          role: socket.user.role,
        });
      } catch (err) {
        if (callback) {
          callback({
            error: err.message || 'Failed to join session chat',
            code: err.code || 'FORBIDDEN',
          });
        }
      }
    });

    socket.on('send_message', async (payload, callback) => {
      try {
        const { sessionId, content, messageType = 'TEXT' } = payload || {};

        if (!sessionId) {
          if (callback) callback({ error: 'sessionId is required' });
          return;
        }

        const trimmed = (content || '').trim();
        if (!trimmed) {
          if (callback) callback({ error: 'Message content cannot be empty' });
          return;
        }

        if (trimmed.length > 2000) {
          if (callback) callback({ error: 'Message content cannot exceed 2000 characters' });
          return;
        }

        const validTypes = ['TEXT', 'RESOURCE_LINK', 'SYSTEM'];
        if (!validTypes.includes(messageType)) {
          if (callback) callback({ error: 'Invalid message type', code: 'INVALID_MESSAGE_TYPE' });
          return;
        }

        await getAuthorizedSession(sessionId, socket.user);

        const roomName = `session:${sessionId}`;
        if (!socket.rooms.has(roomName)) {
          socket.join(roomName);
        }

        const message = await prisma.chatMessage.create({
          data: {
            sessionId,
            senderId: socket.user.id,
            content: trimmed,
            messageType: messageType,
          },
        });

        const formattedMessage = {
          id: message.id,
          sessionId: message.sessionId,
          senderId: message.senderId,
          senderName: socket.user.name,
          senderRole: socket.user.role,
          senderAvatar: socket.user.avatar || null,
          content: message.content,
          messageType: message.messageType,
          createdAt: message.createdAt,
        };

        io.to(roomName).emit('new_message', formattedMessage);

        if (callback) {
          callback({ status: 'ok', message: formattedMessage });
        }
      } catch (err) {
        if (callback) {
          callback({
            error: err.message || 'Failed to send message',
            code: err.code || 'MESSAGE_SEND_ERROR',
          });
        }
      }
    });

    // 3. Leave Session Room
    socket.on('leave_session', (payload) => {
      const sessionId = payload?.sessionId;
      if (sessionId) {
        const roomName = `session:${sessionId}`;
        socket.leave(roomName);
        socket.to(roomName).emit('user_left', {
          sessionId,
          userId: socket.user.id,
          userName: socket.user.name,
        });
      }
    });
  });

  ioInstance = io;
  return io;
}
