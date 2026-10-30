import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.jsx';
import MentorProfile from '../components/MentorProfile.jsx';

describe('Profile Navigation', () => {
  it('opens detailed mentor profile upon clicking View Profile', () => {
    render(<App />);

    // Click View Profile for Aarav Sharma
    const viewProfileBtn = screen.getByRole('button', { name: /View detailed profile of Aarav Sharma/i });
    fireEvent.click(viewProfileBtn);

    // Profile header and sections should be visible
    expect(screen.getByRole('heading', { name: 'Aarav Sharma', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Senior Frontend Engineer @ Fintech Labs/i)).toBeInTheDocument();
    expect(screen.getByText(/B.Tech in Computer Engineering \(ADYPU Alum\)/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /About the Mentor/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Technical & Domain Expertise/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Mentorship Focus Areas/i })).toBeInTheDocument();
  });

  it('returns to discovery directory when clicking Back to Mentors', () => {
    const { container } = render(<App />);

    const viewProfileBtn = screen.getByRole('button', { name: /View detailed profile of Aarav Sharma/i });
    fireEvent.click(viewProfileBtn);

    const backBtn = screen.getByRole('button', { name: /Return to mentor discovery page/i });
    fireEvent.click(backBtn);

    // Discovery hero and directory should be back
    expect(screen.getByRole('heading', { name: /Learn from people who've already been there/i, level: 1 })).toBeInTheDocument();
    expect(container.querySelector('.results-count')).toHaveTextContent('Showing 8 of 8 mentors');
  });

  it('preserves search and category filters when returning from profile', () => {
    const { container } = render(<App />);

    // Apply category filter and search term
    const aiPill = screen.getByRole('button', { name: 'Data Science & AI' });
    fireEvent.click(aiPill);

    const searchInput = screen.getByLabelText(/Search Mentors/i);
    fireEvent.change(searchInput, { target: { value: 'Priya' } });

    expect(container.querySelector('.results-count')).toHaveTextContent('Showing 1 of 8 mentors');

    // Open profile
    const viewProfileBtn = screen.getByRole('button', { name: /View detailed profile of Dr. Priya Kulkarni/i });
    fireEvent.click(viewProfileBtn);

    // Return to directory
    const backBtn = screen.getByRole('button', { name: /Return to mentor discovery page/i });
    fireEvent.click(backBtn);

    // Inputs and filtered count must remain preserved
    expect(screen.getByLabelText(/Search Mentors/i).value).toBe('Priya');
    expect(container.querySelector('.results-count')).toHaveTextContent('Showing 1 of 8 mentors');
    expect(screen.getByRole('heading', { name: 'Dr. Priya Kulkarni', level: 3 })).toBeInTheDocument();
  });

  it('renders graceful error view when mentor is missing or invalid', () => {
    render(<MentorProfile mentor={null} onBack={() => {}} />);

    expect(screen.getByRole('heading', { name: /Mentor Profile Not Found/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to Mentor Discovery/i })).toBeInTheDocument();
  });
});
