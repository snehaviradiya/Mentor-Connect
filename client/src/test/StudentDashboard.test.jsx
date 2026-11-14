import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import StudentDashboard from '../components/StudentDashboard.jsx';
import App from '../App.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import { MOCK_MENTORS } from '../data/mockMentors.js';

vi.mock('../services/api.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchStudentDashboard: vi.fn(),
    fetchSessions: vi.fn(),
    cancelBooking: vi.fn(),
    fetchMentors: vi.fn().mockRejectedValue(new Error('Offline')),
  };
});

import { fetchStudentDashboard, fetchSessions, cancelBooking } from '../services/api.js';

const studentDashboard = (overrides = {}) => ({
  status: 'success',
  data: { student: {
    profile: { id: 'mentee-7', name: 'Asha Student', email: 'asha@example.test', major: 'Robotics', university: 'ADYPU', graduationYear: 2027 },
    summary: { totalBookings: 2, upcomingSessions: 1, pastSessions: 1, cancelledSessions: 0 },
    upcomingSessions: [{ bookingId: 'booking-upcoming', mentor: { id: 'mentor-1', name: 'Aarav Sharma', title: 'Frontend Mentor', category: 'Software Engineering' }, sessionDate: '2026-12-01', timeSlot: '10:00 AM – 11:00 AM IST', sessionTopic: 'React Architecture & State Performance Review', status: 'confirmed' }],
    pastSessions: [{ bookingId: 'booking-past', mentor: { id: 'mentor-2', name: 'Dr. Priya Kulkarni', title: 'AI Researcher', category: 'AI' }, sessionDate: '2026-10-01', timeSlot: '02:00 PM – 03:00 PM IST', sessionTopic: 'Capstone LLM Agent Evaluation & Fine-Tuning', status: 'completed' }],
    cancelledSessions: [],
    ...overrides,
  } },
});

const liveSessions = {
  status: 'success',
  data: { sessions: [
    { id: 'session-upcoming', bookingId: 'booking-upcoming', status: 'SCHEDULED', reviewCount: 0 },
    { id: 'session-past', bookingId: 'booking-past', status: 'COMPLETED', reviewCount: 1 },
  ], total: 2 },
};

