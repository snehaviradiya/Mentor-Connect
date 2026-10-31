import { useState, useEffect, useRef } from 'react';
import { MOCK_CATEGORIES } from '../data/mockMentors.js';
import { updateMentorProfile } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function EditProfileModal({ mentor, onClose, onSave }) {
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  const toast = useToast();

  const [name, setName] = useState(mentor?.name || '');
  const [title, setTitle] = useState(mentor?.title || '');
  const [category, setCategory] = useState(mentor?.category || MOCK_CATEGORIES[0]);
  const [bio, setBio] = useState(mentor?.bio || '');
  const [expertiseStr, setExpertiseStr] = useState(
    Array.isArray(mentor?.expertise) ? mentor.expertise.join(', ') : mentor?.expertise || ''
  );
  const [sampleAvailability, setSampleAvailability] = useState(mentor?.sampleAvailability || '');
  const [education, setEducation] = useState(mentor?.education || '');
  const [experience, setExperience] = useState(mentor?.experience || '');
  const [mentoringTopicsStr, setMentoringTopicsStr] = useState(
    Array.isArray(mentor?.mentoringTopics)
      ? mentor.mentoringTopics.join(', ')
      : mentor?.mentoringTopics || ''
  );

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Focus initial element & handle escape key
  useEffect(() => {
    const timer = setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!mentor) return null;

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Professional title is required.';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters.';
    }

    if (!bio.trim()) {
      newErrors.bio = 'Bio / About section is required.';
    } else if (bio.trim().length < 15) {
      newErrors.bio = 'Bio must be at least 15 characters to provide helpful context to students.';
    }

    if (!expertiseStr.trim()) {
      newErrors.expertise = 'Please list at least one expertise skill (comma-separated).';
    }

    if (!sampleAvailability.trim()) {
      newErrors.sampleAvailability = 'Available hours description is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      toast.error('Please resolve the highlighted validation errors.', 'Validation Error');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const parsedExpertise = expertiseStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedTopics = mentoringTopicsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedData = {
      name: name.trim() || mentor.name,
      title: title.trim(),
      category,
      bio: bio.trim(),
      expertise: parsedExpertise,
      sampleAvailability: sampleAvailability.trim(),
      education: education.trim(),
      experience: experience.trim(),
      mentoringTopics: parsedTopics,
    };

    try {
      // Attempt server update
      let response = null;
      try {
        response = await updateMentorProfile(mentor.id, updatedData);
      } catch (apiErr) {
        // If server is not running or network fails, log and fallback to client-side optimistic update
        console.warn('API update failed, applying optimistic update in demo mode:', apiErr);
      }

      const mergedMentor = {
        ...mentor,
        ...updatedData,
        ...(response?.data?.mentor || {}),
      };

      onSave(mergedMentor);
      toast.success(
        `Profile for ${mergedMentor.name} has been successfully updated!`,
        'Profile Updated'
      );
      onClose();
    } catch (err) {
      const errMsg = err.message || 'An unexpected error occurred while saving your profile.';
      setServerError(errMsg);
      toast.error(errMsg, 'Update Failed');
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
        className="modal-container edit-profile-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-modal-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="edit-profile-modal-title" className="modal-title">
              Edit Mentor Profile
            </h2>
            <p className="modal-subtitle">
              Update mentorship details and availability for <strong>{mentor.name}</strong>
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close edit profile dialog"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {serverError && (
          <div
            className="demo-modal-alert"
            style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5' }}
            role="alert"
          >
            <span className="demo-alert-icon" aria-hidden="true">⚠️</span>
            <p style={{ color: '#991b1b', fontWeight: 500 }}>
              <strong>Error:</strong> {serverError}
            </p>
          </div>
        )}

        <form className="booking-form edit-profile-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name & Domain */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="edit-mentor-name" className="form-label">
                Mentor Name
              </label>
              <input
                ref={firstInputRef}
                id="edit-mentor-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group flex-1">
              <label htmlFor="edit-mentor-category" className="form-label">
                Domain Category <span className="required-star">*</span>
              </label>
              <select
                id="edit-mentor-category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
              >
                {MOCK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Professional Title */}
          <div className="form-group">
            <label htmlFor="edit-mentor-title" className="form-label">
              Professional Title / Role <span className="required-star">*</span>
            </label>
            <input
              id="edit-mentor-title"
              type="text"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g. Senior Frontend Engineer @ Fintech Labs"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: null });
              }}
              disabled={isSubmitting}
              required
            />
            {errors.title && (
              <p className="field-error" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          {/* Bio / About */}
          <div className="form-group">
            <div className="label-with-counter">
              <label htmlFor="edit-mentor-bio" className="form-label">
                About the Mentor (Bio) <span className="required-star">*</span>
              </label>
              <span className="char-counter" aria-live="polite">
                {bio.length}/500
              </span>
            </div>
            <textarea
              id="edit-mentor-bio"
              rows={4}
              maxLength={500}
              className={`form-textarea ${errors.bio ? 'input-error' : ''}`}
              placeholder="Describe background, industry experience, and what students will learn..."
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                if (errors.bio) setErrors({ ...errors, bio: null });
              }}
              disabled={isSubmitting}
              required
            />
            {errors.bio && (
              <p className="field-error" role="alert">
                {errors.bio}
              </p>
            )}
          </div>

          {/* Core Expertise Tags */}
          <div className="form-group">
            <label htmlFor="edit-mentor-expertise" className="form-label">
              Technical &amp; Domain Expertise <span className="required-star">*</span>
            </label>
            <input
              id="edit-mentor-expertise"
              type="text"
              className={`form-input ${errors.expertise ? 'input-error' : ''}`}
              placeholder="Comma-separated: React, TypeScript, GraphQL, Next.js"
              value={expertiseStr}
              onChange={(e) => {
                setExpertiseStr(e.target.value);
                if (errors.expertise) setErrors({ ...errors, expertise: null });
              }}
              disabled={isSubmitting}
              required
            />
            <p className="field-hint">Enter skills separated by commas.</p>
            {errors.expertise && (
              <p className="field-error" role="alert">
                {errors.expertise}
              </p>
            )}
          </div>

          {/* Mentorship Focus Areas */}
          <div className="form-group">
            <label htmlFor="edit-mentor-topics" className="form-label">
              Mentorship Focus Areas
            </label>
            <input
              id="edit-mentor-topics"
              type="text"
              className="form-input"
              placeholder="Comma-separated: Frontend Architecture, Technical Interview Prep"
              value={mentoringTopicsStr}
              onChange={(e) => setMentoringTopicsStr(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="field-hint">Key topics you help mentees achieve.</p>
          </div>

          {/* Experience & Education */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="edit-mentor-experience" className="form-label">
                Experience
              </label>
              <input
                id="edit-mentor-experience"
                type="text"
                className="form-input"
                placeholder="e.g. 6+ years in industry"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group flex-1">
              <label htmlFor="edit-mentor-education" className="form-label">
                Education
              </label>
              <input
                id="edit-mentor-education"
                type="text"
                className="form-input"
                placeholder="e.g. B.Tech in CE (ADYPU Alum)"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Availability */}
          <div className="form-group">
            <label htmlFor="edit-mentor-availability" className="form-label">
              Typical Available Hours <span className="required-star">*</span>
            </label>
            <input
              id="edit-mentor-availability"
              type="text"
              className={`form-input ${errors.sampleAvailability ? 'input-error' : ''}`}
              placeholder="e.g. Tuesdays & Thursdays, 4:00 PM – 6:00 PM IST"
              value={sampleAvailability}
              onChange={(e) => {
                setSampleAvailability(e.target.value);
                if (errors.sampleAvailability) setErrors({ ...errors, sampleAvailability: null });
              }}
              disabled={isSubmitting}
              required
            />
            {errors.sampleAvailability && (
              <p className="field-error" role="alert">
                {errors.sampleAvailability}
              </p>
            )}
          </div>

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
              id="save-profile-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

