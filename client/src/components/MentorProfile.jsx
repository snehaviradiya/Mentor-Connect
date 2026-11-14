import { useState, useRef, useMemo } from 'react';
import BookingModal from './BookingModal.jsx';
import EditProfileModal from './EditProfileModal.jsx';
import ReviewModal from './ReviewModal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Icon from './Icon.jsx';

export default function MentorProfile({ mentor, onBack, onUpdateMentor, onBookingSuccess, onEnterVR }) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState({});
  const [justUpdated, setJustUpdated] = useState(false);
  const bookingButtonRef = useRef(null);
  const toast = useToast();

  const handleVoteHelpful = (reviewId) => {
    setHelpfulVotes((prev) => {
      const isVoted = prev[reviewId];
      if (!isVoted) {
        toast.info('Thank you! Marked as helpful.', 'Helpful Feedback');
      }
      return {
        ...prev,
        [reviewId]: !isVoted,
      };
    });
  };

  const reviewStats = useMemo(() => {
    const emptyDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (!mentor) {
      return { avg: null, count: 0, distribution: emptyDistribution, recommendPct: null, hasBreakdown: false };
    }
    const reviews = Array.isArray(mentor.reviews) ? mentor.reviews : [];
    const ratings = reviews
      .map((review) => Number(review.rating))
      .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);
    const suppliedRating = mentor.rating == null ? NaN : Number(mentor.rating);
    const hasSuppliedRating = Number.isFinite(suppliedRating) && suppliedRating >= 1 && suppliedRating <= 5;
    const suppliedCount = mentor.reviewCount == null ? 0 : Number(mentor.reviewCount);
    const count = Math.max(reviews.length, Number.isFinite(suppliedCount) ? suppliedCount : 0);
    const average = ratings.length
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : hasSuppliedRating ? suppliedRating : null;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((rating) => {
      const star = Math.round(rating);
      distribution[star] = (distribution[star] || 0) + 1;
    });
    const highRatings = (distribution[5] || 0) + (distribution[4] || 0);
    return {
      avg: average === null ? null : average.toFixed(1),
      count,
      ratingCount: ratings.length,
      distribution,
      recommendPct: ratings.length ? Math.round((highRatings / ratings.length) * 100) : null,
      hasBreakdown: ratings.length > 0,
    };
  }, [mentor]);

  // Graceful fallback for invalid or missing mentor
  if (!mentor) {
    return (
      <div className="profile-error-container" role="alert">
        <div className="error-icon" aria-hidden="true"><Icon name="alert" /></div>
        <h2 className="error-title">Mentor Profile Not Found</h2>
        <p className="error-message">
          The requested mentor could not be found. The profile may have been removed or the link may be invalid.
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

  const handleShareProfile = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      }
      toast.success(
        `Link to ${mentor.name}'s profile has been copied to your clipboard.`,
        'Link Copied'
      );
    } catch {
      toast.info(`Share link for ${mentor.name}: ${url}`, 'Mentor Link');
    }
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
          {mentor.category && <>
            <span className="crumb-sep" aria-hidden="true">/</span>
            <span>{mentor.category}</span>
          </>}
          <span className="crumb-sep" aria-hidden="true">/</span>
          <span className="current-crumb" aria-current="page">{mentor.name || 'Mentor profile'}</span>
        </nav>

        {/* Action controls */}
        <div className="profile-quick-actions">
          <button
            type="button"
            className="action-pill-btn share-btn"
            onClick={handleShareProfile}
            aria-label="Share mentor profile"
          >
            <Icon name="link" /> Share
          </button>
          <button
            type="button"
            className="action-pill-btn edit-btn"
            onClick={() => setIsEditModalOpen(true)}
            aria-label={`Edit profile of ${mentor.name}`}
            id="edit-profile-btn"
          >
            <Icon name="edit" /> Edit Profile
          </button>
        </div>
      </div>

      {justUpdated && (
        <div className="profile-updated-banner" role="status" aria-live="polite">
          <span className="banner-icon" aria-hidden="true">✓</span>
          <div>
            <strong>Profile Updated:</strong> Changes to {mentor.name}&apos;s profile have been saved and applied.
          </div>
        </div>
      )}

      {/* Profile Header Hero */}
      <header className="profile-header-card">
        <div
          className="profile-avatar-large"
          aria-hidden="true"
          data-domain={mentor.category}
        >
            {mentor.avatarInitials || mentor.name?.trim()?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="profile-header-info">
          <div className="profile-badges-row">
            {mentor.category && <span className="mentor-category-badge" data-domain={mentor.category}>
              {mentor.category}
            </span>}
            {mentor.experience && (
              <span className="experience-badge"><Icon name="clock" /> {mentor.experience}</span>
            )}
            {reviewStats.avg && (
              <span className="profile-rating-badge" aria-label={`Rating: ${reviewStats.avg} out of 5 stars`}>
                <Icon name="star" /> {reviewStats.avg} ({reviewStats.count} reviews)
              </span>
            )}
          </div>
          <h1 id="profile-heading" className="profile-name">
            {mentor.name || 'Mentor profile'}
          </h1>
          {mentor.title && <p className="profile-role">{mentor.title}</p>}
          {mentor.education && (
            <p className="profile-education">
              <Icon className="edu-icon" name="graduation" />
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
            <p className="profile-bio-text">
              {mentor.bio?.trim() || 'This mentor has not added a biography yet.'}
            </p>
          </section>

          {/* Core Expertise Tags */}
          <section className="profile-section" aria-labelledby="section-skills">
            <h2 id="section-skills" className="profile-section-title">
              Technical &amp; Domain Expertise
            </h2>
            <div className="expertise-tags large-tags" aria-label="Skills">
              {(Array.isArray(mentor.expertise) ? mentor.expertise : []).filter(Boolean).map((skill) => (
                <span key={skill} className="expertise-tag">
                  {skill}
                </span>
              ))}
              {(!Array.isArray(mentor.expertise) || mentor.expertise.filter(Boolean).length === 0) && (
                <span className="profile-detail-empty">No skills have been listed yet.</span>
              )}
            </div>
          </section>

          {/* Mentoring Topics */}
          {Array.isArray(mentor.mentoringTopics) && mentor.mentoringTopics.length > 0 && (
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

          {/* Verified Reviews & Student Testimonials */}
          <section className="profile-section reviews-section" aria-labelledby="section-reviews">
            <div className="reviews-section-header">
              <div>
                <h2 id="section-reviews" className="profile-section-title">
                  Verified Reviews &amp; Testimonials
                </h2>
                <p className="reviews-section-subtitle">
                  Ratings and feedback submitted by ADYPU students following completed consultations.
                </p>
              </div>
              <button
                type="button"
                className="btn-write-review-cta"
                onClick={() => setIsReviewModalOpen(true)}
                id="write-review-btn"
                aria-label={`Write a review for ${mentor.name}`}
              >
                <Icon name="star" /> Rate &amp; Write Review
              </button>
            </div>

            {/* Scorecard Summary */}
            <div className="reviews-summary-card">
              <div className="rating-overview-score">
                <span className="big-rating-number">{reviewStats.avg || '—'}</span>
                {reviewStats.avg ? (
                  <div className="star-display" aria-label={`Rating: ${reviewStats.avg} out of 5 stars`}>
                    {'★'.repeat(Math.round(Number(reviewStats.avg)))}
                    {'☆'.repeat(5 - Math.round(Number(reviewStats.avg)))}
                  </div>
                ) : <span className="rating-not-yet">No rating yet</span>}
                <span className="reviews-count-caption">
                  {reviewStats.count > 0
                    ? `Based on ${reviewStats.count} verified student ${reviewStats.count === 1 ? 'review' : 'reviews'}`
                    : 'No verified reviews yet'}
                </span>
                {reviewStats.recommendPct !== null && (
                  <span className="recommendation-pill">
                    <Icon name="thumbsUp" /> {reviewStats.recommendPct}% recommend this mentor
                  </span>
                )}
              </div>

              {/* Rating distribution breakdown bars */}
              {reviewStats.hasBreakdown && <div className="rating-distribution-bars" aria-label="Rating breakdown">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const starCount = reviewStats.distribution[stars] || 0;
                  const pct = reviewStats.ratingCount > 0 ? Math.round((starCount / reviewStats.ratingCount) * 100) : 0;
                  return (
                    <div key={stars} className="distribution-row">
                      <span className="dist-stars-label">{stars} ★</span>
                      <div className="dist-bar-bg" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                        <div className="dist-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="dist-count-label">{starCount}</span>
                    </div>
                  );
                })}
              </div>}
            </div>

            {/* Reviews List */}
            {Array.isArray(mentor.reviews) && mentor.reviews.length > 0 ? (
              <div className="reviews-list">
                {mentor.reviews.map((rev) => {
                  const hasVoted = Boolean(helpfulVotes[rev.id]);
                  const currentHelpful = (rev.helpfulCount || 0) + (hasVoted ? 1 : 0);
                  return (
                    <article key={rev.id} className="testimonial-card" aria-label={`Review by ${rev.studentName}`}>
                      <div className="testimonial-header">
                        <div className="reviewer-info">
                          <div className="reviewer-avatar" aria-hidden="true">
                            {rev.avatarInitials || 'ST'}
                          </div>
                          <div>
                            <div className="reviewer-name-row">
                              <h3 className="reviewer-name">{rev.studentName}</h3>
                              {rev.verified && (
                                <span className="verified-badge" title="Verified session completion">
                                  ✓ Verified Session
                                </span>
                              )}
                            </div>
                            <span className="reviewer-sub"><Icon name="graduation" /> ADYPU Student • {rev.date}</span>
                          </div>
                        </div>

                        <div className="testimonial-rating">
                          <span className="stars-gold">
                            {'★'.repeat(Math.min(5, Math.max(1, Math.round(Number(rev.rating) || 5))))}
                            {'☆'.repeat(5 - Math.min(5, Math.max(1, Math.round(Number(rev.rating) || 5))))}
                          </span>
                        </div>
                      </div>

                      {rev.sessionTopic && (
                        <div className="session-topic-chip">
                          <span className="chip-label">Topic:</span> {rev.sessionTopic}
                        </div>
                      )}

                      <p className="testimonial-comment">{rev.feedback}</p>

                      {rev.tags && rev.tags.length > 0 && (
                        <div className="testimonial-tags">
                          {rev.tags.map((t) => (
                            <span key={t} className="review-highlight-tag">
                              ✓ {t}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="testimonial-footer">
                        <button
                          type="button"
                          className={`btn-helpful ${hasVoted ? 'helpful-active' : ''}`}
                          onClick={() => handleVoteHelpful(rev.id)}
                          aria-label={`Mark review as helpful. Currently ${currentHelpful} votes.`}
                        >
                          <><Icon name="thumbsUp" /> Helpful ({currentHelpful})</>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-reviews-card">
                <span className="empty-review-icon" aria-hidden="true"><Icon name="message" /></span>
                <p>No student reviews have been posted for {mentor.name} yet.</p>
                <button
                  type="button"
                  className="btn-first-review"
                  onClick={() => setIsReviewModalOpen(true)}
                >
                  Be the first to leave verified feedback
                </button>
              </div>
            )}
          </section>
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
              <h2 className="sidebar-card-title">Live Availability</h2>
            </div>

            <div className="booking-notice-box" role="note">
              <span className="notice-icon" aria-hidden="true"><Icon name="clock" /></span>
              <div className="notice-content">
                <strong>Date-specific time slots</strong>
                <p>
                  Choose a date to load this mentor&apos;s current bookable slots from the scheduling service.
                </p>
              </div>
            </div>

            <div className="slot-details">
              <span className="slot-label">Availability status</span>
              <p className="slot-time">Updated when you choose a session date.</p>
            </div>

            <button
              ref={bookingButtonRef}
              type="button"
              className="book-session-action-btn"
              onClick={() => setIsBookingModalOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isBookingModalOpen}
              id="book-session-btn"
            >
              View &amp; book available times
            </button>

            {onEnterVR && (
              <button
                type="button"
                className="enter-vr-action-btn"
                onClick={() => onEnterVR(mentor)}
                id="enter-vr-room-btn"
                title="Open 3D Mentorship Room for this mentor"
              >
                <span aria-hidden="true">🥽</span> Enter 3D Mentorship Room
              </button>
            )}
          </div>

          {/* Student Guidance Callout */}
          <div className="student-tips-card">
            <h3 className="tips-title"><Icon name="lightbulb" /> Mentorship Tip for ADYPU Students</h3>
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
          onBookingSuccess={onBookingSuccess}
        />
      )}

      {/* Interactive Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          mentor={mentor}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updated) => {
            setJustUpdated(true);
            if (onUpdateMentor) {
              onUpdateMentor(updated);
            }
          }}
        />
      )}

      {/* Interactive Review Modal */}
      {isReviewModalOpen && (
        <ReviewModal
          mentor={mentor}
          onClose={() => setIsReviewModalOpen(false)}
          onSubmitReview={(newReview) => {
            const currentReviews = mentor.reviews || [];
            const updatedReviews = [newReview, ...currentReviews];
            const avg = (
              updatedReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) /
              updatedReviews.length
            ).toFixed(1);
            const updatedMentor = {
              ...mentor,
              reviews: updatedReviews,
              rating: Number(avg),
              reviewCount: updatedReviews.length,
            };
            if (onUpdateMentor) {
              onUpdateMentor(updatedMentor);
            }
          }}
        />
      )}
    </article>
  );
}
