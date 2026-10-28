import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Health and System Routes', () => {
  it('GET /api/health returns 200 OK with runtime status and timestamp', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.message).toBe('Mentor Connect API is running');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.environment).toBeDefined();
  });

  it('GET /api/nonexistent returns structured 404 ROUTE_NOT_FOUND', async () => {
    const res = await request(app).get('/api/nonexistent-endpoint');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('fail');
    expect(res.body.code).toBe('ROUTE_NOT_FOUND');
    expect(res.body.message).toContain('Cannot GET /api/nonexistent-endpoint');
  });
});
