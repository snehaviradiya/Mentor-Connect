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

