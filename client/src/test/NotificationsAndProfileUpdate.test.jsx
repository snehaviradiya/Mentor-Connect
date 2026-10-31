import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookingModal from '../components/BookingModal.jsx';
import MentorProfile from '../components/MentorProfile.jsx';
import EditProfileModal from '../components/EditProfileModal.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import { createBooking, updateMentorProfile, ApiError } from '../services/api.js';

vi.mock('../services/api.js', () => {
  class MockApiError extends Error {
    constructor(message, status, code = null, details = null) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
      this.details = details;
    }
  }

  return {
    createBooking: vi.fn(),
    updateMentorProfile: vi.fn(),
    fetchMentors: vi.fn(),
    ApiError: MockApiError,
  };
});

const sampleMentor = {
  id: 'mentor-1',
  name: 'Aarav Sharma',
  title: 'Senior Frontend Engineer @ Fintech Labs',
  category: 'Software Engineering',
  bio: 'ADYPU alumnus with 6+ years in frontend architecture and distributed web apps.',
  expertise: ['React', 'TypeScript', 'Web Performance'],
  sampleAvailability: 'Tuesdays & Thursdays, 4:00 PM – 6:00 PM IST',
  avatarInitials: 'AS',
  education: 'B.Tech in Computer Engineering (ADYPU Alum)',
  experience: '6+ years in industry',
  mentoringTopics: ['Frontend Architecture', 'Technical Interview Prep'],
};

describe('Notifications & Feedback Messages (Booking & Profile Update)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows success message and toast notification when booking succeeds', async () => {
    createBooking.mockResolvedValueOnce({
      status: 'success',
      data: {
        bookingId: 'bk_demo_123',
        mentorName: 'Aarav Sharma',
        studentName: 'Sneha Viradiya',
        studentEmail: 'sneha@adypu.edu.in',
        sessionDate: '2026-11-05',
        timeSlot: '10:00 AM – 11:00 AM IST',
        sessionTopic: 'React Architecture Review',
        status: 'confirmed',
      },
    });

    render(
      <ToastProvider>
        <BookingModal mentor={sampleMentor} onClose={vi.fn()} />
      </ToastProvider>
    );

    fireEvent.change(screen.getByLabelText(/Your Full Name/i), {
      target: { value: 'Sneha Viradiya' },
    });
    fireEvent.change(screen.getByLabelText(/University Email Address/i), {
      target: { value: 'sneha@adypu.edu.in' },
    });
    fireEvent.change(screen.getByLabelText(/Session Date/i), {
      target: { value: '2026-11-05' },
    });
    fireEvent.change(screen.getByLabelText(/Demo Time Slot/i), {
      target: { value: 'slot-1' },
    });
    fireEvent.change(screen.getByLabelText(/Session Objective \/ Topic/i), {
      target: { value: 'React Architecture Review' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Booking Request/i }));

    await waitFor(() => {
      // In-modal receipt confirmation
      expect(screen.getByRole('heading', { name: /Session Confirmed & Booked/i })).toBeInTheDocument();
      // Toast notification
      expect(screen.getByTestId('toast-success')).toBeInTheDocument();
      expect(screen.getAllByText(/Session Confirmed/i).length).toBeGreaterThanOrEqual(2);
    });
  });

  it('shows error message and toast notification when booking time slot is unavailable', async () => {
    createBooking.mockRejectedValueOnce(
      new ApiError('The selected time slot is already booked for this mentor.', 409, 'SLOT_UNAVAILABLE')
    );

    render(
      <ToastProvider>
        <BookingModal mentor={sampleMentor} onClose={vi.fn()} />
      </ToastProvider>
    );

    fireEvent.change(screen.getByLabelText(/Your Full Name/i), {
      target: { value: 'Sneha Viradiya' },
    });
    fireEvent.change(screen.getByLabelText(/University Email Address/i), {
      target: { value: 'sneha@adypu.edu.in' },
    });
    fireEvent.change(screen.getByLabelText(/Session Date/i), {
      target: { value: '2026-11-05' },
    });
    fireEvent.change(screen.getByLabelText(/Demo Time Slot/i), {
      target: { value: 'slot-4' },
    });
    fireEvent.change(screen.getByLabelText(/Session Objective \/ Topic/i), {
      target: { value: 'Conflict slot test' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Booking Request/i }));

    await waitFor(() => {
      // In-modal conflict outcome
      expect(screen.getByRole('heading', { name: /Time Slot Unavailable/i })).toBeInTheDocument();
      // Toast notification for error
      expect(screen.getByTestId('toast-error')).toBeInTheDocument();
      expect(screen.getAllByText(/The selected time slot is already booked/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens edit profile modal from MentorProfile view', () => {
    render(
      <ToastProvider>
        <MentorProfile mentor={sampleMentor} onBack={vi.fn()} onUpdateMentor={vi.fn()} />
      </ToastProvider>
    );

    const editBtn = screen.getByRole('button', { name: /Edit profile of Aarav Sharma/i });
    expect(editBtn).toBeInTheDocument();
    fireEvent.click(editBtn);

    expect(screen.getByRole('heading', { name: /Edit Mentor Profile/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByDisplayValue(sampleMentor.title)).toBeInTheDocument();
  });

  it('shows success message and toast notification when profile is updated', async () => {
    updateMentorProfile.mockResolvedValueOnce({
      status: 'success',
      data: {
        mentor: {
          ...sampleMentor,
          title: 'Principal Frontend Architect @ Global Tech',
        },
      },
    });

    const onUpdateMock = vi.fn();

    render(
      <ToastProvider>
        <MentorProfile
          mentor={sampleMentor}
          onBack={vi.fn()}
          onUpdateMentor={onUpdateMock}
        />
      </ToastProvider>
    );

    // Open edit modal
    fireEvent.click(screen.getByRole('button', { name: /Edit profile of Aarav Sharma/i }));

    // Change title
    const titleInput = screen.getByLabelText(/Professional Title \/ Role/i);
    fireEvent.change(titleInput, {
      target: { value: 'Principal Frontend Architect @ Global Tech' },
    });

    // Save changes
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(onUpdateMock).toHaveBeenCalled();
      // Toast notification for success
      expect(screen.getByTestId('toast-success')).toBeInTheDocument();
      expect(screen.getByText(/Profile for Aarav Sharma has been successfully updated!/i)).toBeInTheDocument();
    });
  });

  it('shows error validation message when required profile fields are empty', async () => {
    render(
      <ToastProvider>
        <EditProfileModal
          mentor={sampleMentor}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      </ToastProvider>
    );

    // Clear title
    const titleInput = screen.getByLabelText(/Professional Title \/ Role/i);
    fireEvent.change(titleInput, { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    expect(screen.getByText(/Professional title is required/i)).toBeInTheDocument();
    expect(screen.getByTestId('toast-error')).toBeInTheDocument();
    expect(screen.getByText(/Please resolve the highlighted validation errors/i)).toBeInTheDocument();
  });

  it('allows dismissing a toast notification via close button', async () => {
    render(
      <ToastProvider>
        <EditProfileModal
          mentor={sampleMentor}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      </ToastProvider>
    );

    const titleInput = screen.getByLabelText(/Professional Title \/ Role/i);
    fireEvent.change(titleInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    const toastEl = screen.getByTestId('toast-error');
    expect(toastEl).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: /Dismiss notification/i });
    fireEvent.click(dismissBtn);

    expect(screen.queryByTestId('toast-error')).not.toBeInTheDocument();
  });
});
