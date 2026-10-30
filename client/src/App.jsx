import { useState, useMemo, useRef } from 'react';
import './App.css';
import { MOCK_MENTORS, MOCK_CATEGORIES } from './data/mockMentors.js';
import Navbar from './components/Navbar.jsx';
import SearchBar from './components/SearchBar.jsx';
import CategoryFilter from './components/CategoryFilter.jsx';
import MentorCard from './components/MentorCard.jsx';
import MentorProfile from './components/MentorProfile.jsx';
import EmptyState from './components/EmptyState.jsx';
import ProjectOverview from './components/ProjectOverview.jsx';

function App() {
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMentorId, setSelectedMentorId] = useState(null);
  const listingsRef = useRef(null);

  // Filter mentors based on search query and selected category
  const filteredMentors = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();

    return MOCK_MENTORS.filter((mentor) => {
      // Category match
      const matchesCategory =
        selectedCategory === 'All' || mentor.category === selectedCategory;

      if (!matchesCategory) return false;

      // Search query match
      if (!trimmed) return true;

      const nameMatch = mentor.name.toLowerCase().includes(trimmed);
      const titleMatch = mentor.title.toLowerCase().includes(trimmed);
      const bioMatch = mentor.bio.toLowerCase().includes(trimmed);
      const expertiseMatch = mentor.expertise.some((skill) =>
        skill.toLowerCase().includes(trimmed)
      );

      return nameMatch || titleMatch || bioMatch || expertiseMatch;
    });
  }, [searchQuery, selectedCategory]);

  const isFiltered = searchQuery.trim() !== '' || selectedCategory !== 'All';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  // Find currently selected mentor (or null if none/invalid)
  const selectedMentor = useMemo(() => {
    if (!selectedMentorId) return null;
    return MOCK_MENTORS.find((m) => m.id === selectedMentorId) || null;
  }, [selectedMentorId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'discover') {
      setSelectedMentorId(null);
    }
  };

  const scrollToMentors = () => {
    listingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="app-container">
      {/* Header and Navigation */}
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="main-content">
        {activeTab === 'discover' ? (
          selectedMentorId ? (
            /* Detailed Mentor Profile View (Milestone 3B) */
            <MentorProfile
              mentor={selectedMentor}
              onBack={() => setSelectedMentorId(null)}
            />
          ) : (
            /* Mentor Discovery Directory View */
            <section className="discovery-section" aria-labelledby="discovery-heading">
              {/* Header intro */}
              <div className="discovery-hero">
                <span className="discovery-badge">Your growth, guided by experts</span>
                <h1 id="discovery-heading" className="discovery-title">
                  Learn from people who&apos;ve already been there.
                </h1>
                <p className="discovery-subtitle">
                  Connect with experienced professionals and academic mentors who can help
                  you turn your ambitions into achievements.
                </p>
                <button
                  type="button"
                  className="hero-cta"
                  onClick={scrollToMentors}
                >
                  Explore Mentors
                </button>
              </div>

              {/* Search and Filters Control Panel */}
              <div className="discovery-controls" ref={listingsRef} id="mentor-listings">
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onClearSearch={() => setSearchQuery('')}
                />

                <CategoryFilter
                  categories={MOCK_CATEGORIES}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
              </div>

              {/* Results count & status bar */}
              <div className="results-status-bar" aria-live="polite">
                <span className="results-count">
                  Showing <strong>{filteredMentors.length}</strong> of{' '}
                  {MOCK_MENTORS.length} mentors
                  {selectedCategory !== 'All' && (
                    <span className="active-filter-badge">
                      Category: {selectedCategory}
                    </span>
                  )}
                  {searchQuery.trim() && (
                    <span className="active-filter-badge">
                      Query: &ldquo;{searchQuery.trim()}&rdquo;
                    </span>
                  )}
                </span>

                {isFiltered && (
                  <button
                    type="button"
                    className="clear-all-filters-btn"
                    onClick={handleResetFilters}
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              {/* Mentor Cards Grid or Empty State */}
              {filteredMentors.length > 0 ? (
                <div
                  className="mentors-grid"
                  role="region"
                  aria-label="Mentor search results"
                >
                  {filteredMentors.map((mentor) => (
                    <MentorCard
                      key={mentor.id}
                      mentor={mentor}
                      onSelectMentor={(id) => setSelectedMentorId(id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  searchQuery={searchQuery}
                  selectedCategory={selectedCategory}
                  onReset={handleResetFilters}
                />
              )}

              {/* Demonstration Notice */}
              <aside className="demo-disclaimer" aria-label="Demo Disclaimer">
                <span className="disclaimer-icon" aria-hidden="true">i</span>
                <p>
                  <strong>Demonstration Fixtures:</strong> Mentors and availability displayed
                  above are sample records for Milestone 3A &amp; 3B frontend testing. Live mentor
                  onboarding and database-backed scheduling will be connected in future milestones.
                </p>
              </aside>
            </section>
          )
        ) : (
          <ProjectOverview />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 Mentor Connect — ADYPU Capstone Mentorship Platform</p>
      </footer>
    </div>
  );
}

export default App;
