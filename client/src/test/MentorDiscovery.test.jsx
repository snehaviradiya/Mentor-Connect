import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.jsx';
import { MOCK_MENTORS } from '../data/mockMentors.js';

describe('Mentor Discovery', () => {
  it('shows the mentorship journey home with live mentor search and recommendations', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Build something extraordinary.' })).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('Expert mentors')).toBeInTheDocument();
    expect(screen.getByText('Your upcoming sessions')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search skills, mentors, goals...')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /View profile of recommended mentor Aarav Sharma/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('4.9 out of 5, 24 reviews')).toBeInTheDocument();
    expect(screen.getAllByText('Senior Frontend Engineer @ Fintech Labs')).toHaveLength(2);

    const searchInput = screen.getByLabelText(/Search Mentors/i);
    fireEvent.change(searchInput, { target: { value: 'Python' } });
    expect(
      screen.getByRole('button', { name: /View profile of recommended mentor Dr\. Priya Kulkarni/i })
    ).toBeInTheDocument();
  });

  it('renders all mentor cards from fixture dataset on initial load', () => {
    const { container } = render(<App />);

    // Verify all mentors in the dataset are rendered by name
    MOCK_MENTORS.forEach((mentor) => {
      expect(screen.getByRole('heading', { name: mentor.name, level: 3 })).toBeInTheDocument();
    });

    // Verify results count message across nested elements
    const resultsCountEl = container.querySelector('.results-count');
    expect(resultsCountEl).toHaveTextContent('Showing 8 of 8 mentors');
  });

  it('searches mentors by name and displays matching result', () => {
    const { container } = render(<App />);
    const searchInput = screen.getByLabelText(/Search Mentors/i);

    fireEvent.change(searchInput, { target: { value: 'Aarav' } });

    // Only Aarav Sharma should remain visible
    expect(screen.getByRole('heading', { name: 'Aarav Sharma', level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dr. Priya Kulkarni', level: 3 })).not.toBeInTheDocument();

    const resultsCountEl = container.querySelector('.results-count');
    expect(resultsCountEl).toHaveTextContent('Showing 1 of 8 mentors');
  });

  it('searches mentors by technical expertise skill', () => {
    const { container } = render(<App />);
    const searchInput = screen.getByLabelText(/Search Mentors/i);

    fireEvent.change(searchInput, { target: { value: 'Python' } });

    // Both Priya Kulkarni and Tanmay Patil have Python expertise
    expect(screen.getByRole('heading', { name: 'Dr. Priya Kulkarni', level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tanmay Patil', level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Aarav Sharma', level: 3 })).not.toBeInTheDocument();

    const resultsCountEl = container.querySelector('.results-count');
    expect(resultsCountEl).toHaveTextContent('Showing 2 of 8 mentors');
  });

  it('displays the empty state when no mentors match the search query', () => {
    render(<App />);
    const searchInput = screen.getByLabelText(/Search Mentors/i);

    fireEvent.change(searchInput, { target: { value: 'NonExistentSkillXYZ' } });

    expect(screen.getByText(/No matching mentors found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset Search & Filters/i })).toBeInTheDocument();
  });

  it('clears the search query and restores all results when clear button is clicked', () => {
    const { container } = render(<App />);
    const searchInput = screen.getByLabelText(/Search Mentors/i);

    fireEvent.change(searchInput, { target: { value: 'Aarav' } });
    expect(container.querySelector('.results-count')).toHaveTextContent('Showing 1 of 8 mentors');

    const clearButton = screen.getByRole('button', { name: /Clear search query/i });
    fireEvent.click(clearButton);

    expect(searchInput.value).toBe('');
    expect(container.querySelector('.results-count')).toHaveTextContent('Showing 8 of 8 mentors');
  });

  it('explores weekly availability and filters mentor results by a selected time', () => {
    const { container } = render(<App />);

    expect(
      screen.getByRole('heading', { name: /Explore mentor availability/i })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Thursday, 4 PM — 1 mentor available' })
    );

    expect(container.querySelector('.results-count')).toHaveTextContent('Showing 1 of 8 mentors');
    expect(screen.getByRole('heading', { name: 'Aarav Sharma', level: 3 })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Dr. Priya Kulkarni', level: 3 })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Thursday at 4 PM · 1 mentor available');

    fireEvent.click(screen.getByRole('button', { name: 'Clear time' }));
    expect(container.querySelector('.results-count')).toHaveTextContent('Showing 8 of 8 mentors');
  });
});
