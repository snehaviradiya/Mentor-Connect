export default function MentorCardSkeleton() {
  return (
    <article
      className="mentor-card mentor-card-skeleton"
      aria-hidden="true"
      data-testid="mentor-card-skeleton"
    >
      <div className="card-top">
        <div className="mentor-avatar skeleton-shimmer skeleton-avatar" />
        <div className="mentor-meta">
          <div className="skeleton-line skeleton-title skeleton-shimmer" />
          <div className="skeleton-line skeleton-subtitle skeleton-shimmer" />
          <div className="card-badge-row">
            <div className="skeleton-pill skeleton-shimmer" style={{ width: '85px' }} />
            <div className="skeleton-pill skeleton-shimmer" style={{ width: '60px' }} />
          </div>
        </div>
      </div>

      <div className="skeleton-bio-group">
        <div className="skeleton-line skeleton-bio skeleton-shimmer" style={{ width: '92%' }} />
        <div className="skeleton-line skeleton-bio skeleton-shimmer" style={{ width: '100%' }} />
        <div className="skeleton-line skeleton-bio skeleton-shimmer" style={{ width: '70%' }} />
      </div>

      <div className="expertise-container">
        <div className="skeleton-line skeleton-shimmer" style={{ width: '80px', height: '12px', marginBottom: '8px' }} />
        <div className="expertise-tags">
          <div className="skeleton-tag skeleton-shimmer" style={{ width: '56px' }} />
          <div className="skeleton-tag skeleton-shimmer" style={{ width: '72px' }} />
          <div className="skeleton-tag skeleton-shimmer" style={{ width: '64px' }} />
          <div className="skeleton-tag skeleton-shimmer" style={{ width: '50px' }} />
        </div>
      </div>

      <div className="availability-box skeleton-availability-box">
        <div className="skeleton-line skeleton-shimmer" style={{ width: '130px', height: '14px', marginBottom: '6px' }} />
        <div className="skeleton-line skeleton-shimmer" style={{ width: '180px', height: '12px' }} />
      </div>

      <div className="card-action-footer">
        <div className="skeleton-button skeleton-shimmer" />
      </div>
    </article>
  );
}

