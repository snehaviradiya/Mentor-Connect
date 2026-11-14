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
  } else if (notes !== undefined && typeof notes !== 'string') {
    errors.push('notes must be a string.');
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

  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('Password is required and must be at least 8 characters.');
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

export function validateProfileUpdate(req, res, next) {
  const {
    name,
    university,
    major,
    graduationYear,
    title,
    category,
    bio,
    expertise,
    mentoringTopics,
    sampleAvailability,
    education,
    experience,
  } = req.body;
  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100)) {
    errors.push('name must be between 2 and 100 characters.');
  }
  if (university !== undefined && (typeof university !== 'string' || university.trim().length > 120)) {
    errors.push('university must be a string of at most 120 characters.');
  }
  if (major !== undefined && (typeof major !== 'string' || major.trim().length > 120)) {
    errors.push('major must be a string of at most 120 characters.');
  }
  if (graduationYear !== undefined && graduationYear !== null &&
    (!Number.isInteger(graduationYear) || graduationYear < 1900 || graduationYear > 2200)) {
    errors.push('graduationYear must be a valid year.');
  }
  if (title !== undefined && (typeof title !== 'string' || title.trim().length > 160)) {
    errors.push('title must be a string of at most 160 characters.');
  }
  if (category !== undefined && (typeof category !== 'string' || category.trim().length > 100)) {
    errors.push('category must be a string of at most 100 characters.');
  }
  if (bio !== undefined && (typeof bio !== 'string' || bio.trim().length > 1000)) {
    errors.push('bio must be a string of at most 1000 characters.');
  }
  for (const [field, value, max] of [
    ['sampleAvailability', sampleAvailability, 200],
    ['education', education, 200],
    ['experience', experience, 100],
  ]) {
    if (value !== undefined && (typeof value !== 'string' || value.trim().length > max)) {
      errors.push(`${field} must be a string of at most ${max} characters.`);
    }
  }
  for (const [field, value] of [['expertise', expertise], ['mentoringTopics', mentoringTopics]]) {
    if (value !== undefined &&
      (!Array.isArray(value) || value.length > 30 ||
        value.some((item) => typeof item !== 'string' || !item.trim() || item.length > 100))) {
      errors.push(`${field} must be an array of up to 30 non-empty strings.`);
    }
  }

  if (errors.length) {
    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors));
  }
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
