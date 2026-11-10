import prisma from '../prisma.js';
import { getAuthorizedSession } from './sessionController.js';
import { getIO } from '../socket/chatSocket.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * GET /api/sessions/:id/messages
 * Retrieve paginated message history for a session.
 */
export async function getSessionMessages(req, res, next) {
  try {
    const { id } = req.params;
    await getAuthorizedSession(id, req.user);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [total, messages] = await Promise.all([
      prisma.chatMessage.count({ where: { sessionId: id } }),
      prisma.chatMessage.findMany({
        where: { sessionId: id },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    // Fetch user details for senders
    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    const senders = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, name: true, role: true, avatar: true },
    });
    const senderMap = new Map(senders.map((s) => [s.id, s]));

    const formatted = messages.map((m) => {
      const sender = senderMap.get(m.senderId);
      return {
        id: m.id,
        sessionId: m.sessionId,
        senderId: m.senderId,
        senderName: sender?.name || 'User',
        senderRole: sender?.role || 'STUDENT',
        senderAvatar: sender?.avatar || null,
        content: m.content,
        messageType: m.messageType,
        createdAt: m.createdAt,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        messages: formatted,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || (total === 0 ? 0 : 1),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/sessions/:id/messages
 * Post a new message via REST API (also broadcasts to connected sockets)
 */
export async function createSessionMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { content, messageType = 'TEXT' } = req.body;

    await getAuthorizedSession(id, req.user);

    const trimmed = (content || '').trim();
    if (!trimmed) {
      return next(new AppError('Message content cannot be empty.', 400, 'VALIDATION_ERROR'));
    }

    if (trimmed.length > 2000) {
      return next(new AppError('Message content cannot exceed 2000 characters.', 400, 'VALIDATION_ERROR'));
    }

    const validTypes = ['TEXT', 'RESOURCE_LINK', 'SYSTEM'];
    const type = validTypes.includes(messageType) ? messageType : 'TEXT';

    const message = await prisma.chatMessage.create({
      data: {
        sessionId: id,
        senderId: req.user.id,
        content: trimmed,
        messageType: type,
      },
    });

    const formattedMessage = {
      id: message.id,
      sessionId: message.sessionId,
      senderId: message.senderId,
      senderName: req.user.name,
      senderRole: req.user.role,
      senderAvatar: req.user.avatar || null,
      content: message.content,
      messageType: message.messageType,
      createdAt: message.createdAt,
    };

    // Broadcast to WebSocket room if initialized
    const io = getIO();
    if (io) {
      io.to(`session:${id}`).emit('new_message', formattedMessage);
    }

    res.status(201).json({
      status: 'success',
      data: {
        message: formattedMessage,
      },
    });
  } catch (err) {
    next(err);
  }
}