describe('Personalized Student Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.setItem('mentor_connect_token', 'student-token');
    fetchStudentDashboard.mockResolvedValue(studentDashboard());
    fetchSessions.mockResolvedValue(liveSessions);
    cancelBooking.mockResolvedValue({ status: 'success', data: { status: 'cancelled' } });
  });

  it('renders welcome back message, learning goals, upcoming sessions, recommended mentors, and quick book button', async () => {
    const onSelectMentor = vi.fn();
    const onQuickBookMentor = vi.fn();

    render(
      <ToastProvider>
        <StudentDashboard
          mentors={MOCK_MENTORS}
          onSelectMentor={onSelectMentor}
          onQuickBookMentor={onQuickBookMentor}
        />
      </ToastProvider>
    );

    // 1. Welcome back message
    expect(await screen.findByRole('heading', { name: /Welcome back, Asha Student!/i })).toBeInTheDocument();
    expect(screen.getByText(/Student Capstone Portal/i)).toBeInTheDocument();

    // 2. Quick booking button
    const quickBookBtn = screen.getByRole('button', { name: /Quick Book Consultation Session/i });
    expect(quickBookBtn).toBeInTheDocument();

    // 3. Upcoming sessions
    expect(screen.getByRole('heading', { name: /Session Management Board/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Upcoming Sessions/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Pending Sessions/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Cancelled Sessions/i })).toBeInTheDocument();
    expect(screen.getByText(/React Architecture & State Performance Review/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Dr. Priya Kulkarni/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Pending requests are not provided by the booking service/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upcoming Events' })).toBeInTheDocument();
    expect(screen.getByText('Designing Scalable AI Features for Student Projects')).toBeInTheDocument();
    expect(screen.getByText('Build and Ship a Production-Ready React Feature')).toBeInTheDocument();
    expect(screen.getByText('Capstone Project Clinic: Bring Your Architecture Questions')).toBeInTheDocument();
    expect(screen.getByText('Webinar')).toBeInTheDocument();
    expect(screen.getByText('Workshop')).toBeInTheDocument();
    expect(screen.getByText('Mentoring')).toBeInTheDocument();
    expect(screen.getByText('Expert Mentors')).toBeInTheDocument();
    expect(screen.getByText('Completed Bookings')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();

    // 4. Learning goals
    expect(
      screen.getByRole('heading', { name: /My Goals Dashboard/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Short-term goals' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Long-term goals' })).toBeInTheDocument();
    expect(
      screen.getByText(/Master Distributed State & React Patterns/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Due Nov 30, 2026')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', {
      name: 'Master Distributed State & React Patterns progress',
    })).toHaveAttribute('aria-valuenow', '80');
    expect(screen.getByText('Review state management fundamentals')).toBeInTheDocument();

    // 5. Recommended mentors
    expect(
      screen.getByRole('heading', { name: /Recommended Mentors/i })
    ).toBeInTheDocument();

    // 6. Recently viewed mentors
    expect(
      screen.getByRole('heading', { name: /Recently Viewed/i })
    ).toBeInTheDocument();
  });

  it('triggers quick booking button and notifies user', () => {
    const onQuickBookMentor = vi.fn();

    render(
      <ToastProvider>
        <StudentDashboard
          mentors={MOCK_MENTORS}
          onQuickBookMentor={onQuickBookMentor}
        />
      </ToastProvider>
    );

    const quickBookBtn = screen.getByRole('button', { name: /Quick Book Consultation Session/i });
    fireEvent.click(quickBookBtn);

    expect(onQuickBookMentor).toHaveBeenCalledWith(MOCK_MENTORS[0]);
    expect(screen.getByTestId('toast-info')).toBeInTheDocument();
    expect(screen.getByText(/Opening quick booking for Aarav Sharma/i)).toBeInTheDocument();
  });

  it('shows empty API-backed session columns without mock bookings', async () => {
    fetchStudentDashboard.mockResolvedValue(studentDashboard({
      summary: { totalBookings: 0, upcomingSessions: 0, pastSessions: 0, cancelledSessions: 0 },
      upcomingSessions: [], pastSessions: [], cancelledSessions: [],
    }));
    fetchSessions.mockResolvedValue({ status: 'success', data: { sessions: [], total: 0 } });
    render(
      <ToastProvider>
        <StudentDashboard mentors={MOCK_MENTORS} />
      </ToastProvider>
    );

    expect(await screen.findByText('No upcoming sessions.')).toBeInTheDocument();
    expect(screen.getByText('No past sessions & reviews.')).toBeInTheDocument();
    expect(screen.getByText('No cancelled sessions.')).toBeInTheDocument();
  });

  it('requires authentication when no saved token exists', async () => {
    window.sessionStorage.removeItem('mentor_connect_token');
    const onOpenSignup = vi.fn();
    render(<ToastProvider><StudentDashboard mentors={MOCK_MENTORS} onOpenSignup={onOpenSignup} /></ToastProvider>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Create a student account');
    expect(fetchStudentDashboard).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Create student account' }));
    expect(onOpenSignup).toHaveBeenCalled();
  });

  it('cancels a booking and refreshes the student dashboard', async () => {
    fetchStudentDashboard
      .mockResolvedValueOnce(studentDashboard())
      .mockResolvedValueOnce(studentDashboard({
        summary: { totalBookings: 2, upcomingSessions: 0, pastSessions: 1, cancelledSessions: 1 },
        upcomingSessions: [],
        cancelledSessions: [{ bookingId: 'booking-upcoming', mentor: { id: 'mentor-1', name: 'Aarav Sharma', title: 'Frontend Mentor', category: 'Software Engineering' }, sessionDate: '2026-12-01', timeSlot: '10:00 AM – 11:00 AM IST', sessionTopic: 'React Architecture & State Performance Review', status: 'cancelled' }],
      }));
    render(
      <ToastProvider>
        <StudentDashboard mentors={MOCK_MENTORS} />
      </ToastProvider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel session with Aarav Sharma' }));
    await waitFor(() => expect(cancelBooking).toHaveBeenCalledWith('booking-upcoming', 'student-token'));
    await waitFor(() => expect(fetchStudentDashboard).toHaveBeenCalledTimes(2));
    expect(fetchStudentDashboard).toHaveBeenCalledWith('student-token');
    expect(await screen.findByRole('article', { name: 'Cancelled session with Aarav Sharma' })).toBeInTheDocument();
  });

  it('shows a loading state then the authenticated student-specific data', async () => {
    let resolveDashboard;
    fetchStudentDashboard.mockReturnValueOnce(new Promise((resolve) => { resolveDashboard = resolve; }));
    render(<ToastProvider><StudentDashboard mentors={MOCK_MENTORS} /></ToastProvider>);
    expect(screen.getByRole('status')).toHaveTextContent('Loading your bookings');
    resolveDashboard(studentDashboard());
    expect(await screen.findByRole('heading', { name: /Welcome back, Asha Student!/i })).toBeInTheDocument();
    expect(fetchStudentDashboard).toHaveBeenCalledWith('student-token');
    expect(screen.getByText(/Robotics • Class of 2027 • asha@example.test/)).toBeInTheDocument();
  });

  it('deduplicates the initial dashboard request under React StrictMode', async () => {
    render(<StrictMode><ToastProvider><StudentDashboard mentors={MOCK_MENTORS} /></ToastProvider></StrictMode>);
    expect(await screen.findByRole('heading', { name: /Welcome back, Asha Student!/i })).toBeInTheDocument();
    expect(fetchStudentDashboard).toHaveBeenCalledTimes(1);
    expect(fetchSessions).toHaveBeenCalledTimes(1);
  });

  it('shows an error and retries failed dashboard fetches', async () => {
    fetchStudentDashboard.mockRejectedValueOnce(new Error('Service unavailable')).mockResolvedValueOnce(studentDashboard());
    render(<ToastProvider><StudentDashboard mentors={MOCK_MENTORS} /></ToastProvider>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: /Welcome back, Asha Student!/i })).toBeInTheDocument();
  });

  it('handles cancellation failure without hiding the booking', async () => {
    cancelBooking.mockRejectedValueOnce(new Error('Cancellation failed'));
    render(<ToastProvider><StudentDashboard mentors={MOCK_MENTORS} /></ToastProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel session with Aarav Sharma' }));
    expect(await screen.findByTestId('toast-error')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Confirmed session with Aarav Sharma' })).toBeInTheDocument();
    expect(fetchStudentDashboard).toHaveBeenCalledTimes(1);
  });

  it('clears expired authentication and offers account registration', async () => {
    fetchStudentDashboard.mockRejectedValueOnce(Object.assign(new Error('Expired'), { status: 401, code: 'TOKEN_INVALID' }));
    const onOpenSignup = vi.fn();
    render(<ToastProvider><StudentDashboard mentors={MOCK_MENTORS} onOpenSignup={onOpenSignup} /></ToastProvider>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Expired');
    expect(window.sessionStorage.getItem('mentor_connect_token')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Create student account' }));
    expect(onOpenSignup).toHaveBeenCalled();
  });

  it('allows adding a new learning goal', () => {
    render(
      <ToastProvider>
        <StudentDashboard mentors={MOCK_MENTORS} />
      </ToastProvider>
    );

    const addGoalBtn = screen.getByRole('button', { name: /\+ Add Goal/i });
    fireEvent.click(addGoalBtn);

    const input = screen.getByPlaceholderText(/Complete Docker & Containerization/i);
    fireEvent.change(input, { target: { value: 'Master WebSockets and Realtime Sync' } });
    fireEvent.change(screen.getByLabelText('Deadline'), { target: { value: '2027-02-01' } });
    fireEvent.change(screen.getByLabelText(/Milestones/), {
      target: { value: 'Build a realtime prototype\nReview the implementation' },
    });
    fireEvent.submit(input.closest('form'));

    expect(screen.getByText(/Master WebSockets and Realtime Sync/i)).toBeInTheDocument();
    expect(screen.getByText('Build a realtime prototype')).toBeInTheDocument();
    expect(screen.getByTestId('toast-success')).toBeInTheDocument();
  });

  it('updates goal progress and completion when milestones are checked off', () => {
    render(
      <ToastProvider>
        <StudentDashboard mentors={MOCK_MENTORS} />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('checkbox', {
      name: 'Complete milestone: Document patterns for the capstone',
    }));

    expect(screen.getByRole('progressbar', {
      name: 'Master Distributed State & React Patterns progress',
    })).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('Goals Completed').parentElement).toHaveTextContent('1 / 5');
    expect(screen.getByText('Goal completed: "Master Distributed State & React Patterns"! Keep up the momentum! 🎉')).toBeInTheDocument();
  });

  it('navigates to Dashboard tab from Navbar in main App', async () => {
    render(<App />);

    const dashboardNavBtn = screen.getByRole('button', { name: /^Dashboard$/i });
    expect(dashboardNavBtn).toBeInTheDocument();

    fireEvent.click(dashboardNavBtn);

    expect(await screen.findByRole('heading', { name: /Welcome back, Asha Student!/i })).toBeInTheDocument();
  });
});
