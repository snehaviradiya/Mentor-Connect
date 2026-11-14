import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import { AppError } from './errorHandler.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith('replace-with-')) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return secret;
}

/**
 * Sign a JWT token for a given user payload.
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Require valid JWT authentication.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required. Bearer token missing.', 401, 'UNAUTHORIZED'));
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, getJwtSecret());
    } catch (err) {
      return next(new AppError('Invalid or expired authentication token.', 401, 'TOKEN_INVALID'));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        mentorProfile: true,
        menteeProfile: true,
      },
    });

    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401, 'USER_NOT_FOUND'));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication: attaches user if token is provided and valid, otherwise proceeds as guest.
 */
export async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    try {
      const       decoded = jwt.verify(token, getJwtSecret());
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          mentorProfile: true,
          menteeProfile: true,
        },
      });
      if (user) {
        req.user = user;
      }
    } catch {
      // Ignored for optional auth
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-based authorization middleware.
 * Example: requireRole('ADMIN', 'MENTOR')
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Role ${req.user.role} does not have required permissions.`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}
