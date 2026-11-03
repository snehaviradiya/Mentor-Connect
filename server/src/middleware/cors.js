import cors from 'cors';
import { AppError } from './errorHandler.js';

const LOCALHOST_ORIGINS = ['http://localhost:5173', 'http://localhost:3000'];

export function getAllowedOrigins(env = process.env) {
  const configuredOrigins = String(env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin && origin !== '*');
  const developmentOrigins = env.NODE_ENV === 'production' ? [] : LOCALHOST_ORIGINS;

  return new Set([...developmentOrigins, ...configuredOrigins]);
}

export function createCorsMiddleware(env = process.env) {
  const allowedOrigins = getAllowedOrigins(env);

  return cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new AppError('Origin is not allowed by CORS policy.', 403, 'CORS_ORIGIN_FORBIDDEN'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}