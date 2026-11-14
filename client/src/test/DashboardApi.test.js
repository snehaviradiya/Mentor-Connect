import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelBooking, createBooking, fetchStudentDashboard, ApiError } from '../services/api.js';

function jsonResponse(body, ok = true, status = 200) {
  return {
    ok,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
  };
}

describe('authenticated dashboard API service', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetches the student dashboard with the bearer token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ status: 'success', data: { student: {} } })));
    await fetchStudentDashboard('student-token');
    expect(fetch).toHaveBeenCalledWith('/api/dashboard/student', {
      headers: { Authorization: 'Bearer student-token' },
    });
  });

  it('cancels the specified booking with bearer authentication', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ status: 'success', data: { bookingId: 'bk-1', status: 'cancelled' } })));
    const response = await cancelBooking('bk-1', 'student-token');
    expect(fetch).toHaveBeenCalledWith('/api/bookings/bk-1/cancel', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer student-token' },
    });
    expect(response.data.status).toBe('cancelled');
  });

  it('validates a saved token before submitting an authenticated booking', async () => {
    window.sessionStorage.setItem('mentor_connect_token', 'student-token');
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ status: 'success', data: { user: { id: 'user-1', role: 'STUDENT' } } }))
      .mockResolvedValueOnce(jsonResponse({ status: 'success', data: { bookingId: 'bk-1' } })));
    await createBooking({ mentorId: 'mentor-1' });
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(['/api/auth/me', '/api/bookings']);
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer student-token');
    expect(fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer student-token');
  });

  it('does not submit a guest booking when the saved token has expired', async () => {
    window.sessionStorage.setItem('mentor_connect_token', 'expired-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      status: 'fail', code: 'TOKEN_INVALID', message: 'Invalid or expired authentication token.',
    }, false, 401)));
    await expect(createBooking({ mentorId: 'mentor-1' })).rejects.toBeInstanceOf(ApiError);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/auth/me', {
      headers: { Authorization: 'Bearer expired-token' },
    });
  });
});
