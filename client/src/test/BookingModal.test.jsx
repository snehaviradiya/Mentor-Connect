import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookingModal from '../components/BookingModal.jsx';
import { createBooking, ApiError } from '../services/api.js';

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
    fetchMentors: vi.fn(),
    ApiError: MockApiError,
  };
});

const mockMentor = {
  id: 'mentor-1',
  name: 'Aarav Sharma',
  category: 'Software Engineering',
};

describe('Booking Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with mentor details and live API notice', () => {
    render(<BookingModal mentor={mockMentor} onClose={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: /Request a Demo Session/i, level: 2 })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Aarav Sharma/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Live Booking Integration/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Submit Booking Request/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Booking completion')).toHaveAttribute('aria-valuenow', '0');
  });

  it('animates booking progress as contact, schedule, and request details are completed', () => {
    render(<BookingModal mentor={mockMentor} onClose={vi.fn()} />);
    const progress = screen.getByLabelText('Booking completion');
    fireEvent.change(screen.getByLabelText(/Your Full Name/i), {
      target: { value: 'Abhay Kumar' },
    });
    fireEvent.change(screen.getByLabelText(/University Email Address/i), {
      target: { value: 'abhay@adypu.edu.in' },
    });
    expect(progress).toHaveAttribute('aria-valuenow', '33');

    fireEvent.change(screen.getByLabelText(/Session Date/i), {
      target: { value: '2026-11-15' },
    });
    fireEvent.change(screen.getByLabelText(/Demo Time Slot/i), {
      target: { value: 'slot-1' },
    });
    expect(progress).toHaveAttribute('aria-valuenow', '67');

    fireEvent.change(screen.getByLabelText(/Session Objective \/ Topic/i), {
      target: { value: 'Architecture Review' },
    });
    expect(progress).toHaveAttribute('aria-valuenow', '90');
  });

  it('validates required fields upon submitting an empty form without dispatching API call', () => {
    render(<BookingModal mentor={mockMentor} onClose={vi.fn()} />);

    const submitBtn = screen.getByRole('button', { name: /Submit Booking Request/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Session date is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Please select a demo time slot/i)).toBeInTheDocument();
    expect(screen.getByText(/Session objective\/topic is required/i)).toBeInTheDocument();

    expect(createBooking).not.toHaveBeenCalled();
  });

  it('rejects invalid email formats without dispatching API call', () => {
    render(<BookingModal mentor={mockMentor} onClose={vi.fn()} />);

    const emailInput = screen.getByLabelText(/University Email Address/i);
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Booking Request/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    expect(createBooking).not.toHaveBeenCalled();
  });

  it('enforces character count limits on topic and notes', () => {
    render(<BookingModal mentor={mockMentor} onClose={vi.fn()} />);

    const topicInput = screen.getByLabelText(/Session Objective \/ Topic/i);
    const notesTextarea = screen.getByLabelText(/Additional Notes/i);

    expect(topicInput).toHaveAttribute('maxLength', '150');
    expect(notesTextarea).toHaveAttribute('maxLength', '500');

    fireEvent.change(topicInput, { target: { value: 'Hello' } });
    expect(screen.getByText('5/150')).toBeInTheDocument();

    fireEvent.change(notesTextarea, { target: { value: 'Important notes' } });
    expect(screen.getByText('15/500')).toBeInTheDocument();
  });

  it('calls onClose when clicking the close button or cancel button', () => {
    const handleClose = vi.fn();
    render(<BookingModal mentor={mockMentor} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /Close booking modal/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('calls onClose when pressing the Escape key', () => {
    const handleClose = vi.fn();
    render(<BookingModal mentor={mockMentor} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('dispatches createBooking with exact payload including mentorId, timeSlot label and trimmed text', async () => {
    createBooking.mockResolvedValueOnce({
      status: 'success',
      data: {
        bookingId: 'bk_11223344',
        mentorId: 'mentor-1',
        mentorName: 'Aarav Sharma',
        sessionDate: '2026-11-15',
        timeSlot: '10:00 AM – 11:00 AM IST',
        status: 'confirmed',
        createdAt: '2026-10-23T15:00:00.000Z',
      },
    });

    render(<BookingModal mentor={mockMentor} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Your Full Name/i), {
      target: { value: '  Abhay Kumar  ' },
    });
    fireEvent.change(screen.getByLabelText(/University Email Address/i), {
      target: { value: '  abhay@adypu.edu.in  ' },
    });
    fireEvent.change(screen.getByLabelText(/Session Date/i), {
      target: { value: '2026-11-15' },
    });
    fireEvent.change(screen.getByLabelText(/Demo Time Slot/i), {
      target: { value: 'slot-1' },
    });
    fireEvent.change(screen.getByLabelText(/Session Objective \/ Topic/i), {
      target: { value: '  Architecture Review  ' },
    });
    fireEvent.change(screen.getByLabelText(/Additional Notes/i), {
      target: { value: '  Portfolio review  ' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Booking Request/i }));

    await waitFor(() => {
      expect(createBooking).toHaveBeenCalledTimes(1);
      expect(createBooking).toHaveBeenCalledWith({
        mentorId: 'mentor-1',
        studentName: 'Abhay Kumar',
        studentEmail: 'abhay@adypu.edu.in',
        sessionDate: '2026-11-15',
        timeSlot: '10:00 AM – 11:00 AM IST',
        sessionTopic: 'Architecture Review',
        notes: 'Portfolio review',
      });
      expect(screen.getByText('Abhay Kumar (abhay@adypu.edu.in)')).toBeInTheDocument();
      expect(screen.getByText('Architecture Review')).toBeInTheDocument();
      expect(screen.getByText('Portfolio review')).toBeInTheDocument();
    });
  });

  it('displays loading state and prevents duplicate submission while request is in flight', async () => {
    let resolvePromise;
    createBooking.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    render(<BookingModal mentor={mockMentor} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Your Full Name/i), {
      target: { value: 'Abhay Kumar' },
    });
    fireEvent.change(screen.getByLabelText(/University Email Address/i), {
      target: { value: 'abhay@adypu.edu.in' },
    });
    fireEvent.change(screen.getByLabelText(/Session Date/i), {
      target: { value: '2026-11-01' },
    });
    fireEvent.change(screen.getByLabelText(/Demo Time Slot/i), {
      target: { value: 'slot-1' },
    });
    fireEvent.change(screen.getByLabelText(/Session Objective \/ Topic/i), {
      target: { value: 'Code Review' },
    });

    const submitBtn = screen.getByRole('button', { name: /Submit Booking Request/i });
    fireEvent.click(submitBtn);

    // Verify loading label and disabled status
    expect(screen.getByRole('button', { name: /Submitting\.\.\./i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();

    // Secondary click attempt should not trigger a second API call
    fireEvent.click(submitBtn);
    expect(createBooking).toHaveBeenCalledTimes(1);

    // Resolve the promise
    resolvePromise({
      status: 'success',
      data: {
        bookingId: 'bk_load1234',
        mentorId: 'mentor-1',
        mentorName: 'Aarav Sharma',
        studentName: 'Abhay Kumar',
        studentEmail: 'abhay@adypu.edu.in',
        sessionDate: '2026-11-01',
        timeSlot: '10:00 AM – 11:00 AM IST',
        sessionTopic: 'Code Review',
        notes: '',
        status: 'confirmed',
        createdAt: '2026-10-23T15:00:00.000Z',
      },
    });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Session Confirmed & Booked/i, level: 3 })
      ).toBeInTheDocument();
    });
  });

  it('renders booking confirmation receipt with server-generated bookingId and confirmed status', async () => {
    createBooking.mockResolvedValueOnce({
      status: 'success',
      data: {
        bookingId: 'bk_fedcba98',
        mentorId: 'mentor-1',
        mentorName: 'Aarav Sharma',
        studentName: 'Abhay Kumar',
        studentEmail: 'abhay@adypu.edu.in',
        sessionDate: '2026-11-01',
        timeSlot: '02:00 PM – 03:00 PM IST',
        sessionTopic: 'Career Advice',
        notes: 'Resume review requested',
        status: 'confirmed',
        createdAt: '2026-10-23T15:00:00.000Z',
      },
    });

    render(<BookingModal mentor={mockMentor} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Your Full Name/i), {
      target: { value: 'Abhay Kumar' },
    });
    fireEvent.change(screen.getByLabelText(/University Email Address/i), {
      target: { value: 'abhay@adypu.edu.in' },
    });
    fireEvent.change(screen.getByLabelText(/Session Date/i), {
      target: { value: '2026-11-01' },
    });
    fireEvent.change(screen.getByLabelText(/Demo Time Slot/i), {
      target: { value: 'slot-2' },
    });
    fireEvent.change(screen.getByLabelText(/Session Objective \/ Topic/i), {
      target: { value: 'Career Advice' },
    });
    fireEvent.change(screen.getByLabelText(/Additional Notes/i), {
      target: { value: 'Resume review requested' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Booking Request/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Session Confirmed & Booked/i, level: 3 })
      ).toBeInTheDocument();
      expect(screen.getByText('bk_fedcba98')).toBeInTheDocument();
      expect(screen.getAllByText(/confirmed/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Resume review requested/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Return to Mentor Profile/i })
      ).toBeInTheDocument();
    });
  });

  it('handles 409 SLOT_UNAVAILABLE response by displaying server conflict message and permits selecting another slot', async () => {
    createBooking.mockRejectedValueOnce(
      new ApiError(
        'The selected time slot (2026-11-01 at 04:00 PM – 05:00 PM IST) is already booked for Aarav Sharma',
        409,
        'SLOT_UNAVAILABLE'
      )
    );

    render(<BookingModal mentor={mockMentor} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Your Full Name/i), {
      target: { value: 'Abhay Kumar' },
    });
    fireEvent.change(screen.getByLabelText(/University Email Address/i), {
      target: { value: 'abhay@adypu.edu.in' },
    });
    fireEvent.change(screen.getByLabelText(/Session Date/i), {
      target: { value: '2026-11-01' },
    });
    fireEvent.change(screen.getByLabelText(/Demo Time Slot/i), {
      target: { value: 'slot-3' },
    });
    fireEvent.change(screen.getByLabelText(/Session Objective \/ Topic/i), {
      target: { value: 'System Architecture' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Booking Request/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Time Slot Unavailable/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/already booked for Aarav Sharma/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Choose Another Time Slot/i })
      ).toBeInTheDocument();
    });

    // Clicking 'Choose Another Time Slot' returns to the form with user inputs preserved
    fireEvent.click(screen.getByRole('button', { name: /Choose Another Time Slot/i }));
    expect(screen.getByLabelText(/Your Full Name/i)).toHaveValue('Abhay Kumar');
    expect(screen.getByLabelText(/University Email Address/i)).toHaveValue(
      'abhay@adypu.edu.in'
    );
  });

  it('handles 400 VALIDATION_ERROR response by rendering backend validation errors in alert banner', async () => {
    createBooking.mockRejectedValueOnce(
      new ApiError('Invalid booking parameters provided', 400, 'VALIDATION_ERROR', [
        'sessionDate cannot be in the past',
      ])
    );

    render(<BookingModal mentor={mockMentor} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Your Full Name/i), {
      target: { value: 'Abhay Kumar' },
    });
    fireEvent.change(screen.getByLabelText(/University Email Address/i), {
      target: { value: 'abhay@adypu.edu.in' },
    });
    fireEvent.change(screen.getByLabelText(/Session Date/i), {
      target: { value: '2026-11-01' },
    });
    fireEvent.change(screen.getByLabelText(/Demo Time Slot/i), {
      target: { value: 'slot-1' },
    });
    fireEvent.change(screen.getByLabelText(/Session Objective \/ Topic/i), {
      target: { value: 'Test Topic' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Booking Request/i }));

    await waitFor(() => {
      const alertEl = screen.getByRole('alert');
      expect(alertEl).toHaveTextContent(/sessionDate cannot be in the past/i);
    });
  });

  it('handles 404 MENTOR_NOT_FOUND response by rendering error banner', async () => {
    createBooking.mockRejectedValueOnce(
      new ApiError('Mentor with ID mentor-1 does not exist', 404, 'MENTOR_NOT_FOUND')
    );

    render(<BookingModal mentor={mockMentor} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Your Full Name/i), {
      target: { value: 'Abhay Kumar' },
    });
    fireEvent.change(screen.getByLabelText(/University Email Address/i), {
      target: { value: 'abhay@adypu.edu.in' },
    });
    fireEvent.change(screen.getByLabelText(/Session Date/i), {
      target: { value: '2026-11-01' },
    });
    fireEvent.change(screen.getByLabelText(/Demo Time Slot/i), {
      target: { value: 'slot-1' },
    });
    fireEvent.change(screen.getByLabelText(/Session Objective \/ Topic/i), {
      target: { value: 'Test Topic' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Booking Request/i }));

    await waitFor(() => {
      const alertEl = screen.getByRole('alert');
      expect(alertEl).toHaveTextContent(/Mentor with ID mentor-1 does not exist/i);
    });
  });

  it('handles generic 500 server errors gracefully with error banner', async () => {
    createBooking.mockRejectedValueOnce(
      new ApiError('Internal server error occurred', 500, 'INTERNAL_SERVER_ERROR')
    );

    render(<BookingModal mentor={mockMentor} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Your Full Name/i), {
      target: { value: 'Abhay Kumar' },
    });
    fireEvent.change(screen.getByLabelText(/University Email Address/i), {
      target: { value: 'abhay@adypu.edu.in' },
    });
    fireEvent.change(screen.getByLabelText(/Session Date/i), {
      target: { value: '2026-11-01' },
    });
    fireEvent.change(screen.getByLabelText(/Demo Time Slot/i), {
      target: { value: 'slot-1' },
    });
    fireEvent.change(screen.getByLabelText(/Session Objective \/ Topic/i), {
      target: { value: 'Test Topic' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Booking Request/i }));

    await waitFor(() => {
      const alertEl = screen.getByRole('alert');
      expect(alertEl).toHaveTextContent(/Internal server error occurred/i);
    });
  });

  it('handles network connection failure gracefully without crashing', async () => {
    createBooking.mockRejectedValueOnce(
      new ApiError(
        'Unable to connect to the server. Please check your network connection.',
        0,
        'NETWORK_ERROR'
      )
    );

    render(<BookingModal mentor={mockMentor} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Your Full Name/i), {
      target: { value: 'Abhay Kumar' },
    });
    fireEvent.change(screen.getByLabelText(/University Email Address/i), {
      target: { value: 'abhay@adypu.edu.in' },
    });
    fireEvent.change(screen.getByLabelText(/Session Date/i), {
      target: { value: '2026-11-01' },
    });
    fireEvent.change(screen.getByLabelText(/Demo Time Slot/i), {
      target: { value: 'slot-1' },
    });
    fireEvent.change(screen.getByLabelText(/Session Objective \/ Topic/i), {
      target: { value: 'Test Topic' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Booking Request/i }));

    await waitFor(() => {
      const alertEl = screen.getByRole('alert');
      expect(alertEl).toHaveTextContent(/Unable to connect to the server/i);
    });
  });
});
