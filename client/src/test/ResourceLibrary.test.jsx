import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResourceLibrary from '../components/ResourceLibrary.jsx';
import App from '../App.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';

describe('Resource Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders library hero, search bar, resource types, categories, and resource cards', () => {
    render(
      <ToastProvider>
        <ResourceLibrary onSelectMentor={vi.fn()} />
      </ToastProvider>
    );

    // Hero title
    expect(
      screen.getByRole('heading', { name: /Mentor Knowledge & Study Library/i })
    ).toBeInTheDocument();

    // Search bar
    expect(
      screen.getByPlaceholderText(/Search by topic, keyword, mentor/i)
    ).toBeInTheDocument();

    // Resource types
    expect(screen.getByRole('button', { name: /Documentation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /YouTube Tutorials/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PDFs & Study Material/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Useful Websites/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Project References/i })).toBeInTheDocument();

    // Cards
    expect(
      screen.getByText(/React 19 Architecture Guide & Server Components Deep-Dive/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ADYPU Capstone Engineering Blueprint & System Design Checklist/i)
    ).toBeInTheDocument();
  });

  it('filters resources by type when clicking a type pill', () => {
    render(
      <ToastProvider>
        <ResourceLibrary onSelectMentor={vi.fn()} />
      </ToastProvider>
    );

    const ytButton = screen.getByRole('button', { name: /YouTube Tutorials/i });
    fireEvent.click(ytButton);

    // Should show YouTube items
    expect(
      screen.getByText(/Deep Learning & LLM Agent Pipeline from Scratch/i)
    ).toBeInTheDocument();

    // Should NOT show React 19 documentation
    expect(
      screen.queryByText(/React 19 Architecture Guide & Server Components Deep-Dive/i)
    ).not.toBeInTheDocument();
  });

  it('filters resources by domain category pill', () => {
    render(
      <ToastProvider>
        <ResourceLibrary onSelectMentor={vi.fn()} />
      </ToastProvider>
    );

    const cloudPill = screen.getByRole('button', { name: /^Cloud & DevOps$/i });
    fireEvent.click(cloudPill);

    expect(
      screen.getByText(/Production Kubernetes Cluster & Microservices Reference Repo/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Mobbin: Real-World Mobile & Web UI Patterns/i)
    ).not.toBeInTheDocument();
  });

  it('searches resources by keyword query', () => {
    render(
      <ToastProvider>
        <ResourceLibrary onSelectMentor={vi.fn()} />
      </ToastProvider>
    );

    const searchInput = screen.getByPlaceholderText(/Search by topic, keyword, mentor/i);
    fireEvent.change(searchInput, { target: { value: 'PostgreSQL' } });

    expect(
      screen.getByText(/PostgreSQL High-Performance Indexing & Transaction Concurrency Guide/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Deep Learning & LLM Agent Pipeline from Scratch/i)
    ).not.toBeInTheDocument();
  });

  it('toggles bookmarks and filters by saved bookmarks', () => {
    render(
      <ToastProvider>
        <ResourceLibrary onSelectMentor={vi.fn()} />
      </ToastProvider>
    );

    const bookmarkToggle = screen.getByRole('button', { name: /Filter bookmarked resources/i });
    fireEvent.click(bookmarkToggle);

    // Should only show bookmarked resources
    expect(screen.getByText(/Saved Bookmarks only/i)).toBeInTheDocument();
  });

  it('opens share resource modal and adds new resource to library', async () => {
    render(
      <ToastProvider>
        <ResourceLibrary onSelectMentor={vi.fn()} />
      </ToastProvider>
    );

    const shareBtn = screen.getByRole('button', { name: /Share a new resource/i });
    fireEvent.click(shareBtn);

    expect(screen.getByRole('heading', { name: /Share a Learning Resource/i })).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByLabelText(/Resource Title/i), {
      target: { value: 'Awesome Next.js 15 & Turbopack Masterclass' },
    });
    fireEvent.change(screen.getByLabelText(/Direct Link or Repository URL/i), {
      target: { value: 'https://nextjs.org/learn' },
    });
    fireEvent.change(screen.getByLabelText(/Overview & Learning Objectives/i), {
      target: { value: 'Interactive exercises for mastering server actions and nested layouts.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Add to Resource Library/i }));

    await waitFor(() => {
      expect(screen.getByTestId('toast-success')).toBeInTheDocument();
      expect(
        screen.getAllByText(/Awesome Next.js 15 & Turbopack Masterclass/i).length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it('navigates to Resource Library tab from Navbar in main App', () => {
    render(<App />);

    const resNavBtn = screen.getByRole('button', { name: /^Resource Library$/i });
    expect(resNavBtn).toBeInTheDocument();

    fireEvent.click(resNavBtn);

    expect(
      screen.getByRole('heading', { name: /Mentor Knowledge & Study Library/i })
    ).toBeInTheDocument();
  });
});
