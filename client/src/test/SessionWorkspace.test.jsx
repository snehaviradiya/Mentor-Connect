import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SessionWorkspace from '../components/SessionWorkspace.jsx';
import App from '../App.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';

const session = {
  id: 'sess-test',
  mentorName: 'Aarav Sharma',
  topic: 'React Architecture Review',
  date: 'Nov 12, 2026',
  time: '10:00 AM – 11:00 AM IST',
  status: 'Confirmed',
};

function renderWorkspace(activeSession = session) {
  return render(
    <ToastProvider>
      <SessionWorkspace session={activeSession} onBack={() => {}} />
    </ToastProvider>
  );
}

describe('Session workspace', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the session tools and persists notes, resources, and action items per session', () => {
    renderWorkspace();

    expect(screen.getByRole('heading', { name: session.topic })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Meeting agenda' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Questions to ask' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Session notes'), {
      target: { value: 'Discuss component boundaries and rendering costs.' },
    });

    const actionInput = screen.getByLabelText('New action item');
    fireEvent.change(actionInput, { target: { value: 'Profile the dashboard render' } });
    fireEvent.submit(actionInput.closest('form'));

    fireEvent.change(screen.getByLabelText('Resource title'), {
      target: { value: 'React documentation' },
    });
    fireEvent.change(screen.getByLabelText('Resource URL'), {
      target: { value: 'https://react.dev' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add resource' }));

    const savedWorkspace = JSON.parse(
      localStorage.getItem('mentor-connect-workspace-sess-test')
    );
    expect(savedWorkspace.notes).toBe('Discuss component boundaries and rendering costs.');
    expect(savedWorkspace.actionItems[0].title).toBe('Profile the dashboard render');
    expect(savedWorkspace.resources[0]).toMatchObject({
      title: 'React documentation',
      url: 'https://react.dev/',
    });
  });

  it('uses a separate workspace for each session', () => {
    localStorage.setItem(
      'mentor-connect-workspace-sess-test',
      JSON.stringify({
        agenda: [],
        questions: [],
        notes: 'First session notes',
        resources: [],
        actionItems: [],
      })
    );
    const secondSession = { ...session, id: 'sess-second', topic: 'Another session' };

    renderWorkspace(secondSession);

    expect(screen.getByLabelText('Session notes')).toHaveValue('');
    expect(localStorage.getItem('mentor-connect-workspace-sess-second')).not.toBeNull();
  });

  it('rejects unsafe resource URLs', () => {
    renderWorkspace();
    fireEvent.change(screen.getByLabelText('Resource title'), {
      target: { value: 'Unsafe link' },
    });
    fireEvent.change(screen.getByLabelText('Resource URL'), {
      target: { value: 'javascript:alert(1)' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Add resource' }).closest('form'));

    expect(screen.getByTestId('toast-error')).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem('mentor-connect-workspace-sess-test')).resources
    ).toHaveLength(0);
  });

  it('opens a session workspace from the dashboard and returns to the dashboard', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
    fireEvent.click(
      screen.getByRole('button', { name: /Open Workspace for React Architecture & State Performance Review/i })
    );

    expect(
      screen.getByRole('heading', { name: 'React Architecture & State Performance Review' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Back to dashboard/i }));
    expect(screen.getByRole('heading', { name: 'Upcoming Sessions' })).toBeInTheDocument();
  });
});
