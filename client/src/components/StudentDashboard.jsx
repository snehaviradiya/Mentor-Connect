import { useState, useMemo } from 'react';
import MentorCard from './MentorCard.jsx';
import ReviewModal from './ReviewModal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { INITIAL_UPCOMING_SESSIONS } from '../data/mockSessions.js';

const DEFAULT_LEARNING_GOALS = [
  {
    id: 'g1',
    title: 'Master Distributed State & React Patterns',
    category: 'Software Engineering',
    timeframe: 'short',
    deadline: '2026-11-30',
    milestones: [
      { id: 'g1-m1', title: 'Review state management fundamentals', completed: true },
      { id: 'g1-m2', title: 'Build a shared state demo', completed: true },
      { id: 'g1-m3', title: 'Compare Context and external stores', completed: true },
      { id: 'g1-m4', title: 'Profile and optimize re-renders', completed: true },
      { id: 'g1-m5', title: 'Document patterns for the capstone', completed: false },
    ],
  },
  {
    id: 'g2',
    title: 'Design Resilient Microservices & API Schemas',
    category: 'Software Engineering',
    timeframe: 'short',
    deadline: '2026-12-15',
    milestones: [
      { id: 'g2-m1', title: 'Map service boundaries', completed: true },
      { id: 'g2-m2', title: 'Draft API contracts', completed: true },
      { id: 'g2-m3', title: 'Add retries and error handling', completed: true },
      { id: 'g2-m4', title: 'Test failure scenarios', completed: false },
      { id: 'g2-m5', title: 'Review the design with a mentor', completed: false },
    ],
  },
  {
    id: 'g3',
    title: 'Prepare for Tech Architecture & System Design Interviews',
    category: 'Career Growth',
    timeframe: 'short',
    deadline: '2027-01-15',
    milestones: [
      { id: 'g3-m1', title: 'Study core scalability patterns', completed: true },
      { id: 'g3-m2', title: 'Practice a URL shortener design', completed: true },
      { id: 'g3-m3', title: 'Practice a real-time messaging design', completed: false },
      { id: 'g3-m4', title: 'Complete a mock interview', completed: false },
      { id: 'g3-m5', title: 'Write a personal design checklist', completed: false },
    ],
  },
  {
    id: 'g4',
    title: 'Ship and present my capstone project',
    category: 'Capstone',
    timeframe: 'long',
    deadline: '2027-04-30',
    milestones: [
      { id: 'g4-m1', title: 'Finalize scope and success metrics', completed: true },
      { id: 'g4-m2', title: 'Complete the core product workflow', completed: false },
      { id: 'g4-m3', title: 'Run accessibility and performance reviews', completed: false },
      { id: 'g4-m4', title: 'Prepare the final demo and documentation', completed: false },
    ],
  },
  {
    id: 'g5',
    title: 'Build a portfolio and secure a software internship',
    category: 'Career Growth',
    timeframe: 'long',
    deadline: '2027-05-31',
    milestones: [
      { id: 'g5-m1', title: 'Choose three projects to showcase', completed: false },
      { id: 'g5-m2', title: 'Publish a polished portfolio site', completed: false },
      { id: 'g5-m3', title: 'Update resume and online profiles', completed: false },
      { id: 'g5-m4', title: 'Complete five tailored applications', completed: false },
    ],
  },
];

function getGoalProgress(goal) {
  if (!goal.milestones.length) return 0;
  return Math.round(
    (goal.milestones.filter((milestone) => milestone.completed).length / goal.milestones.length) * 100
  );
}

