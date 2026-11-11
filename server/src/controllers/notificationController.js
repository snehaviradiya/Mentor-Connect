import prisma from '../prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export async function createUserNotification(
  userId,
  { type = 'INFO', title, message, entityType = null, entityId = null }
) {
  if (!userId) {
    return null;
  }

  const normalizedType = String(type || 'INFO');
  const normalizedTitle = String(title || 'Notification').trim();
  const normalizedMessage = String(message || '').trim();

  if (!normalizedMessage) {
    return null;
  }

  if (entityType && entityId) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: normalizedType,
        entityType,
        entityId,
      },
    });

    if (existing) {
      return existing;
    }
  }

  return prisma.notification.create({
    data: {
      userId,
      type: normalizedType,
      title: normalizedTitle,
      message: normalizedMessage,
      entityType,
      entityId,
    },
  });
}

export async function listUserNotifications(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const [total, notifications] = await Promise.all([
      prisma.notification.count({
        where: { userId: req.user.id },
      }),
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        notifications: notifications.map((notification) => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          read: notification.read,
          entityType: notification.entityType,
          entityId: notification.entityId,
          createdAt: notification.createdAt,
        })),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return next(new AppError('Notification not found.', 404, 'NOTIFICATION_NOT_FOUND'));
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.status(200).json({
      status: 'success',
      data: {
        notification: {
          id: updated.id,
          read: updated.read,
          updatedAt: updated.updatedAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
