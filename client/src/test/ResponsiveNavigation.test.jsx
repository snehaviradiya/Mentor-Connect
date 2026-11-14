import { fireEvent, render, screen } from '@testing-library/react';
import Navbar from '../components/Navbar.jsx';

describe('responsive navigation', () => {
  it('opens and closes the mobile menu when a destination is chosen', () => {
    const onTabChange = vi.fn();
    render(<Navbar activeTab="discover" onTabChange={onTabChange} />);

    const toggle = screen.getByRole('button', { name: 'Open main navigation' });
    const navigation = screen.getByRole('navigation', { name: 'Main Navigation' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(navigation).not.toHaveClass('is-open');

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Close main navigation' }))
      .toHaveAttribute('aria-expanded', 'true');
    expect(navigation).toHaveClass('is-open');

    fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(onTabChange).toHaveBeenCalledWith('dashboard');
    expect(navigation).not.toHaveClass('is-open');
    expect(screen.getByRole('button', { name: 'Open main navigation' }))
      .toHaveAttribute('aria-expanded', 'false');
  });
});
