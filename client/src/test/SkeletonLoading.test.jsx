import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App, { AppContent } from '../App.jsx';
import MentorCardSkeleton from '../components/MentorCardSkeleton.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';

describe('Mentor Skeleton Loading', () => {
  it('renders standalone MentorCardSkeleton with expected placeholder layout', () => {
    const { container } = render(<MentorCardSkeleton />);

    expect(screen.getByTestId('mentor-card-skeleton')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-avatar')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-title')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-subtitle')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-bio-group')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-button')).toBeInTheDocument();
  });

  it('renders skeleton cards while mentor data loads instead of a blank screen', () => {
    render(<App initialLoading={true} />);

    // Skeleton grid should be present with aria-busy
    const skeletonGrid = screen.getByTestId('skeleton-grid');
    expect(skeletonGrid).toBeInTheDocument();
    expect(skeletonGrid).toHaveAttribute('aria-busy', 'true');

    // 6 skeleton placeholder cards should be rendered
    const skeletons = screen.getAllByTestId('mentor-card-skeleton');
    expect(skeletons.length).toBe(6);

    // Results bar should indicate loading
    expect(screen.getByText(/Loading mentors\.\.\./i)).toBeInTheDocument();
  });

  it('transitions from skeleton cards to mentor cards once data loading resolves', async () => {
    render(<App initialLoading={true} />);

    // Initially skeletons are visible
    expect(screen.getByTestId('skeleton-grid')).toBeInTheDocument();

    // After loading resolves, mentor cards appear
    await waitFor(
      () => {
        expect(screen.queryByTestId('skeleton-grid')).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Aarav Sharma', level: 3 })).toBeInTheDocument();
      },
      { timeout: 2500 }
    );
  });
});

