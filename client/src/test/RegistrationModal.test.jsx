import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RegistrationModal from '../components/RegistrationModal.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import { registerUser } from '../services/api.js';

vi.mock('../services/api.js', () => ({
  registerUser: vi.fn(),
}));

function renderRegistration() {
  return render(
    <ToastProvider>
      <RegistrationModal onClose={vi.fn()} />
    </ToastProvider>
  );
}

describe('Student registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('moves through validated steps and registers the student account', async () => {
    registerUser.mockResolvedValueOnce({
      status: 'success',
      data: {
        token: 'session-token',
        user: { id: 'student-1', name: 'Jiya Srivastava', email: 'jiya@adypu.edu.in', role: 'STUDENT' },
      },
    });

    renderRegistration();
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Jiya Srivastava' },
    });
    fireEvent.change(screen.getByLabelText('University email'), {
      target: { value: 'jiya@adypu.edu.in' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByLabelText('Registration completion')).toHaveAttribute('aria-valuenow', '50');
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secure-password' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'secure-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('jiya@adypu.edu.in')).toBeInTheDocument();
    expect(screen.getByLabelText('Registration completion')).toHaveAttribute('aria-valuenow', '85');
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        name: 'Jiya Srivastava',
        email: 'jiya@adypu.edu.in',
        password: 'secure-password',
      });
      expect(sessionStorage.getItem('mentor_connect_token')).toBe('session-token');
      expect(screen.getByRole('heading', { name: 'You’re all set!' })).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Registration completion')).toHaveAttribute('aria-valuenow', '100');
  });

  it('shows registration errors from the API without advancing to success', async () => {
    registerUser.mockRejectedValueOnce(new Error('An account with this email already exists.'));
    renderRegistration();
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Jiya Srivastava' } });
    fireEvent.change(screen.getByLabelText('University email'), {
      target: { value: 'jiya@adypu.edu.in' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure-password' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'secure-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('An account with this email already exists.', {
      selector: 'p.registration-error',
    })).toHaveTextContent(
      'An account with this email already exists.'
    );
    expect(screen.queryByRole('heading', { name: 'You’re all set!' })).not.toBeInTheDocument();
  });
});
