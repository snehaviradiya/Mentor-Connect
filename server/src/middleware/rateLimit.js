import rateLimit from 'express-rate-limit';

function createLimiter(max, windowMs, skip) {
  return rateLimit({
    windowMs,
    max,
    skip,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        status: 'fail',
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please try again later.',
      });
    },
  });
}

export function createRateLimiters({ windowMs = 15 * 60 * 1000, apiMax = 100, authMax = 10 } = {}) {
  return {
    apiLimiter: createLimiter(apiMax, windowMs, (req) => ['/auth/login', '/auth/register'].includes(req.path)),
    authLimiter: createLimiter(authMax, windowMs),
  };
}

export const { apiLimiter, authLimiter } = createRateLimiters();