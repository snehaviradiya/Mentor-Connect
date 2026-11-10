import { useState, useEffect, useRef } from 'react';
import { RESOURCE_TYPES } from '../data/mockResources.js';
import { MOCK_CATEGORIES } from '../data/mockMentors.js';
import { useToast } from '../context/ToastContext.jsx';

export default function ShareResourceModal({ onClose, onAddResource }) {
  const modalRef = useRef(null);
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Documentation');
  const [category, setCategory] = useState('Software Engineering');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [mentorName, setMentorName] = useState('Jiya Srivastava');
  const [fileSizeOrDuration, setFileSizeOrDuration] = useState('Docs • 10 min read');
  const [tagsInput, setTagsInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out "All" and "All Types" from dropdown choices
  const selectableTypes = RESOURCE_TYPES.filter((t) => t !== 'All Types');
  const selectableCategories = MOCK_CATEGORIES.filter((c) => c !== 'All');

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

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Resource title is required.';
    }
    if (!url.trim()) {
      newErrors.url = 'Link or URL is required.';
    } else if (!/^https?:\/\/.+/i.test(url.trim())) {
      newErrors.url = 'Please enter a valid URL starting with http:// or https://';
    }
    if (!description.trim()) {
      newErrors.description = 'Please provide a short description.';
    } else if (description.trim().length < 15) {
      newErrors.description = 'Description should be at least 15 characters long.';
    }
    if (!mentorName.trim()) {
      newErrors.mentorName = 'Mentor or contributor name is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      toast.error('Please fix the errors before submitting the resource.', 'Validation Error');
      return;
    }

    setIsSubmitting(true);

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const initials = mentorName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'MC';

    const newResource = {
      id: `res-${Date.now()}`,
      title: title.trim(),
      type,
      category,
      url: url.trim(),
      description: description.trim(),
      fileSizeOrDuration: fileSizeOrDuration.trim() || 'Resource link',
      mentorId: `mentor-custom-${Date.now()}`,
      mentorName: mentorName.trim(),
      mentorRole: 'Contributor • ADYPU Capstone',
      mentorAvatar: initials,
      tags: parsedTags.length > 0 ? parsedTags : [category, type],
      dateAdded: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      featured: false,
    };

    if (onAddResource) {
      onAddResource(newResource);
    }

    toast.success(
      `"${newResource.title}" has been published to the Resource Library!`,
      'Resource Shared'
    );

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="modal-container share-resource-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-resource-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="share-resource-title" className="modal-title">
              Share a Learning Resource
            </h2>
            <p className="modal-subtitle">
              Contribute study guides, tutorial links, documentation, or code repositories.
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form className="share-resource-form" onSubmit={handleSubmit} noValidate>
          {/* Resource Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="res-title">
              Resource Title <span className="required-star">*</span>
            </label>
            <input
              id="res-title"
              type="text"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed System Design & Event-Driven Patterns"
              required
            />
            {errors.title && <p className="field-error-msg">{errors.title}</p>}
          </div>

          {/* Type & Category 2-Column Row */}
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="res-type">
                Resource Type <span className="required-star">*</span>
              </label>
              <select
                id="res-type"
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {selectableTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="res-category">
                Academic Domain <span className="required-star">*</span>
              </label>
              <select
                id="res-category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {selectableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* URL / Link */}
          <div className="form-group">
            <label className="form-label" htmlFor="res-url">
              Direct Link or Repository URL <span className="required-star">*</span>
            </label>
            <input
              id="res-url"
              type="url"
              className={`form-input ${errors.url ? 'input-error' : ''}`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
            />
            {errors.url && <p className="field-error-msg">{errors.url}</p>}
          </div>

          {/* Contributor Name & Read Time/Size */}
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="res-mentor-name">
                Mentor / Contributor Name <span className="required-star">*</span>
              </label>
              <input
                id="res-mentor-name"
                type="text"
                className={`form-input ${errors.mentorName ? 'input-error' : ''}`}
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                required
              />
              {errors.mentorName && (
                <p className="field-error-msg">{errors.mentorName}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="res-duration">
                Estimate / Format Note
              </label>
              <input
                id="res-duration"
                type="text"
                className="form-input"
                value={fileSizeOrDuration}
                onChange={(e) => setFileSizeOrDuration(e.target.value)}
                placeholder="e.g. PDF • 3.4 MB or Video • 25m"
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="res-description">
              Overview &amp; Learning Objectives <span className="required-star">*</span>
            </label>
            <textarea
              id="res-description"
              rows="3"
              className={`form-textarea ${errors.description ? 'input-error' : ''}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain how this material supports student capstone projects or interview prep..."
              required
            />
            {errors.description && (
              <p className="field-error-msg">{errors.description}</p>
            )}
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label" htmlFor="res-tags">
              Topic Tags (Comma-separated)
            </label>
            <input
              id="res-tags"
              type="text"
              className="form-input"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. React 19, Microservices, System Design"
            />
          </div>

          {/* Modal Footer */}
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
              {isSubmitting ? 'Sharing...' : 'Add to Resource Library'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
