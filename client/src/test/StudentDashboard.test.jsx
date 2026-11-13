import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StudentDashboard from '../components/StudentDashboard.jsx';
import App from '../App.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import { MOCK_MENTORS } from '../data/mockMentors.js';

describe('Personalized Student Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders welcome back message, learning goals, upcoming sessions, recommended mentors, and quick book button', () => {
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
    expect(
      screen.getByRole('heading', { name: /Welcome back, Jiya Srivastava!/i })
    ).toBeInTheDocument();
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
    expect(screen.getByText(/Portfolio Review & Design Systems/i)).toBeInTheDocument();
    expect(screen.getByText('Expert Mentors')).toBeInTheDocument();
    expect(screen.getByText('Completed Bookings')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);

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

  it('moves a cancelled pending request into the cancelled column', () => {
    render(
      <ToastProvider>
        <StudentDashboard mentors={MOCK_MENTORS} />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', {
      name: 'Cancel pending session with Ananya Verma',
    }));

    expect(screen.getByText('No pending sessions.')).toBeInTheDocument();
    expect(screen.getByRole('article', {
      name: 'Cancelled session with Ananya Verma',
    })).toBeInTheDocument();
    expect(screen.getByText('Session with Ananya Verma has been cancelled.')).toBeInTheDocument();
  });

  it('moves a cancelled upcoming booking into the cancelled column', () => {
    render(
      <ToastProvider>
        <StudentDashboard mentors={MOCK_MENTORS} />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', {
      name: 'Cancel session with Aarav Sharma',
    }));

    expect(screen.queryByRole('article', {
      name: 'Confirmed session with Aarav Sharma',
    })).not.toBeInTheDocument();
    expect(screen.getByRole('article', {
      name: 'Cancelled session with Aarav Sharma',
    })).toBeInTheDocument();
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

  it('navigates to Dashboard tab from Navbar in main App', () => {
    render(<App />);

    const dashboardNavBtn = screen.getByRole('button', { name: /^Dashboard$/i });
    expect(dashboardNavBtn).toBeInTheDocument();

    fireEvent.click(dashboardNavBtn);

    expect(
      screen.getByRole('heading', { name: /Welcome back, Jiya Srivastava!/i })
    ).toBeInTheDocument();
  });
});
