import { AppError } from './errorHandler.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Helper to get today's date formatted as YYYY-MM-DD in local time
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates that a string is a strictly valid calendar date in YYYY-MM-DD format.
 */
export function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr)) return false;
  const parsed = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === dateStr;
}

/**
 * Validates that a timeSlot label is non-empty and well-formed.
 */
export function isValidTimeSlot(slot) {
  if (typeof slot !== 'string') return false;
  const trimmed = slot.trim();
  return trimmed.length >= 3 && trimmed.length <= 100;
}

/**
 * Validate booking creation request payload.
 */
export function validateBookingInput(req, res, next) {
  const { mentorId, studentName, studentEmail, sessionDate, timeSlot, sessionTopic, notes } = req.body;
  const errors = [];
  const todayStr = getTodayDateString();

  if (!mentorId || typeof mentorId !== 'string' || !mentorId.trim()) {
    errors.push('mentorId is required.');
  }

  const trimmedName = typeof studentName === 'string' ? studentName.trim() : '';
  if (!trimmedName) {
    errors.push('studentName is required.');
  } else if (trimmedName.length < 2) {
    errors.push('studentName must be at least 2 characters.');
  }

  const trimmedEmail = typeof studentEmail === 'string' ? studentEmail.trim() : '';
  if (!trimmedEmail) {
    errors.push('studentEmail is required.');
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.push('Please provide a valid email address.');
  }

  if (!sessionDate || typeof sessionDate !== 'string' || !isValidDateString(sessionDate)) {
    errors.push('sessionDate is required in YYYY-MM-DD format.');
  } else if (sessionDate < todayStr) {
    errors.push('sessionDate cannot be in the past');
  }

  if (!timeSlot || !isValidTimeSlot(timeSlot)) {
    errors.push('timeSlot is required.');
  }

  const trimmedTopic = typeof sessionTopic === 'string' ? sessionTopic.trim() : '';
  if (!trimmedTopic) {
    errors.push('sessionTopic is required.');
  } else if (trimmedTopic.length > 150) {
    errors.push('sessionTopic cannot exceed 150 characters.');
  }

  if (notes && typeof notes === 'string' && notes.length > 500) {
    errors.push('notes cannot exceed 500 characters.');
  }

  if (errors.length > 0) {
    return next(
      new AppError('Invalid booking parameters provided', 400, 'VALIDATION_ERROR', errors)
    );
  }

  // Attach sanitized fields
  req.body.studentName = trimmedName;
  req.body.studentEmail = trimmedEmail;
  req.body.sessionTopic = trimmedTopic;
  if (typeof notes === 'string') {
    req.body.notes = notes.trim();
  }

  next();
}

/**
 * Validate user registration request payload.
 */
export function validateRegistrationInput(req, res, next) {
  const { name, email, password, role } = req.body;
  const errors = [];

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName || trimmedName.length < 2) {
    errors.push('Name is required and must be at least 2 characters.');
  }

  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters.');
  }

  const allowedRoles = ['STUDENT', 'MENTOR'];
  const userRole = role ? role.toUpperCase() : 'STUDENT';
  if (!allowedRoles.includes(userRole)) {
    errors.push(`Role must be one of: ${allowedRoles.join(', ')}.`);
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors));
  }

  req.body.name = trimmedName;
  req.body.email = trimmedEmail.toLowerCase();
  req.body.role = userRole;

  next();
}

/**
 * Validate user login request payload.
 */
export function validateLoginInput(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors));
  }

  req.body.email = trimmedEmail.toLowerCase();
  next();
}
