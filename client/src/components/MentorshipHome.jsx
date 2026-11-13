import SearchBar from './SearchBar.jsx';

export default function MentorshipHome({
  mentors,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onSelectMentor,
  onBrowseMentors,
  mentorCount,
  sessionCount,
  onOpenSignup,
}) {
  const recommendedMentor = mentors[0];
  const mentorRating = Number(recommendedMentor?.rating);
  const mentorReviewCount = Number(recommendedMentor?.reviewCount);

  return (
    <section className="journey-home" aria-labelledby="journey-heading">
      <div className="journey-home-topline">
        <div className="journey-home-brand">
          <span className="journey-home-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m2 9 10-5 10 5-10 5L2 9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M6 11v5c3.4 2.7 8.6 2.7 12 0v-5M22 9v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>mentor connect</span>
        </div>
        <div className="journey-home-actions">
          <span className="journey-home-label">YOUR MENTORSHIP JOURNEY</span>
          <button type="button" className="journey-signup-button" onClick={onOpenSignup}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 21a8 8 0 0 0-16 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Create account
          </button>
        </div>
      </div>

      <h1 id="journey-heading">Build something extraordinary.</h1>
      <p className="journey-home-subtitle">
        The right guidance can take you further. Let&apos;s find yours.
      </p>

      <div className="journey-search">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onClearSearch={onClearSearch}
          placeholder="Search skills, mentors, goals..."
        />
      </div>

      <div className="journey-stats" aria-label="Your mentorship at a glance">
        <article className="journey-stat-card">
          <span className="journey-stat-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <strong>{mentorCount}</strong>
          <span>Expert mentors</span>
        </article>
        <article className="journey-stat-card journey-stat-card-accent">
          <span className="journey-stat-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16 3v4M8 3v4M3 10h18m-13 5 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <strong>{String(sessionCount).padStart(2, '0')}</strong>
          <span>Your upcoming sessions</span>
        </article>
      </div>

      <div className="journey-recommendation-heading">
        <h2>Recommended for you</h2>
        <button type="button" onClick={onBrowseMentors}>View all <span aria-hidden="true">→</span></button>
      </div>

      {recommendedMentor ? (
        <button
          type="button"
          className="journey-mentor-card"
          onClick={() => onSelectMentor(recommendedMentor.id)}
          aria-label={`View profile of recommended mentor ${recommendedMentor.name}`}
        >
          <span className="journey-mentor-avatar" aria-hidden="true">
            {recommendedMentor.avatarInitials}
          </span>
          <span className="journey-mentor-copy">
            <strong>{recommendedMentor.name}</strong>
            <span>{recommendedMentor.title || recommendedMentor.expertise.slice(0, 3).join(' · ')}</span>
          </span>
          {Number.isFinite(mentorRating) && mentorRating > 0 ? (
            <span className="journey-mentor-rating" aria-label={`${mentorRating.toFixed(1)} out of 5${Number.isFinite(mentorReviewCount) ? `, ${mentorReviewCount} reviews` : ''}`}>
              <span aria-hidden="true">★</span> {mentorRating.toFixed(1)}
              {Number.isFinite(mentorReviewCount) && mentorReviewCount > 0 && (
                <span className="journey-mentor-review-count">· {mentorReviewCount}</span>
              )}
            </span>
          ) : (
            <span className="journey-mentor-category">{recommendedMentor.category}</span>
          )}
          <span className="journey-mentor-arrow" aria-hidden="true">→</span>
        </button>
      ) : (
        <div className="journey-no-recommendation">
          No mentors match this search yet. Try another skill or browse all mentors.
        </div>
      )}

      <p className="journey-demo-note">Illustrative design concept · Sample data</p>
    </section>
  );
}
