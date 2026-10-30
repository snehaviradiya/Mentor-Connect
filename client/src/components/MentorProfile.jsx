import { useState, useRef } from 'react';
import BookingModal from './BookingModal.jsx';

export default function MentorProfile({ mentor, onBack }) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const bookingButtonRef = useRef(null);

  // Graceful fallback for invalid or missing mentor
  if (!mentor) {
    return (
      <div className="profile-error-container" role="alert">
        <div className="error-icon" aria-hidden="true">⚠️</div>
        <h2 className="error-title">Mentor Profile Not Found</h2>
        <p className="error-message">
          The requested mentor could not be located in our demonstration dataset. The profile may have been removed or the link is invalid.
        </p>
        <button
          type="button"
          className="back-btn primary-back-btn"
          onClick={onBack}
        >
          ← Back to Mentor Discovery
        </button>
      </div>
    );
  }

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
    // Return focus to the trigger button for accessibility
    setTimeout(() => {
      if (bookingButtonRef.current) {
        bookingButtonRef.current.focus();
      }
    }, 10);
  };

  return (
    <article className="mentor-profile-view" aria-labelledby="profile-heading">
      {/* Top Navigation & Breadcrumb */}
      <div className="profile-nav-bar">
        <button
          type="button"
          className="back-nav-btn"
          onClick={onBack}
          aria-label="Return to mentor discovery page"
        >
          ← Back to Mentors
        </button>

        <nav aria-label="Breadcrumb" className="profile-breadcrumbs">
          <span>Mentors</span>
          <span className="crumb-sep" aria-hidden="true">/</span>
          <span>{mentor.category}</span>
          <span className="crumb-sep" aria-hidden="true">/</span>
          <span className="current-crumb" aria-current="page">{mentor.name}</span>
        </nav>
      </div>

      {/* Profile Header Hero */}
      <header className="profile-header-card">
        <div
          className="profile-avatar-large"
          aria-hidden="true"
          data-domain={mentor.category}
        >
          {mentor.avatarInitials}
        </div>
        <div className="profile-header-info">
          <div className="profile-badges-row">
            <span className="mentor-category-badge" data-domain={mentor.category}>
              {mentor.category}
            </span>
            {mentor.experience && (
              <span className="experience-badge">⏱ {mentor.experience}</span>
            )}
          </div>
          <h1 id="profile-heading" className="profile-name">
            {mentor.name}
          </h1>
          <p className="profile-role">{mentor.title}</p>
          {mentor.education && (
            <p className="profile-education">
              <span className="edu-icon" aria-hidden="true">🎓</span>
              {mentor.education}
            </p>
          )}
        </div>
      </header>

      {/* Main Profile Grid */}
      <div className="profile-grid">
        {/* Left Column: Details */}
        <div className="profile-main-col">
          {/* About Section */}
          <section className="profile-section" aria-labelledby="section-about">
            <h2 id="section-about" className="profile-section-title">
              About the Mentor
            </h2>
            <p className="profile-bio-text">{mentor.bio}</p>
          </section>

          {/* Core Expertise Tags */}
          <section className="profile-section" aria-labelledby="section-skills">
            <h2 id="section-skills" className="profile-section-title">
              Technical &amp; Domain Expertise
            </h2>
            <div className="expertise-tags large-tags" aria-label="Skills">
              {mentor.expertise.map((skill) => (
                <span key={skill} className="expertise-tag">
                  {skill}
                </span>
              ))}
            </div>
          </section>

          {/* Mentoring Topics */}
          {mentor.mentoringTopics && mentor.mentoringTopics.length > 0 && (
            <section className="profile-section" aria-labelledby="section-topics">
              <h2 id="section-topics" className="profile-section-title">
                Mentorship Focus Areas
              </h2>
              <ul className="mentoring-topics-list">
                {mentor.mentoringTopics.map((topic) => (
                  <li key={topic} className="mentoring-topic-item">
                    <span className="topic-bullet" aria-hidden="true">✓</span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right Column: Availability & Booking Action */}
        <aside className="profile-sidebar-col" aria-label="Availability and scheduling information">
          <div className="profile-availability-card">
            <div className="sidebar-card-header">
              <span className="calendar-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <h2 className="sidebar-card-title">Sample Availability</h2>
            </div>

            {/* Explicit Demo Disclaimer Box */}
            <div className="booking-notice-box" role="note">
              <span className="notice-icon" aria-hidden="true">ℹ️</span>
              <div className="notice-content">
                <strong>Demonstration Schedule:</strong>
                <p>
                  Availability slots shown are demonstration fixtures for Milestone 3B &amp; 3C. Live booking workflows and database persistence will be connected in future milestones.
                </p>
                <span className="mock-disclaimer-pill status-pill">Demo Simulation Mode</span>
              </div>
            </div>

            <div className="slot-details">
              <span className="slot-label">Typical Available Hours:</span>
              <p className="slot-time">{mentor.sampleAvailability}</p>
            </div>

            {/* Enabled Demo Booking Action Button */}
            <button
              ref={bookingButtonRef}
              type="button"
              className="book-session-action-btn"
              onClick={() => setIsBookingModalOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isBookingModalOpen}
              id="book-session-btn"
            >
              Request a Demo Session
            </button>
          </div>

          {/* Student Guidance Callout */}
          <div className="student-tips-card">
            <h3 className="tips-title">💡 Mentorship Tip for ADYPU Students</h3>
            <p className="tips-text">
              Prepare 2–3 specific questions or project milestones before reaching out. Defining your technical challenges in advance ensures productive sessions.
            </p>
          </div>
        </aside>
      </div>

      {/* Bottom Return Action */}
      <div className="profile-bottom-nav">
        <button
          type="button"
          className="back-nav-btn secondary-back-btn"
          onClick={onBack}
        >
          ← Return to Mentor Discovery
        </button>
      </div>

      {/* Interactive Booking Modal Component */}
      {isBookingModalOpen && (
        <BookingModal
          mentor={mentor}
          onClose={handleCloseBookingModal}
        />
      )}
    </article>
  );
}
