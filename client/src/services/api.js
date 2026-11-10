/**
 * API service for Mentor Connect.
 * Uses native fetch with standard JSON payloads.
 */

export class ApiError extends Error {
  constructor(message, status, code = null, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function handleResponse(response) {
  let data = null;
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = text ? { message: text } : null;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    const code = data?.code || null;
    const details = data?.details || null;
    throw new ApiError(message, response.status, code, details);
  }

  return data;
}

/**
 * Creates a new booking session for a mentor.
 *
 * @param {Object} payload
 * @param {string} payload.mentorId
 * @param {string} payload.studentName
 * @param {string} payload.studentEmail
 * @param {string} payload.sessionDate - YYYY-MM-DD
 * @param {string} payload.timeSlot - slot label string
 * @param {string} payload.sessionTopic - max 150 chars
 * @param {string} [payload.notes] - max 500 chars
 * @returns {Promise<Object>} The server response containing the created booking record
 */
export async function createBooking(payload) {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Unable to connect to the server. Please check your network connection.',
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Fetches canonical mentors list from the API.
 *
 * @returns {Promise<Object>} The server response containing mentors array
 */
export async function fetchMentors() {
  try {
    const response = await fetch('/api/mentors');
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Unable to fetch mentors from the server. Please check your network connection.',
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Updates an existing mentor profile.
 *
 * @param {string} mentorId
 * @param {Object} payload
 * @returns {Promise<Object>} The server response containing updated mentor data
 */
export async function updateMentorProfile(mentorId, payload) {
  try {
    const response = await fetch(`/api/mentors/${mentorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Unable to update mentor profile. Please check your network connection.',
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Creates or derives a session from a booking.
 */
export async function createSession(bookingId, token) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ bookingId }),
    });

    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to create session.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Fetches sessions for the authenticated user.
 */
export async function fetchSessions(status, token) {
  try {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const query = status ? `?status=${encodeURIComponent(status)}` : '';

    const response = await fetch(`/api/sessions${query}`, { headers });
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to fetch sessions.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Fetches secure meeting configuration and room information for a session.
 */
export async function fetchMeetingInfo(sessionId, token) {
  try {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/sessions/${sessionId}/meeting`, { headers });
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to retrieve meeting details.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Fetches paginated chat message history for a session.
 */
export async function fetchSessionMessages(sessionId, token, page = 1, limit = 50) {
  try {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/sessions/${sessionId}/messages?page=${page}&limit=${limit}`, {
      headers,
    });
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to fetch session messages.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Sends a chat message in a session.
 */
export async function sendSessionMessage(sessionId, content, messageType = 'TEXT', token) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content, messageType }),
    });

    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to send message.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Fetches resources shared within a session.
 */
export async function fetchSessionResources(sessionId, token) {
  try {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/sessions/${sessionId}/resources`, { headers });
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to fetch session resources.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Shares a resource link within a session.
 */
export async function shareSessionResource(sessionId, payload, token) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/sessions/${sessionId}/resources`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to share session resource.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Completes a mentorship session.
 */
export async function completeSessionApi(sessionId, token) {
  try {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/sessions/${sessionId}/complete`, {
      method: 'PATCH',
      headers,
    });

    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to complete session.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Submits verified student feedback for a completed mentorship session.
 */
export async function submitSessionReview(sessionId, payload, token) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/sessions/${sessionId}/reviews`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to submit session review.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Fetches verified completed-session reviews for a mentor profile.
 */
export async function fetchMentorReviews(mentorId) {
  try {
    const response = await fetch(`/api/mentors/${mentorId}/reviews`);
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to fetch mentor reviews.', 0, 'NETWORK_ERROR');
  }
}


