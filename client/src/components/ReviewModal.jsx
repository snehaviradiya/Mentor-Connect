import { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext.jsx';

const DEFAULT_REVIEW_TAGS = [
  'Clear Explanations',
  'Actionable Guidance',
  'Deep Technical Depth',
  'Helpful Code Review',
  'Friendly & Patient',
  'System Design Depth',
  'Industry Insights',
  'Career Advice',
];

export default function ReviewModal({
  mentor,
  initialTopic = '',
  onClose,
  onSubmitReview,
}) {
  const modalRef = useRef(null);
  const toast = useToast();

  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [studentName, setStudentName] = useState('Jiya Srivastava');
  const [sessionTopic, setSessionTopic] = useState(initialTopic || mentor?.mentoringTopics?.[0] || 'Capstone Mentorship Consultation');
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState(['Clear Explanations', 'Actionable Guidance']);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on Escape & trap focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!mentor) return null;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getRatingLabel = (val) => {
    switch (val) {
      case 1:
        return 'Needs Improvement';
      case 2:
        return 'Fair Session';
      case 3:
        return 'Good Consultation';
      case 4:
        return 'Very Good & Insightful';
      case 5:
        return 'Exceptional & Outstanding! ⭐';
      default:
        return '';
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!rating || rating < 1 || rating > 5) {
      newErrors.rating = 'Please choose a rating between 1 and 5 stars.';
    }
    if (!studentName.trim()) {
      newErrors.studentName = 'Student name is required.';
    }
    if (!sessionTopic.trim()) {
      newErrors.sessionTopic = 'Session topic is required.';
    }
    if (!feedback.trim()) {
      newErrors.feedback = 'Please provide constructive review comments.';
    } else if (feedback.trim().length < 15) {
      newErrors.feedback = 'Review feedback must be at least 15 characters long.';
    } else if (feedback.length > 500) {
      newErrors.feedback = 'Review cannot exceed 500 characters.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      toast.error('Please complete all required review fields.', 'Validation Error');
      return;
    }

    setIsSubmitting(true);

    const newReview = {
      id: `rev-${Date.now()}`,
      studentName: studentName.trim(),
      avatarInitials: studentName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'ST',
      rating: Number(rating),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      sessionTopic: sessionTopic.trim(),
      feedback: feedback.trim(),
      verified: true,
      tags: selectedTags,
      helpfulCount: 0,
    };

    if (onSubmitReview) {
      onSubmitReview(newReview);
    }

    toast.success(
      `Your verified review for ${mentor.name} has been published! Thank you for supporting fellow students.`,
      'Review Submitted'
    );

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      className="modal-backdrop review-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="modal-container review-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 id="review-modal-title" className="modal-title">
              Rate &amp; Review Mentor
            </h2>
            <p className="modal-subtitle">
              With <strong>{mentor.name}</strong> • {mentor.category}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close review modal"
          >
            ✕
          </button>
        </div>

        {/* Verified Review Badge Banner */}
        <div className="verified-review-banner" role="note">
          <span className="verified-icon" aria-hidden="true">✓</span>
          <p>
            <strong>Verified Session Testimonial:</strong> Your review will appear with the verified student badge on {mentor.name}&apos;s profile to help ADYPU peers choose the right guidance.
          </p>
        </div>

        {/* Review Form */}
        <form className="review-form" onSubmit={handleSubmit} noValidate>
          {/* 1. Star Rating Selector */}
          <div className="form-group rating-selector-group">
            <label className="form-label" id="rating-label">
              Overall Session Rating <span className="required-star">*</span>
            </label>
            <div
              className="star-rating-selector"
              role="radiogroup"
              aria-labelledby="rating-label"
            >
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isLit = (hoveredRating || rating) >= starVal;
                return (
                  <button
                    key={starVal}
                    type="button"
                    role="radio"
                    aria-checked={rating === starVal}
                    className={`star-btn ${isLit ? 'star-lit' : ''}`}
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoveredRating(starVal)}
                    onMouseLeave={() => setHoveredRating(0)}
                    aria-label={`${starVal} star${starVal > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                );
              })}
              <span className="rating-descriptor">
                {getRatingLabel(hoveredRating || rating)}
              </span>
            </div>
            {errors.rating && <p className="field-error-msg">{errors.rating}</p>}
          </div>

          {/* 2. Reviewer Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reviewer-name">
              Your Name <span className="required-star">*</span>
            </label>
            <input
              id="reviewer-name"
              type="text"
              className={`form-input ${errors.studentName ? 'input-error' : ''}`}
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Jiya Srivastava"
              required
            />
            {errors.studentName && (
              <p className="field-error-msg">{errors.studentName}</p>
            )}
          </div>

          {/* 3. Session Topic */}
          <div className="form-group">
            <label className="form-label" htmlFor="review-session-topic">
              Session Topic / Consultation Focus <span className="required-star">*</span>
            </label>
            <input
              id="review-session-topic"
              type="text"
              className={`form-input ${errors.sessionTopic ? 'input-error' : ''}`}
              value={sessionTopic}
              onChange={(e) => setSessionTopic(e.target.value)}
              placeholder="e.g. React Architecture Review & Code Optimization"
              required
            />
            {errors.sessionTopic && (
              <p className="field-error-msg">{errors.sessionTopic}</p>
            )}
          </div>

          {/* 4. Highlight Tags (What went great?) */}
          <div className="form-group">
            <label className="form-label">
              What went great during this session? (Optional highlights)
            </label>
            <div className="review-tag-pills" aria-label="Review highlight tags">
              {DEFAULT_REVIEW_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-pill-btn ${isSelected ? 'tag-selected' : ''}`}
                    onClick={() => toggleTag(tag)}
                    aria-pressed={isSelected}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Feedback Comment */}
          <div className="form-group">
            <div className="label-with-counter">
              <label className="form-label" htmlFor="review-feedback">
                Detailed Feedback &amp; Testimonial <span className="required-star">*</span>
              </label>
              <span className="char-counter" aria-live="polite">
                {feedback.length}/500
              </span>
            </div>
            <textarea
              id="review-feedback"
              rows="4"
              className={`form-textarea ${errors.feedback ? 'input-error' : ''}`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={500}
              placeholder="Describe how the mentor helped you, their key technical insights, clarity of advice, and recommendations for other students..."
              required
            />
            {errors.feedback && (
              <p className="field-error-msg">{errors.feedback}</p>
            )}
          </div>

          {/* Footer Actions */}
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
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting Review...' : 'Submit Verified Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

