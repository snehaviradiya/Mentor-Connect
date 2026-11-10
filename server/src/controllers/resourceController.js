import prisma from '../prisma.js';
import { getAuthorizedSession } from './sessionController.js';
import { getIO } from '../socket/chatSocket.js';
import { AppError } from '../middleware/errorHandler.js';

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * GET /api/sessions/:id/resources
 * Retrieve resources shared in a mentorship session.
 * Accessible only to session participants.
 */
export async function getSessionResources(req, res, next) {
  try {
    const { id } = req.params;
    await getAuthorizedSession(id, req.user);

    const resources = await prisma.sessionResource.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'desc' },
    });

    const sharerIds = [...new Set(resources.map((r) => r.sharedById))];
    const users = await prisma.user.findMany({
      where: { id: { in: sharerIds } },
      select: { id: true, name: true, role: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const formatted = resources.map((r) => {
      const sharer = userMap.get(r.sharedById);
      return {
        id: r.id,
        sessionId: r.sessionId,
        title: r.title,
        url: r.url,
        description: r.description,
        sharedBy: {
          id: r.sharedById,
          name: sharer?.name || 'User',
          role: sharer?.role || 'STUDENT',
        },
        createdAt: r.createdAt,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        resources: formatted,
        total: formatted.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/sessions/:id/resources
 * Share a resource link within a mentorship session.
 */
export async function addSessionResource(req, res, next) {
  try {
    const { id } = req.params;
    const { title, url, description } = req.body;

    await getAuthorizedSession(id, req.user);

    const trimmedTitle = (title || '').trim();
    if (!trimmedTitle) {
      return next(new AppError('Resource title is required.', 400, 'VALIDATION_ERROR'));
    }
    if (trimmedTitle.length > 200) {
      return next(new AppError('Resource title cannot exceed 200 characters.', 400, 'VALIDATION_ERROR'));
    }

    const trimmedUrl = (url || '').trim();
    if (!trimmedUrl || !isValidUrl(trimmedUrl)) {
      return next(
        new AppError('A valid HTTP or HTTPS resource URL is required.', 400, 'VALIDATION_ERROR')
      );
    }

    const trimmedDesc = (description || '').trim();
    if (trimmedDesc.length > 1000) {
      return next(new AppError('Description cannot exceed 1000 characters.', 400, 'VALIDATION_ERROR'));
    }

    const resource = await prisma.sessionResource.create({
      data: {
        sessionId: id,
        sharedById: req.user.id,
        title: trimmedTitle,
        url: trimmedUrl,
        description: trimmedDesc || null,
      },
    });

    const formatted = {
      id: resource.id,
      sessionId: resource.sessionId,
      title: resource.title,
      url: resource.url,
      description: resource.description,
      sharedBy: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role,
      },
      createdAt: resource.createdAt,
    };

    // Broadcast new resource notification via socket to the session room
    const io = getIO();
    if (io) {
      io.to(`session:${id}`).emit('new_resource', formatted);
    }

    res.status(201).json({
      status: 'success',
      message: 'Resource shared successfully in session.',
      data: {
        resource: formatted,
      },
    });
  } catch (err) {
    next(err);
  }
}
