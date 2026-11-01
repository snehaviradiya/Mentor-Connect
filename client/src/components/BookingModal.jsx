import { useState, useEffect, useRef } from 'react';
import { DEMO_TIME_SLOTS } from '../data/mockMentors.js';
import { createBooking } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

// Deterministic helper to get today's date formatted as YYYY-MM-DD
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function BookingModal({ mentor, onClose }) {
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  const toast = useToast();

  // Form field states
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [sessionTopic, setSessionTopic] = useState('');
  const [notes, setNotes] = useState('');

  // UI / validation / API states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null); // null | 'success' | 'conflict'
  const [submittedData, setSubmittedData] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [conflictMessage, setConflictMessage] = useState(null);

  // Focus trap and Escape key listener
  useEffect(() => {
    // Focus initial interactive element
    const timer = setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, submissionResult]);

  if (!mentor) return null;

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    const todayStr = getTodayDateString();

    const trimmedName = studentName.trim();
    if (!trimmedName) {
      newErrors.studentName = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      newErrors.studentName = 'Full name must be at least 2 characters.';
    }

    const trimmedEmail = studentEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      newErrors.studentEmail = 'Email address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.studentEmail = 'Please enter a valid email address (e.g. student@adypu.edu.in).';
    }

    if (!sessionDate) {
      newErrors.sessionDate = 'Session date is required.';
    } else if (sessionDate < todayStr) {
      newErrors.sessionDate = 'Session date cannot be in the past.';
    }

    if (!selectedSlotId) {
      newErrors.selectedSlotId = 'Please select a demo time slot.';
    }

    const trimmedTopic = sessionTopic.trim();
    if (!trimmedTopic) {
      newErrors.sessionTopic = 'Session objective/topic is required.';
    } else if (trimmedTopic.length > 150) {
      newErrors.sessionTopic = 'Session objective cannot exceed 150 characters.';
    }

    if (notes.length > 500) {
      newErrors.notes = 'Optional notes cannot exceed 500 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      toast.error('Please fill in all required booking details.', 'Validation Error');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const chosenSlot = DEMO_TIME_SLOTS.find((s) => s.id === selectedSlotId);
    const timeSlotLabel = chosenSlot ? chosenSlot.label : selectedSlotId;

    const payload = {
      mentorId: mentor.id,
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim(),
      sessionDate,
      timeSlot: timeSlotLabel,
      sessionTopic: sessionTopic.trim(),
      notes: notes.trim(),
    };

    try {
      const response = await createBooking(payload);
      if (response && response.status === 'success' && response.data) {
        setSubmittedData(response.data);
        setSubmissionResult('success');
        toast.bookingApproved(
          `Demo session booked with ${mentor.name} for ${sessionDate} at ${timeSlotLabel}!`,
          'Session Confirmed'
        );
      } else {
        throw new Error('Unexpected server response format');
      }
    } catch (err) {
      if (err.status === 409 || err.code === 'SLOT_UNAVAILABLE') {
        const conflictMsg =
          err.message || 'The selected time slot is already booked for this mentor.';
        setConflictMessage(conflictMsg);
        setSubmittedData({
          timeSlot: timeSlotLabel,
          sessionDate,
          mentorName: mentor.name,
        });
        setSubmissionResult('conflict');
        toast.error(conflictMsg, 'Time Slot Unavailable');
      } else if (err.status === 400) {
        const detailsMsg =
          Array.isArray(err.details) && err.details.length > 0
            ? err.details.join('. ')
            : err.message || 'Invalid booking parameters provided.';
        setServerError(detailsMsg);
        toast.error(detailsMsg, 'Booking Failed');
      } else if (err.status === 404) {
        const notFoundMsg = err.message || 'Mentor not found on server.';
        setServerError(notFoundMsg);
        toast.error(notFoundMsg, 'Mentor Not Found');
      } else if (err.code === 'NETWORK_ERROR') {
        const netMsg =
          err.message || 'Unable to connect to the server. Please check your network connection.';
        setServerError(netMsg);
        toast.error(netMsg, 'Network Error');
      } else {
        const genericMsg = err.message || 'A server error occurred. Please try again later.';
        setServerError(genericMsg);
        toast.error(genericMsg, 'Booking Error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        {/* Modal Top Header */}
        <div className="modal-header">
          <div>
            <h2 id="booking-modal-title" className="modal-title">
              Request a Demo Session
            </h2>
            <p className="modal-subtitle">
              With <strong>{mentor.name}</strong> • {mentor.category}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close booking modal"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {/* API Integration Notice */}
        <div className="demo-modal-alert" role="note">
          <span className="demo-alert-icon" aria-hidden="true">ℹ️</span>
          <p>
            <strong>Live Booking Integration:</strong> Session requests are validated and recorded by
            the Mentor Connect API. Bookings are stored in memory during Milestone 3.
          </p>
        </div>

        {/* Modal Body: Either Form or API Outcome */}
        {submissionResult === 'success' ? (
          /* Success Receipt View */
          <div className="outcome-view success-view" role="status" aria-live="polite">
            <div className="outcome-icon-wrapper success-icon">✓</div>
            <h3 className="outcome-title">Session Confirmed &amp; Booked</h3>
            <p className="outcome-tagline">
              Your appointment request has been confirmed by the API server.
            </p>

            <div className="booking-summary-card">
              <h4 className="summary-title">Booking Confirmation Receipt</h4>
              <dl className="summary-details">
                <div className="summary-row">
                  <dt>Booking ID:</dt>
                  <dd>
                    <code>{submittedData.bookingId}</code>
                  </dd>
                </div>
                <div className="summary-row">
                  <dt>Status:</dt>
                  <dd>
                    <span style={{ color: '#047857', fontWeight: 700, textTransform: 'capitalize' }}>
                      {submittedData.status || 'Confirmed'}
                    </span>
                  </dd>
                </div>
                <div className="summary-row">
                  <dt>Mentor:</dt>
                  <dd>{submittedData.mentorName || mentor.name}</dd>
                </div>
                <div className="summary-row">
                  <dt>Student:</dt>
                  <dd>{submittedData.studentName} ({submittedData.studentEmail})</dd>
                </div>
                <div className="summary-row">
                  <dt>Date &amp; Time:</dt>
                  <dd>{submittedData.sessionDate} at {submittedData.timeSlot}</dd>
                </div>
                <div className="summary-row">
                  <dt>Objective:</dt>
                  <dd>{submittedData.sessionTopic}</dd>
                </div>
                {submittedData.notes && (
                  <div className="summary-row">
                    <dt>Notes:</dt>
                    <dd>{submittedData.notes}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="outcome-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={onClose}
              >
                Return to Mentor Profile
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSubmissionResult(null);
                  setServerError(null);
                }}
              >
                Book Another Session
              </button>
            </div>
          </div>
        ) : submissionResult === 'conflict' ? (
          /* Conflict View */
          <div className="outcome-view conflict-view" role="status" aria-live="polite">
            <div className="outcome-icon-wrapper conflict-icon">⚠️</div>
            <h3 className="outcome-title">Time Slot Unavailable</h3>
            <p className="outcome-tagline">
              {conflictMessage || 'The selected time slot is already booked for this mentor.'}
            </p>

            <div className="conflict-details-card">
              <p>
                <strong>Requested Slot:</strong> {submittedData?.timeSlot} on {submittedData?.sessionDate}
              </p>
              <p className="conflict-hint">
                Another student has already reserved this slot. Please select a different time or date.
              </p>
            </div>

            <div className="outcome-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setSubmissionResult(null);
                  setServerError(null);
                }}
              >
                Choose Another Time Slot
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
              >
                Cancel and Close
              </button>
            </div>
          </div>
        ) : (
          /* Interactive Booking Form */
          <form className="booking-form" onSubmit={handleSubmit} noValidate>
            {/* Server Error Alert Banner */}
            {serverError && (
              <div
                className="demo-modal-alert"
                style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5' }}
                role="alert"
              >
                <span className="demo-alert-icon" aria-hidden="true">⚠️</span>
                <p style={{ color: '#991b1b', fontWeight: 500 }}>
                  <strong>Booking Error:</strong> {serverError}
                </p>
              </div>
            )}

            {/* Student Name */}
            <div className="form-group">
              <label htmlFor="student-name" className="form-label">
                Your Full Name <span className="required-star">*</span>
              </label>
              <input
                ref={firstInputRef}
                id="student-name"
                type="text"
                className={`form-input ${errors.studentName ? 'input-error' : ''}`}
                placeholder="e.g. Abhay Kumar"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  if (errors.studentName) setErrors({ ...errors, studentName: null });
                  if (serverError) setServerError(null);
                }}
                aria-invalid={!!errors.studentName}
                aria-describedby={errors.studentName ? 'student-name-error' : undefined}
                disabled={isSubmitting}
                required
              />
              {errors.studentName && (
                <p id="student-name-error" className="field-error" role="alert">
                  {errors.studentName}
                </p>
              )}
            </div>

            {/* Student Email */}
            <div className="form-group">
              <label htmlFor="student-email" className="form-label">
                University Email Address <span className="required-star">*</span>
              </label>
              <input
                id="student-email"
                type="email"
                className={`form-input ${errors.studentEmail ? 'input-error' : ''}`}
                placeholder="e.g. abhay@adypu.edu.in"
                value={studentEmail}
                onChange={(e) => {
                  setStudentEmail(e.target.value);
                  if (errors.studentEmail) setErrors({ ...errors, studentEmail: null });
                  if (serverError) setServerError(null);
                }}
                aria-invalid={!!errors.studentEmail}
                aria-describedby={errors.studentEmail ? 'student-email-error' : undefined}
                disabled={isSubmitting}
                required
              />
              {errors.studentEmail && (
                <p id="student-email-error" className="field-error" role="alert">
                  {errors.studentEmail}
                </p>
              )}
            </div>

            {/* Session Date & Demo Slot Selection (Row) */}
            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="session-date" className="form-label">
                  Session Date <span className="required-star">*</span>
                </label>
                <input
                  id="session-date"
                  type="date"
                  min={getTodayDateString()}
                  className={`form-input ${errors.sessionDate ? 'input-error' : ''}`}
                  value={sessionDate}
                  onChange={(e) => {
                    setSessionDate(e.target.value);
                    if (errors.sessionDate) setErrors({ ...errors, sessionDate: null });
                    if (serverError) setServerError(null);
                  }}
                  aria-invalid={!!errors.sessionDate}
                  aria-describedby={errors.sessionDate ? 'session-date-error' : undefined}
                  disabled={isSubmitting}
                  required
                />
                {errors.sessionDate && (
                  <p id="session-date-error" className="field-error" role="alert">
                    {errors.sessionDate}
                  </p>
                )}
              </div>

              <div className="form-group flex-1">
                <label htmlFor="demo-time-slot" className="form-label">
                  Demo Time Slot <span className="required-star">*</span>
                </label>
                <select
                  id="demo-time-slot"
                  className={`form-select ${errors.selectedSlotId ? 'input-error' : ''}`}
                  value={selectedSlotId}
                  onChange={(e) => {
                    setSelectedSlotId(e.target.value);
                    if (errors.selectedSlotId) setErrors({ ...errors, selectedSlotId: null });
                    if (serverError) setServerError(null);
                  }}
                  aria-invalid={!!errors.selectedSlotId}
                  aria-describedby={errors.selectedSlotId ? 'demo-time-slot-error' : 'slot-hint'}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">-- Select an illustrative slot --</option>
                  {DEMO_TIME_SLOTS.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                {errors.selectedSlotId ? (
                  <p id="demo-time-slot-error" className="field-error" role="alert">
                    {errors.selectedSlotId}
                  </p>
                ) : (
                  <p id="slot-hint" className="field-hint">
                    Select a consultation time window with {mentor.name}.
                  </p>
                )}
              </div>
            </div>

            {/* Session Objective */}
            <div className="form-group">
              <div className="label-with-counter">
                <label htmlFor="session-topic" className="form-label">
                  Session Objective / Topic <span className="required-star">*</span>
                </label>
                <span className="char-counter" aria-live="polite">
                  {sessionTopic.length}/150
                </span>
              </div>
              <input
                id="session-topic"
                type="text"
                maxLength={150}
                className={`form-input ${errors.sessionTopic ? 'input-error' : ''}`}
                placeholder="e.g. Capstone frontend review & API data modeling guidance"
                value={sessionTopic}
                onChange={(e) => {
                  setSessionTopic(e.target.value);
                  if (errors.sessionTopic) setErrors({ ...errors, sessionTopic: null });
                  if (serverError) setServerError(null);
                }}
                aria-invalid={!!errors.sessionTopic}
                aria-describedby={errors.sessionTopic ? 'session-topic-error' : undefined}
                disabled={isSubmitting}
                required
              />
              {errors.sessionTopic && (
                <p id="session-topic-error" className="field-error" role="alert">
                  {errors.sessionTopic}
                </p>
              )}
            </div>

            {/* Optional Notes */}
            <div className="form-group">
              <div className="label-with-counter">
                <label htmlFor="session-notes" className="form-label">
                  Additional Notes (Optional)
                </label>
                <span className="char-counter" aria-live="polite">
                  {notes.length}/500
                </span>
              </div>
              <textarea
                id="session-notes"
                maxLength={500}
                rows={3}
                className={`form-textarea ${errors.notes ? 'input-error' : ''}`}
                placeholder="Specific questions, repository links, or topics to prioritize..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  if (errors.notes) setErrors({ ...errors, notes: null });
                  if (serverError) setServerError(null);
                }}
                aria-invalid={!!errors.notes}
                aria-describedby={errors.notes ? 'session-notes-error' : undefined}
                disabled={isSubmitting}
              />
              {errors.notes && (
                <p id="session-notes-error" className="field-error" role="alert">
                  {errors.notes}
                </p>
              )}
            </div>

            {/* Form Actions */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary btn-primary-with-icon"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    Submitting...
                  </>
                ) : (
                  'Submit Booking Request'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
