import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MentorProfile from '../components/MentorProfile.jsx';
import StudentDashboard from '../components/StudentDashboard.jsx';
import ReviewModal from '../components/ReviewModal.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import { MOCK_MENTORS } from '../data/mockMentors.js';

describe('Reviews and Testimonials System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleMentor = MOCK_MENTORS[0]; // Aarav Sharma with verified reviews

  it('renders verified reviews scorecard, recommendation percentage, and testimonials on Mentor Profile', () => {
    render(
      <ToastProvider>
        <MentorProfile mentor={sampleMentor} onBack={vi.fn()} onUpdateMentor={vi.fn()} />
      </ToastProvider>
    );

    // Header & Section titles
    expect(
      screen.getByRole('heading', { name: /Verified Reviews & Testimonials/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ratings and feedback submitted by ADYPU students/i)
    ).toBeInTheDocument();

    // Recommendation percentage pill
    expect(
      screen.getByText(/recommend this mentor/i)
    ).toBeInTheDocument();

    // Verified session badge and existing review text
    expect(screen.getAllByText(/✓ Verified Session/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Rohan Deshpande/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Super clear walk-through of Lighthouse optimizations/i)
    ).toBeInTheDocument();
  });

  it('opens ReviewModal when clicking "Rate & Write Review" button on profile', () => {
    render(
      <ToastProvider>
        <MentorProfile mentor={sampleMentor} onBack={vi.fn()} onUpdateMentor={vi.fn()} />
      </ToastProvider>
    );

    const writeReviewBtn = screen.getByRole('button', { name: /Write a review for Aarav Sharma/i });
    expect(writeReviewBtn).toBeInTheDocument();

    fireEvent.click(writeReviewBtn);

    expect(
      screen.getByRole('heading', { name: /Rate & Review Mentor/i, level: 2 })
    ).toBeInTheDocument();
    expect(screen.getByText(/Verified Session Testimonial:/i)).toBeInTheDocument();
  });

  it('submits a new verified review and triggers update callback and toast notification', async () => {
    const onUpdateMentor = vi.fn();

    render(
      <ToastProvider>
        <MentorProfile
          mentor={sampleMentor}
          onBack={vi.fn()}
          onUpdateMentor={onUpdateMentor}
        />
      </ToastProvider>
    );

    // Open review modal
    fireEvent.click(screen.getByRole('button', { name: /Write a review for Aarav Sharma/i }));

    // Type feedback comment
    const feedbackInput = screen.getByLabelText(/Detailed Feedback & Testimonial/i);
    fireEvent.change(feedbackInput, {
      target: {
        value: 'Aarav gave me tremendous guidance on state machines and memoization! Truly top tier mentor.',
      },
    });

    // Select 5 stars
    const starBtn = screen.getByRole('radio', { name: /5 stars/i });
    fireEvent.click(starBtn);

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Submit Verified Review/i }));

    await waitFor(() => {
      expect(onUpdateMentor).toHaveBeenCalled();
      const updated = onUpdateMentor.mock.calls[0][0];
      expect(updated.reviews[0].studentName).toBe('Jiya Srivastava');
      expect(updated.reviews[0].verified).toBe(true);
      expect(screen.getByTestId('toast-success')).toBeInTheDocument();
    });
  });

  it('allows rating a completed session from the Student Dashboard', async () => {
    const onAddReview = vi.fn();

    render(
      <ToastProvider>
        <StudentDashboard
          mentors={MOCK_MENTORS}
          onSelectMentor={vi.fn()}
          onQuickBookMentor={vi.fn()}
          onAddReview={onAddReview}
        />
      </ToastProvider>
    );

    // Check Completed Sessions heading
    expect(
      screen.getByRole('heading', { name: /Completed Sessions & Reviews/i })
    ).toBeInTheDocument();

    // Find the Rate & Write Review button for Dr. Priya Kulkarni
    const rateBtn = screen.getByRole('button', {
      name: /Rate and review session with Dr. Priya Kulkarni/i,
    });
    expect(rateBtn).toBeInTheDocument();

    fireEvent.click(rateBtn);

    // Modal opens
    expect(screen.getByRole('heading', { name: /Rate & Review Mentor/i })).toBeInTheDocument();

    // Type review
    const feedbackInput = screen.getByLabelText(/Detailed Feedback & Testimonial/i);
    fireEvent.change(feedbackInput, {
      target: {
        value: 'Dr. Priya helped us structure our LLM benchmarking experiment with outstanding clarity!',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Verified Review/i }));

    await waitFor(() => {
      expect(onAddReview).toHaveBeenCalled();
      expect(screen.getByTestId('toast-success')).toBeInTheDocument();
    });
  });

  it('increments helpful count when student clicks Helpful button', () => {
    render(
      <ToastProvider>
        <MentorProfile mentor={sampleMentor} onBack={vi.fn()} onUpdateMentor={vi.fn()} />
      </ToastProvider>
    );

    const helpfulBtn = screen.getAllByRole('button', { name: /Mark review as helpful/i })[0];
    const initialText = helpfulBtn.textContent;

    fireEvent.click(helpfulBtn);

    expect(helpfulBtn).toHaveClass('helpful-active');
    expect(helpfulBtn.textContent).not.toBe(initialText);
  });
});

