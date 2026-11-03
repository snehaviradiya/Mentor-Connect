import express from 'express';
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getAllowedOrigins } from '../middleware/cors.js';
import { createRateLimiters } from '../middleware/rateLimit.js';

describe('CORS policy', () => {
  it('allows configured origins and localhost development origins', async () => {
    const allowed = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(allowed.status).toBe(200);
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
  });

  it('rejects origins outside the allowlist with a consistent 403 response', async () => {
    const rejected = await request(app)
      .get('/api/health')
      .set('Origin', 'https://untrusted.example');

    expect(rejected.status).toBe(403);
    expect(rejected.body.code).toBe('CORS_ORIGIN_FORBIDDEN');
    expect(rejected.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows origin-less requests and supports comma-separated configured origins', async () => {
    const originless = await request(app).get('/api/health');
    const configured = getAllowedOrigins({
      NODE_ENV: 'production',
      CORS_ORIGIN: 'https://app.example.com, http://localhost:5174, *',
    });

    expect(originless.status).toBe(200);
    expect(configured.has('https://app.example.com')).toBe(true);
    expect(configured.has('http://localhost:5174')).toBe(true);
    expect(configured.has('*')).toBe(false);
    expect(configured.has('http://localhost:5173')).toBe(false);
  });
});

describe('Rate limiting', () => {
  it('uses standard headers and a consistent 429 body on authentication routes', async () => {
    const { apiLimiter, authLimiter } = createRateLimiters({ windowMs: 60_000, apiMax: 1, authMax: 1 });
    const testApp = express();
    testApp.use('/api/', apiLimiter);
    testApp.get('/api/auth/login', authLimiter, (req, res) => res.status(200).json({ status: 'ok' }));
    testApp.get('/api/resource', (req, res) => res.status(200).json({ status: 'ok' }));

    const first = await request(testApp).get('/api/auth/login');
    const second = await request(testApp).get('/api/auth/login');
    const normalRequest = await request(testApp).get('/api/resource');
    const normalRequestLimited = await request(testApp).get('/api/resource');

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.body).toEqual({
      status: 'fail',
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests. Please try again later.',
    });
    expect(second.headers['ratelimit-limit']).toBeDefined();
    expect(second.headers['x-ratelimit-limit']).toBeUndefined();
    expect(normalRequest.status).toBe(200);
    expect(normalRequestLimited.status).toBe(429);
  });

  it('does not apply the API request limit to health checks', async () => {
    const responses = await Promise.all(
      Array.from({ length: 105 }, () => request(app).get('/api/health')),
    );

    expect(responses.every((response) => response.status === 200)).toBe(true);
  });
});