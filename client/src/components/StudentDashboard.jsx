import { useState, useMemo } from 'react';
import MentorCard from './MentorCard.jsx';
import { useToast } from '../context/ToastContext.jsx';

const DEFAULT_LEARNING_GOALS = [
  { id: 'g1', title: 'Master Distributed State & React Patterns', progress: 80, completed: false, category: 'Software Engineering' },
  { id: 'g2', title: 'Design Resilient Microservices & API Schemas', progress: 60, completed: false, category: 'Software Engineering' },
  { id: 'g3', title: 'Prepare for Tech Architecture & System Design Interviews', progress: 35, completed: false, category: 'Career Growth' },
];

const INITIAL_UPCOMING_SESSIONS = [
  {
    id: 'sess-1',
    mentorName: 'Aarav Sharma',
    mentorRole: 'Senior Frontend Engineer @ Fintech Labs',
    topic: 'React Architecture & State Performance Review',
    date: 'Nov 12, 2026',
    time: '10:00 AM – 11:00 AM IST',
    status: 'Confirmed',
    meetingLink: '#meeting-room',
  },
  {
    id: 'sess-2',
    mentorName: 'Dr. Priya Kulkarni',
    mentorRole: 'Lead AI Researcher @ NeuralEdge Labs',
    topic: 'Capstone LLM Agent Pipeline & Model Evaluation',
    date: 'Nov 16, 2026',
    time: '04:00 PM – 05:00 PM IST',
    status: 'Confirmed',
    meetingLink: '#meeting-room',
  },
];

export default function StudentDashboard({
  mentors = [],
  onSelectMentor,
  onQuickBookMentor,
}) {
  const toast = useToast();
  const [goals, setGoals] = useState(DEFAULT_LEARNING_GOALS);
  const [newGoalText, setNewGoalText] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [sessions, setSessions] = useState(INITIAL_UPCOMING_SESSIONS);

  // Student profile mock
  const student = {
    name: 'Sneha Viradiya',
    email: 'sneha@adypu.edu.in',
    department: 'Computer Engineering',
    year: 'Final Year Capstone',
    avatarInitials: 'SV',
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

  const toggleGoal = (id) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const updatedStatus = !g.completed;
          if (updatedStatus) {
            toast.success(`Goal completed: "${g.title}"! Keep up the momentum! 🎉`, 'Goal Achieved');
          }
          return {
            ...g,
            completed: updatedStatus,
            progress: updatedStatus ? 100 : Math.max(20, g.progress),
          };
        }
        return g;
      })
    );
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    const trimmed = newGoalText.trim();
    if (!trimmed) return;
    const newGoal = {
      id: `g-${Date.now()}`,
      title: trimmed,
      progress: 0,
      completed: false,
      category: 'Personal Goal',
    };
    setGoals((prev) => [newGoal, ...prev]);
    setNewGoalText('');
    setIsAddingGoal(false);
    toast.success('New learning milestone added to your dashboard!', 'Goal Added');
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
        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <div>
            <div className="stat-value">{sessions.length}</div>
            <div className="stat-label">Upcoming Sessions</div>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">🎯</span>
          <div>
            <div className="stat-value">
              {goals.filter((g) => g.completed).length} / {goals.length}
            </div>
            <div className="stat-label">Goals Completed</div>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">🌟</span>
          <div>
            <div className="stat-value">{recommendedMentors.length}</div>
            <div className="stat-label">Matched Mentors</div>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">⏱️</span>
          <div>
            <div className="stat-value">12 hrs</div>
            <div className="stat-label">Mentorship Logged</div>
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

          {/* 3. Learning Goals Section */}
          <section className="dashboard-panel" aria-labelledby="goals-heading">
            <div className="panel-header">
              <div className="panel-title-group">
                <span className="panel-icon" aria-hidden="true">🎯</span>
                <h2 id="goals-heading" className="panel-title">
                  Learning Goals &amp; Milestones
                </h2>
              </div>
              <button
                type="button"
                className="btn-panel-action"
                onClick={() => setIsAddingGoal(!isAddingGoal)}
              >
                {isAddingGoal ? 'Cancel' : '+ Add Goal'}
              </button>
            </div>

            {isAddingGoal && (
              <form className="add-goal-form" onSubmit={handleAddGoal}>
                <input
                  type="text"
                  className="add-goal-input"
                  placeholder="e.g. Complete Docker & Containerization deployment..."
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn-add-goal-submit">
                  Save Goal
                </button>
              </form>
            )}

            <div className="goals-list">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={`goal-item ${goal.completed ? 'goal-completed' : ''}`}
                >
                  <label className="goal-checkbox-container">
                    <input
                      type="checkbox"
                      checked={goal.completed}
                      onChange={() => toggleGoal(goal.id)}
                      aria-label={`Mark "${goal.title}" as completed`}
                    />
                    <span className="goal-checkmark"></span>
                  </label>

                  <div className="goal-body">
                    <div className="goal-title-row">
                      <span className={`goal-title ${goal.completed ? 'strikethrough' : ''}`}>
                        {goal.title}
                      </span>
                      <span className="goal-category-tag">{goal.category}</span>
                    </div>

                    <div className="goal-progress-bar-bg" role="progressbar" aria-valuenow={goal.progress} aria-valuemin="0" aria-valuemax="100">
                      <div
                        className="goal-progress-fill"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <span className="goal-progress-pct">{goal.progress}% completed</span>
                  </div>
                </div>
              ))}
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
    </div>
  );
}
