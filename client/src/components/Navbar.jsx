import { useState, useEffect } from 'react';

export default function Navbar({ activeTab, onTabChange }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabChange = (tab) => {
    onTabChange(tab);
    setIsMobileNavOpen(false);
  };

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

        <button
          type="button"
          className="mobile-nav-toggle"
          aria-label={isMobileNavOpen ? 'Close main navigation' : 'Open main navigation'}
          aria-expanded={isMobileNavOpen}
          aria-controls="main-navigation"
          onClick={() => setIsMobileNavOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {isMobileNavOpen ? (
              <path d="m6 6 12 12M18 6 6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
          <span>{isMobileNavOpen ? 'Close' : 'Menu'}</span>
        </button>

        {/* Navigation */}
        <nav
          className={`header-nav${isMobileNavOpen ? ' is-open' : ''}`}
          aria-label="Main Navigation"
          id="main-navigation"
        >
          <button
            type="button"
            className={`nav-link${activeTab === 'discover' ? ' active' : ''}`}
            onClick={() => handleTabChange('discover')}
            aria-current={activeTab === 'discover' ? 'page' : undefined}
            id="nav-discover"
          >
            Discover Mentors
          </button>
          <button
            type="button"
            className={`nav-link${activeTab === 'dashboard' ? ' active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
            aria-current={activeTab === 'dashboard' ? 'page' : undefined}
            id="nav-dashboard"
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`nav-link${activeTab === 'resources' ? ' active' : ''}`}
            onClick={() => handleTabChange('resources')}
            aria-current={activeTab === 'resources' ? 'page' : undefined}
            id="nav-resources"
          >
            Resource Library
          </button>
          <button
            type="button"
            className={`nav-link${activeTab === 'about' ? ' active' : ''}`}
            onClick={() => handleTabChange('about')}
            aria-current={activeTab === 'about' ? 'page' : undefined}
            id="nav-overview"
          >
            Project Overview
          </button>
        </nav>

        {/* Status indicator */}
        <div className="header-status">
          <span className="status-badge">
            ADYPU Capstone
          </span>
        </div>
      </div>
    </header>
  );
}
