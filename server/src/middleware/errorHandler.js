/**
 * Custom application error class for structured error responses.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Express error handling middleware.
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
  const code = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');

  const responsePayload = {
    status,
    code,
    message: err.message || 'An unexpected internal error occurred on the server.',
  };

  if (err.details) {
    responsePayload.details = err.details;
  }

  // Handle Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({
      status: 'fail',
      code: 'DUPLICATE_RESOURCE',
      message: `A record with this ${err.meta?.target || 'field'} already exists.`,
    });
  }

  // Handle Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      status: 'fail',
      code: 'RESOURCE_NOT_FOUND',
      message: 'The requested resource could not be found.',
    });
  }

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('Unhandled Server Error:', err);
  }

  res.status(statusCode).json(responsePayload);
}