function formatGoalDeadline(deadline) {
  if (!deadline) return 'No deadline';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${deadline}T00:00:00`));
}

const INITIAL_COMPLETED_SESSIONS = [
  {
    id: 'comp-1',
    mentorId: 'mentor-1',
    mentorName: 'Aarav Sharma',
    mentorRole: 'Senior Frontend Engineer @ Fintech Labs',
    topic: 'React 19 Server Components & State Management',
    date: 'Oct 28, 2026',
    time: '10:00 AM – 11:00 AM IST',
    status: 'Completed',
    hasReviewed: true,
    userRating: 5,
  },
  {
    id: 'comp-2',
    mentorId: 'mentor-2',
    mentorName: 'Dr. Priya Kulkarni',
    mentorRole: 'Assistant Professor & AI Researcher',
    topic: 'Capstone LLM Agent Evaluation & Fine-Tuning',
    date: 'Nov 02, 2026',
    time: '02:00 PM – 03:00 PM IST',
    status: 'Completed',
    hasReviewed: false,
  },
  {
    id: 'comp-3',
    mentorId: 'mentor-5',
    mentorName: 'Vikram Joshi',
    mentorRole: 'Principal Backend Engineer',
    topic: 'PostgreSQL Database Indexing & Concurrency',
    date: 'Nov 04, 2026',
    time: '05:00 PM – 06:00 PM IST',
    status: 'Completed',
    hasReviewed: false,
  },
];

export default function StudentDashboard({
  mentors = [],
  onSelectMentor,
  onQuickBookMentor,
  onAddReview,
  onOpenWorkspace,
}) {
  const toast = useToast();
  const [goals, setGoals] = useState(DEFAULT_LEARNING_GOALS);
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalTimeframe, setNewGoalTimeframe] = useState('short');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [newGoalMilestones, setNewGoalMilestones] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [sessions, setSessions] = useState(INITIAL_UPCOMING_SESSIONS);
  const [completedSessions, setCompletedSessions] = useState(INITIAL_COMPLETED_SESSIONS);
  const [reviewingSession, setReviewingSession] = useState(null);

  // Student profile mock
  const student = {
    name: 'Jiya Srivastava',
    email: 'jiya@adypu.edu.in',
    department: 'Computer Engineering',
    year: 'Final Year Capstone',
    avatarInitials: 'JS',
  };

  // Curated recommended mentors (top mentors by rating/expertise)
  const recommendedMentors = useMemo(() => {
    if (!mentors || mentors.length === 0) return [];
    return mentors.slice(0, 3);
  }, [mentors]);

  // Recently viewed mentors (next 2 mentors)
  const recentlyViewedMentors = useMemo(() => {
    if (!mentors || mentors.length === 0) return [];
    return mentors.length > 3 ? mentors.slice(3, 5) : mentors.slice(0, 2);
  }, [mentors]);
  const completedGoalCount = goals.filter((goal) =>
    goal.milestones.length > 0 && goal.milestones.every((milestone) => milestone.completed)
  ).length;

  const toggleGoal = (id) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== id) return goal;
        const isCompleted = goal.milestones.length > 0 &&
          goal.milestones.every((milestone) => milestone.completed);
        const completed = !isCompleted;
        if (completed) {
          toast.success(`Goal completed: "${goal.title}"! Keep up the momentum! 🎉`, 'Goal Achieved');
        }
        return {
          ...goal,
          milestones: goal.milestones.map((milestone) => ({ ...milestone, completed })),
        };
      })
    );
  };

  const toggleMilestone = (goalId, milestoneId) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const milestones = goal.milestones.map((milestone) =>
          milestone.id === milestoneId
            ? { ...milestone, completed: !milestone.completed }
            : milestone
        );
        const wasCompleted = goal.milestones.length > 0 &&
          goal.milestones.every((milestone) => milestone.completed);
        const isCompleted = milestones.length > 0 &&
          milestones.every((milestone) => milestone.completed);
        if (isCompleted && !wasCompleted) {
          toast.success(`Goal completed: "${goal.title}"! Keep up the momentum! 🎉`, 'Goal Achieved');
        }
        return { ...goal, milestones };
      })
    );
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    const trimmed = newGoalText.trim();
    const milestones = newGoalMilestones
      .split('\n')
      .map((title) => title.trim())
      .filter(Boolean)
      .map((title, index) => ({
        id: `milestone-${Date.now()}-${index}`,
        title,
        completed: false,
      }));
    if (!trimmed || !newGoalDeadline || !milestones.length) return;
    const newGoal = {
      id: `g-${Date.now()}`,
      title: trimmed,
      category: 'Personal Goal',
      timeframe: newGoalTimeframe,
      deadline: newGoalDeadline,
      milestones,
    };
    setGoals((prev) => [newGoal, ...prev]);
    setNewGoalText('');
    setNewGoalDeadline('');
    setNewGoalMilestones('');
    setIsAddingGoal(false);
    toast.success('New goal and milestones added to your dashboard!', 'Goal Added');
  };

  const handleCancelSession = (sessionId, mentorName) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (toast.bookingCancelled) {
      toast.bookingCancelled(`Session with ${mentorName} has been cancelled.`, 'Session Cancelled');
    } else {
      toast.warning(`Session with ${mentorName} has been cancelled.`, 'Session Cancelled');
    }
  };

  const handleJoinMeeting = (session) => {
    toast.upcomingSession(
      `Launching meeting room for "${session.topic}" with ${session.mentorName}...`,
      'Meeting Room'
    );
  };

  const handleOpenReview = (session) => {
    const foundMentor =
      mentors.find((m) => m.id === session.mentorId) ||
      mentors.find((m) => m.name.toLowerCase() === session.mentorName.toLowerCase()) ||
      {
        id: session.mentorId || 'mentor-1',
        name: session.mentorName,
        category: 'Software Engineering',
        avatarInitials: session.mentorName
          .split(' ')
          .map((p) => p[0])
          .join('')
          .slice(0, 2),
      };
    setReviewingSession({ ...session, mentor: foundMentor });
  };

  const handleReviewSubmitted = (newReview) => {
    if (!reviewingSession) return;
    const targetMentorId = reviewingSession.mentor?.id || reviewingSession.mentorId;

    setCompletedSessions((prev) =>
      prev.map((s) =>
        s.id === reviewingSession.id
          ? { ...s, hasReviewed: true, userRating: newReview.rating }
          : s
      )
    );

    if (onAddReview) {
      onAddReview(targetMentorId, newReview);
    }

    setReviewingSession(null);
  };

  const handleQuickBook = () => {
    const targetMentor = recommendedMentors[0] || mentors[0];
    if (targetMentor) {
      if (onQuickBookMentor) {
        onQuickBookMentor(targetMentor);
      } else if (onSelectMentor) {
        onSelectMentor(targetMentor.id);
      }
      toast.info(`Opening quick booking for ${targetMentor.name}.`, 'Quick Booking');
    } else {
      toast.info('Browse all available mentors to book a session.', 'Quick Booking');
    }
  };

  return (
    <div className="student-dashboard" aria-label="Personalized Student Dashboard">
      {/* 1. Welcome Back Hero Banner */}
      <section className="dashboard-hero" aria-labelledby="welcome-back-heading">
        <span className="dashboard-float-shape dashboard-float-shape-one" aria-hidden="true" />
        <span className="dashboard-float-shape dashboard-float-shape-two" aria-hidden="true" />
        <div className="hero-left">
          <div className="student-badge-avatar" aria-hidden="true">
            {student.avatarInitials}
          </div>
          <div className="welcome-meta">
            <span className="welcome-tag">Student Capstone Portal</span>
            <h1 id="welcome-back-heading" className="welcome-heading">
              Welcome back, {student.name}!
            </h1>
            <p className="welcome-subtext">
              {student.department} • {student.year} • {student.email}
            </p>
          </div>
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="btn-quick-book"
            onClick={handleQuickBook}
            id="quick-book-button"
            aria-label="Quick Book Consultation Session"
          >
            ⚡ Quick Book Session
          </button>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="dashboard-stats-grid" aria-label="Learning Metrics Overview">
        <div className="stat-card stat-card-mentors">
          <span className="stat-icon" aria-hidden="true">🌟</span>
          <div>
            <div className="stat-value">{mentors.length}</div>
            <div className="stat-label">Expert Mentors</div>
          </div>
        </div>

        <div className="stat-card stat-card-sessions">
          <span className="stat-icon" aria-hidden="true">📅</span>
          <div>
            <div className="stat-value">{sessions.length}</div>
            <div className="stat-label">Upcoming Sessions</div>
          </div>
        </div>

        <div className="stat-card stat-card-completed">
          <span className="stat-icon" aria-hidden="true">✓</span>
          <div>
            <div className="stat-value">{completedSessions.length}</div>
            <div className="stat-label">Completed Bookings</div>
          </div>
        </div>

        <div className="stat-card stat-card-goals">
          <span className="stat-icon" aria-hidden="true">🎯</span>
          <div>
            <div className="stat-value">{completedGoalCount} / {goals.length}</div>
            <div className="stat-label">Goals Completed</div>
          </div>
        </div>
      </section>

      {/* 2-Column Layout: Left = Upcoming Sessions & Learning Goals, Right = Mentors */}
      <div className="dashboard-content-split">
        <div className="dashboard-primary-col">
          {/* 2. Upcoming Sessions Section */}
          <section className="dashboard-panel" aria-labelledby="sessions-heading">
            <div className="panel-header">
              <div className="panel-title-group">
                <span className="panel-icon" aria-hidden="true">🗓️</span>
                <h2 id="sessions-heading" className="panel-title">
                  Upcoming Sessions
                </h2>
              </div>
              <span className="badge-count">{sessions.length} Scheduled</span>
            </div>

            {sessions.length === 0 ? (
              <div className="empty-panel-notice">
                <p>No upcoming sessions scheduled right now.</p>
                <button
                  type="button"
                  className="btn-link-action"
                  onClick={handleQuickBook}
                >
                  Schedule your next demo consultation →
                </button>
              </div>
            ) : (
              <div className="sessions-list">
                {sessions.map((sess) => (
                  <article key={sess.id} className="session-card" aria-label={`Session with ${sess.mentorName}`}>
                    <div className="session-main">
                      <div className="session-header-row">
                        <h3 className="session-topic">{sess.topic}</h3>
                        <span className="session-status-badge">{sess.status}</span>
                      </div>
                      <p className="session-mentor-info">
                        Mentor: <strong>{sess.mentorName}</strong> • {sess.mentorRole}
                      </p>
                      <div className="session-meta-row">
                        <span className="session-time-chip">
                          📅 {sess.date} at {sess.time}
                        </span>
                      </div>
                    </div>
                    <div className="session-actions">
                      <button
                        type="button"
                        className="btn-workspace"
                        onClick={() => onOpenWorkspace?.(sess)}
                        aria-label={`Open workspace for ${sess.topic}`}
                      >
                        Open Workspace
                      </button>
                      <button
                        type="button"
                        className="btn-join-session"
                        onClick={() => handleJoinMeeting(sess)}
                      >
                        Join Room
                      </button>
                      <button
                        type="button"
                        className="btn-cancel-session"
                        onClick={() => handleCancelSession(sess.id, sess.mentorName)}
                        title="Cancel this session"
                        aria-label={`Cancel session with ${sess.mentorName}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* 3. Completed Sessions & Student Reviews */}
          <section className="dashboard-panel completed-sessions-panel" aria-labelledby="completed-sessions-heading">
            <div className="panel-header">
              <div className="panel-title-group">
                <span className="panel-icon" aria-hidden="true">⭐</span>
                <h2 id="completed-sessions-heading" className="panel-title">
                  Completed Sessions &amp; Reviews
                </h2>
              </div>
              <span className="badge-count count-green">{completedSessions.length} Completed</span>
            </div>

            <p className="panel-caption">
              Rate your mentors and leave verified feedback after completed consultations.
            </p>

            <div className="sessions-list">
              {completedSessions.map((sess) => (
                <article key={sess.id} className="session-card completed-card" aria-label={`Completed session with ${sess.mentorName}`}>
                  <div className="session-main">
                    <div className="session-header-row">
                      <h3 className="session-topic">{sess.topic}</h3>
                      <span className="session-status-badge badge-completed">✓ Completed</span>
                    </div>
                    <p className="session-mentor-info">
                      Mentor: <strong>{sess.mentorName}</strong> • {sess.mentorRole}
                    </p>
                    <div className="session-meta-row">
                      <span className="session-time-chip">
                        📅 Completed on {sess.date}
                      </span>
                    </div>
                  </div>

                  <div className="session-actions">
                    {sess.hasReviewed ? (
                      <div className="reviewed-indicator">
                        <span className="reviewed-badge">✓ Reviewed ⭐ {sess.userRating || 5}/5</span>
                        <button
                          type="button"
                          className="btn-view-profile-link"
                          onClick={() => onSelectMentor && onSelectMentor(sess.mentorId)}
                        >
                          View on Profile →
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-rate-mentor-cta"
                        onClick={() => handleOpenReview(sess)}
                        aria-label={`Rate and review session with ${sess.mentorName}`}
                      >
                        ⭐ Rate &amp; Write Review
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* 4. Personal Goals Dashboard */}
          <section className="dashboard-panel" aria-labelledby="goals-heading">
            <div className="panel-header">
              <div className="panel-title-group">
                <span className="panel-icon" aria-hidden="true">🎯</span>
                <h2 id="goals-heading" className="panel-title">
                  My Goals Dashboard
                </h2>
              </div>
              <button
                type="button"
                className="btn-panel-action"
                onClick={() => setIsAddingGoal(!isAddingGoal)}
                aria-expanded={isAddingGoal}
              >
                {isAddingGoal ? 'Cancel' : '+ Add Goal'}
              </button>
            </div>

            <p className="panel-caption">
              Turn your short- and long-term plans into milestones you can track.
            </p>

            {isAddingGoal && (
              <form className="goal-builder" onSubmit={handleAddGoal}>
                <label className="goal-builder-field">
                  <span>Goal</span>
                  <input
                    type="text"
                    className="add-goal-input"
                    placeholder="e.g. Complete Docker & Containerization deployment"
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    required
                    autoFocus
                  />
                </label>
                <div className="goal-builder-row">
                  <label className="goal-builder-field">
                    <span>Timeframe</span>
                    <select
                      className="add-goal-input"
                      value={newGoalTimeframe}
                      onChange={(e) => setNewGoalTimeframe(e.target.value)}
                    >
                      <option value="short">Short-term</option>
                      <option value="long">Long-term</option>
                    </select>
                  </label>
                  <label className="goal-builder-field">
                    <span>Deadline</span>
                    <input
                      type="date"
                      className="add-goal-input"
                      value={newGoalDeadline}
                      onChange={(e) => setNewGoalDeadline(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <label className="goal-builder-field">
                  <span>Milestones <span className="goal-builder-hint">(one per line)</span></span>
                  <textarea
                    className="add-goal-input goal-milestones-input"
                    placeholder={'Outline the work\nComplete a first draft\nReview and refine'}
                    value={newGoalMilestones}
                    onChange={(e) => setNewGoalMilestones(e.target.value)}
                    required
                    rows={3}
                  />
                </label>
                <div className="goal-builder-actions">
                  <button type="submit" className="btn-add-goal-submit">
                    Save Goal
                  </button>
                </div>
              </form>
            )}

            <div className="goals-horizons">
              {[
                { id: 'short', label: 'Short-term goals', description: 'Focus for the next few weeks' },
                { id: 'long', label: 'Long-term goals', description: 'Bigger milestones on your horizon' },
              ].map((horizon) => {
                const horizonGoals = goals.filter((goal) => goal.timeframe === horizon.id);
                return (
                  <section className="goals-horizon" key={horizon.id} aria-labelledby={`goals-${horizon.id}-heading`}>
                    <div className="goals-horizon-header">
                      <div>
                        <h3 id={`goals-${horizon.id}-heading`}>{horizon.label}</h3>
                        <p>{horizon.description}</p>
                      </div>
                      <span className="goals-horizon-count">{horizonGoals.length}</span>
                    </div>
                    {horizonGoals.length > 0 ? (
                      <div className="goals-list">
                        {horizonGoals.map((goal) => {
                          const progress = getGoalProgress(goal);
                          const completed = progress === 100;
                          const completedMilestones = goal.milestones.filter((milestone) => milestone.completed).length;
                          return (
                            <article
                              key={goal.id}
                              className={`goal-item ${completed ? 'goal-completed' : ''}`}
                            >
                              <div className="goal-title-row">
                                <label className="goal-checkbox-container">
                                  <input
                                    type="checkbox"
                                    checked={completed}
                                    onChange={() => toggleGoal(goal.id)}
                                    aria-label={`Mark "${goal.title}" as completed`}
                                  />
                                  <span className="goal-checkmark"></span>
                                </label>
                                <span className={`goal-title ${completed ? 'strikethrough' : ''}`}>
                                  {goal.title}
                                </span>
                                <span className="goal-category-tag">{goal.category}</span>
                              </div>

                              <div className="goal-meta-row">
                                <span className="goal-deadline">
                                  <span aria-hidden="true">◷</span> Due {formatGoalDeadline(goal.deadline)}
                                </span>
                                <span className="goal-milestone-count">
                                  {completedMilestones}/{goal.milestones.length} milestones
                                </span>
                              </div>

                              <div
                                className="goal-progress-bar-bg"
                                role="progressbar"
                                aria-label={`${goal.title} progress`}
                                aria-valuenow={progress}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              >
                                <div
                                  className="goal-progress-fill"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="goal-progress-pct">{progress}% complete</span>

                              <ul className="goal-milestones">
                                {goal.milestones.map((milestone) => (
                                  <li key={milestone.id}>
                                    <label className={milestone.completed ? 'milestone-completed' : ''}>
                                      <input
                                        type="checkbox"
                                        checked={milestone.completed}
                                        onChange={() => toggleMilestone(goal.id, milestone.id)}
                                        aria-label={`Complete milestone: ${milestone.title}`}
                                      />
                                      <span>{milestone.title}</span>
                                    </label>
                                  </li>
                                ))}
                              </ul>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="goals-empty-horizon">No {horizon.id}-term goals yet. Add one to get started.</p>
                    )}
                  </section>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Sidebar: Recommended Mentors & Recently Viewed */}
        <aside className="dashboard-sidebar-col">
          {/* 4. Recommended Mentors */}
          <section className="dashboard-panel" aria-labelledby="recommended-heading">
            <div className="panel-header">
              <div className="panel-title-group">
                <span className="panel-icon" aria-hidden="true">💡</span>
                <h2 id="recommended-heading" className="panel-title">
                  Recommended Mentors
                </h2>
              </div>
            </div>

            <p className="panel-caption">
              Personalized based on your Capstone focus areas &amp; goals.
            </p>

            <div className="dashboard-mentors-stack">
              {recommendedMentors.map((mentor) => (
                <article key={mentor.id} className="compact-mentor-card">
                  <div className="compact-card-top">
                    <div className="compact-avatar" data-domain={mentor.category}>
                      {mentor.avatarInitials}
                    </div>
                    <div className="compact-meta">
                      <h3 className="compact-name">{mentor.name}</h3>
                      <p className="compact-role">{mentor.title}</p>
                      <span className="compact-badge" data-domain={mentor.category}>
                        {mentor.category}
                      </span>
                    </div>
                  </div>
                  <div className="compact-actions">
                    <button
                      type="button"
                      className="btn-compact-view"
                      onClick={() => onSelectMentor && onSelectMentor(mentor.id)}
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      className="btn-compact-book"
                      onClick={() => onQuickBookMentor ? onQuickBookMentor(mentor) : onSelectMentor && onSelectMentor(mentor.id)}
                    >
                      Book Session
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* 5. Recently Viewed Mentors */}
          <section className="dashboard-panel" aria-labelledby="recent-heading">
            <div className="panel-header">
              <div className="panel-title-group">
                <span className="panel-icon" aria-hidden="true">👀</span>
                <h2 id="recent-heading" className="panel-title">
                  Recently Viewed
                </h2>
              </div>
            </div>

            <div className="dashboard-mentors-stack">
              {recentlyViewedMentors.map((mentor) => (
                <article key={mentor.id} className="compact-mentor-card recent-card">
                  <div className="compact-card-top">
                    <div className="compact-avatar" data-domain={mentor.category}>
                      {mentor.avatarInitials}
                    </div>
                    <div className="compact-meta">
                      <h3 className="compact-name">{mentor.name}</h3>
                      <p className="compact-role">{mentor.title}</p>
                    </div>
                  </div>
                  <div className="compact-actions">
                    <button
                      type="button"
                      className="btn-compact-view"
                      onClick={() => onSelectMentor && onSelectMentor(mentor.id)}
                    >
                      Revisit Profile
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* Interactive Review Modal for Completed Sessions */}
      {reviewingSession && (
        <ReviewModal
          mentor={reviewingSession.mentor}
          initialTopic={reviewingSession.topic}
          onClose={() => setReviewingSession(null)}
          onSubmitReview={handleReviewSubmitted}
        />
      )}
    </div>
  );
}
