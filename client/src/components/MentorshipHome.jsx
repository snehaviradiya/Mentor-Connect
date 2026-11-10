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
}) {
  const recommendedMentor = mentors[0];

  return (
    <section className="journey-home" aria-labelledby="journey-heading">
      <div className="journey-home-topline">
        <div className="journey-home-brand">
          <span className="journey-home-mark" aria-hidden="true">✦</span>
          <span>mentor connect</span>
        </div>
        <span className="journey-home-label">YOUR MENTORSHIP JOURNEY</span>
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
          placeholder="Search skills, mentors, or topics..."
        />
      </div>

      <div className="journey-stats" aria-label="Your mentorship at a glance">
        <article className="journey-stat-card">
          <span className="journey-stat-icon" aria-hidden="true">♧</span>
          <strong>{mentorCount}</strong>
          <span>Expert mentors</span>
        </article>
        <article className="journey-stat-card journey-stat-card-accent">
          <span className="journey-stat-icon" aria-hidden="true">▣</span>
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
            <span>{recommendedMentor.expertise.slice(0, 3).join(' · ')}</span>
          </span>
          <span className="journey-mentor-category">{recommendedMentor.category}</span>
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
