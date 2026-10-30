export default function MentorCard({ mentor, onSelectMentor }) {
  return (
    <article className="mentor-card" aria-labelledby={`mentor-name-${mentor.id}`}>
      <div className="card-top">
        {/* Avatar with domain-aware gradient */}
        <div
          className="mentor-avatar"
          aria-hidden="true"
          data-domain={mentor.category}
        >
          {mentor.avatarInitials}
        </div>

        <div className="mentor-meta">
          <h3 id={`mentor-name-${mentor.id}`} className="mentor-name">
            {mentor.name}
          </h3>
          <p className="mentor-role">{mentor.title}</p>
          <div className="card-badge-row">
            <span className="mentor-category-badge" data-domain={mentor.category}>
              {mentor.category}
            </span>
            {mentor.experience && (
              <span className="experience-chip">⏱ {mentor.experience}</span>
            )}
          </div>
        </div>
      </div>

      <p className="mentor-bio">{mentor.bio}</p>

      <div className="expertise-container">
        <span className="expertise-label">Core Expertise</span>
        <div className="expertise-tags" aria-label="Skills and expertise">
          {mentor.expertise.map((skill) => (
            <span key={skill} className="expertise-tag">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="availability-box">
        <div className="availability-header">
          <span className="calendar-icon" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="availability-title">Sample Availability</span>
          <span className="mock-disclaimer-pill">Demo</span>
        </div>
        <p className="availability-text">{mentor.sampleAvailability}</p>
      </div>

      <div className="card-action-footer">
        <button
          type="button"
          className="view-profile-btn"
          onClick={() => onSelectMentor(mentor.id)}
          aria-label={`View detailed profile of ${mentor.name}`}
        >
          <span>View Profile</span>
          <span aria-hidden="true" className="hero-cta-arrow">→</span>
        </button>
      </div>
    </article>
  );
}
