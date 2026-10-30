import { useState, useEffect } from 'react';

export default function Navbar({ activeTab, onTabChange }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`app-header${isScrolled ? ' scrolled' : ''}`}>
      <div className="header-inner">
        {/* Brand */}
        <div className="header-brand" role="banner">
          <div className="brand-logo" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 14.5V3.5L9 8.2L15 3.5V14.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-title">Mentor Connect</span>
            <span className="brand-subtitle">ADYPU Capstone Platform</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="header-nav" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-link${activeTab === 'discover' ? ' active' : ''}`}
            onClick={() => onTabChange('discover')}
            aria-current={activeTab === 'discover' ? 'page' : undefined}
            id="nav-discover"
          >
            Discover Mentors
          </button>
          <button
            type="button"
            className={`nav-link${activeTab === 'about' ? ' active' : ''}`}
            onClick={() => onTabChange('about')}
            aria-current={activeTab === 'about' ? 'page' : undefined}
            id="nav-overview"
          >
            Project Overview
          </button>
        </nav>

        {/* Status indicator */}
        <div className="header-status">
          <span className="status-badge" aria-label="Milestone 3C – Booking demo active">
            Milestone 3C · Booking
          </span>
        </div>
      </div>
    </header>
  );
}
