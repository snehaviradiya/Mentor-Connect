import { useState, useMemo, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import './App.css';
import { MOCK_MENTORS } from './data/mockMentors.js';
import Navbar from './components/Navbar.jsx';
import CategoryFilter from './components/CategoryFilter.jsx';
import MentorCard from './components/MentorCard.jsx';
import MentorCardSkeleton from './components/MentorCardSkeleton.jsx';
import MentorProfile from './components/MentorProfile.jsx';
import EmptyState from './components/EmptyState.jsx';
import ProjectOverview from './components/ProjectOverview.jsx';
import StudentDashboard from './components/StudentDashboard.jsx';
import ResourceLibrary from './components/ResourceLibrary.jsx';
import SessionWorkspace from './components/SessionWorkspace.jsx';
import AvailabilityExplorer from './components/AvailabilityExplorer.jsx';
import MentorshipHome from './components/MentorshipHome.jsx';
import RegistrationModal from './components/RegistrationModal.jsx';
import BookingModal from './components/BookingModal.jsx';
import { ToastProvider, useToast } from './context/ToastContext.jsx';
import { fetchMentors } from './services/api.js';

const VRMentorshipRoom = lazy(() => import('./components/vr/VRMentorshipRoom.jsx'));

export function AppContent({ initialLoading = null, initialMentors = import.meta.env.MODE === 'test' ? MOCK_MENTORS : [] }) {
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMentorId, setSelectedMentorId] = useState(null);
  const [quickBookingMentor, setQuickBookingMentor] = useState(null);
  const [workspaceSession, setWorkspaceSession] = useState(null);
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const [mentors, setMentors] = useState(initialMentors);
  const [mentorsError, setMentorsError] = useState(null);
  const listingsRef = useRef(null);
  const toast = useToast();

  const shouldFetchMentors = import.meta.env.MODE !== 'test' || initialLoading === true;

  // In browsers, start with skeletons while loading. Tests can explicitly control this state.
  const [isLoading, setIsLoading] = useState(() => {
    if (initialLoading !== null) {
      return Boolean(initialLoading);
    }
    return shouldFetchMentors;
  });

  // Fetch the live directory once on mount; filters operate on this local result set.
  useEffect(() => {
    if (!shouldFetchMentors) return undefined;
    let isMounted = true;
    fetchMentors()
      .then((res) => {
        if (!isMounted) return;
        if (!Array.isArray(res?.data?.mentors)) throw new Error('Unexpected mentor directory response.');
        setMentors(res.data.mentors);
        setMentorsError(null);
      })
      .catch((err) => {
        if (isMounted) setMentorsError(err.message || 'Unable to load mentors. Please retry.');
      })
      .finally(() => {
        if (isMounted) {
          setTimeout(() => {
            if (isMounted) setIsLoading(false);
          }, 300);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [shouldFetchMentors]);

  // Update a mentor profile (e.g. from EditProfileModal)
  const handleUpdateMentor = useCallback((updatedMentor) => {
    setMentors((prevMentors) =>
      prevMentors.map((m) => (m.id === updatedMentor.id ? updatedMentor : m))
    );
  }, []);

  // Add a verified review to a mentor
  const handleAddReview = useCallback((mentorId, newReview) => {
    setMentors((prevMentors) =>
      prevMentors.map((m) => {
        if (m.id !== mentorId) return m;
        const currentReviews = m.reviews || [];
        const updatedReviews = [newReview, ...currentReviews];
        const avg = (
          updatedReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) /
          updatedReviews.length
        ).toFixed(1);
        return {
          ...m,
          reviews: updatedReviews,
          rating: Number(avg),
          reviewCount: updatedReviews.length,
        };
      })
    );
  }, []);

  // Filter mentors based on search query and selected category
  const filteredMentors = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();

    return mentors.filter((mentor) => {
      // Category match
      const matchesCategory =
        selectedCategory === 'All' || mentor.category === selectedCategory;

      if (!matchesCategory) return false;

      // Search query match
      if (!trimmed) return true;

      const nameMatch = mentor.name?.toLowerCase().includes(trimmed) || false;
      const titleMatch = mentor.title?.toLowerCase().includes(trimmed) || false;
      const bioMatch = mentor.bio?.toLowerCase().includes(trimmed) || false;
      const categoryMatch = mentor.category?.toLowerCase().includes(trimmed) || false;
      const experienceMatch = mentor.experience?.toLowerCase().includes(trimmed) || false;
      const educationMatch = mentor.education?.toLowerCase().includes(trimmed) || false;
      const expertiseMatch = Array.isArray(mentor.expertise)
        ? mentor.expertise.some((skill) => skill?.toLowerCase().includes(trimmed))
        : false;
      const topicMatch = Array.isArray(mentor.mentoringTopics)
        ? mentor.mentoringTopics.some((topic) => topic?.toLowerCase().includes(trimmed))
        : false;

      return nameMatch || titleMatch || bioMatch || categoryMatch || experienceMatch || educationMatch || expertiseMatch || topicMatch;
    });
  }, [mentors, searchQuery, selectedCategory]);

  const mentorCategories = useMemo(() => [
    'All',
    ...new Set(
      mentors
        .map((mentor) => mentor.category?.trim())
        .filter((category) => category && category !== 'All')
        .sort((a, b) => a.localeCompare(b))
    ),
  ], [mentors]);

  const availabilityMentors = filteredMentors;
  const visibleMentors = selectedAvailability
    ? availabilityMentors.filter((mentor) =>
        selectedAvailability.mentors.some((availableMentor) => availableMentor.id === mentor.id)
      )
    : availabilityMentors;
  const isFiltered = searchQuery.trim() !== '' || selectedCategory !== 'All' || selectedAvailability;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedAvailability(null);
    toast.info('Search & domain filters reset. Showing all available mentors.', 'Filters Cleared');
  };

  const handleRefreshMentors = async () => {
    setIsLoading(true);
    try {
      const res = await fetchMentors();
      if (!Array.isArray(res?.data?.mentors)) throw new Error('Unexpected mentor directory response.');
      setMentors(res.data.mentors);
      setMentorsError(null);
      toast.info('Mentor directory refreshed with the latest data.', 'Refreshed');
    } catch (error) {
      setMentorsError(error.message || 'Unable to refresh mentors. Please retry.');
      toast.error('The mentor directory could not be refreshed.', 'Refresh Failed');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 350);
    }
  };

  // Find currently selected mentor (or null if none/invalid)
  const selectedMentor = useMemo(() => {
    if (!selectedMentorId) return null;
    return mentors.find((m) => m.id === selectedMentorId) || null;
  }, [mentors, selectedMentorId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'vr-room') {
      setSelectedMentorId(null);
    }
    setQuickBookingMentor(null);
    setWorkspaceSession(null);
  };

  const scrollToMentors = () => {
    listingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="app-container">
      {/* Header and Navigation */}
      <Navbar
        activeTab={activeTab === 'workspace' ? 'dashboard' : activeTab}
        onTabChange={handleTabChange}
      />

      <main className="main-content">
        {activeTab === 'discover' ? (
          selectedMentorId ? (
            /* Detailed Mentor Profile View (Milestone 3B) */
            <MentorProfile
              mentor={selectedMentor}
              onBack={() => setSelectedMentorId(null)}
              onUpdateMentor={handleUpdateMentor}
              onBookingSuccess={() => setDashboardRefreshKey((key) => key + 1)}
              onEnterVR={() => setActiveTab('vr-room')}
            />
          ) : (
            /* Mentor Discovery Directory View */
            <section className="discovery-section" aria-labelledby="journey-heading">
              {/* Header intro */}
              <MentorshipHome
                mentors={filteredMentors}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClearSearch={() => setSearchQuery('')}
                onSelectMentor={setSelectedMentorId}
                onBrowseMentors={scrollToMentors}
                mentorCount={mentors.length}
                specializationCount={mentorCategories.length - 1}
                onOpenSignup={() => setIsRegistrationOpen(true)}
              />

              {/* Search and Filters Control Panel */}
              <div className="discovery-controls" ref={listingsRef} id="mentor-listings">
                <CategoryFilter
                  categories={mentorCategories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
              </div>

              {/* Results count & status bar */}
              <div className="results-status-bar" aria-live="polite">
                <span className="results-count">
                  {isLoading ? (
                    'Loading mentors...'
                  ) : (
                    <>
                      Showing <strong>{visibleMentors.length}</strong> of{' '}
                      {mentors.length} mentors
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
                      {selectedAvailability && (
                        <span className="active-filter-badge">
                          Time: {selectedAvailability.day} at{' '}
                          {selectedAvailability.hour % 12 || 12}{' '}
                          {selectedAvailability.hour < 12 ? 'AM' : 'PM'}
                        </span>
                      )}
                    </>
                  )}
                </span>

                <div className="results-bar-actions">
                  <button
                    type="button"
                    className="refresh-mentors-btn"
                    onClick={handleRefreshMentors}
                    disabled={isLoading}
                    title="Reload mentors data"
                    aria-label="Refresh mentors list"
                  >
                    <span className={isLoading ? 'spinning-icon' : ''} aria-hidden="true">↺</span>{' '}
                    {isLoading ? 'Loading...' : 'Refresh'}
                  </button>

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
              </div>

              <AvailabilityExplorer
                mentors={mentors}
                selectedSlot={selectedAvailability}
                onSelectSlot={setSelectedAvailability}
                onClearSlot={() => setSelectedAvailability(null)}
                onShowMentors={() => listingsRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })}
              />

              {mentorsError && !isLoading && (
                <div className="directory-error" role="alert">
                  <span>{mentorsError}</span>
                  <button type="button" onClick={handleRefreshMentors}>Retry</button>
                </div>
              )}

              {/* Mentor Cards Grid, Skeleton Cards while loading, or Empty State */}
              {isLoading ? (
                /* Skeleton cards while mentor data loads instead of a blank screen */
                <div
                  className="mentors-grid mentors-grid-loading"
                  role="status"
                  aria-label="Loading mentors..."
                  aria-busy="true"
                  data-testid="skeleton-grid"
                >
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <MentorCardSkeleton key={`skeleton-${idx}`} />
                  ))}
                </div>
              ) : visibleMentors.length > 0 ? (
                <div
                  className="mentors-grid"
                  role="region"
                  aria-label="Mentor search results"
                >
                  {visibleMentors.map((mentor) => (
                    <MentorCard
                      key={mentor.id}
                      mentor={mentor}
                      onSelectMentor={(id) => setSelectedMentorId(id)}
                    />
                  ))}
                </div>
              ) : mentorsError && mentors.length === 0 ? null : mentors.length === 0 && !isFiltered ? (
                <div className="empty-state-card" role="status">
                  <h2 className="empty-title">No mentors available yet</h2>
                  <p className="empty-description">Please check back later for new mentor profiles.</p>
                </div>
              ) : (
                <EmptyState
                  searchQuery={searchQuery}
                  selectedCategory={selectedCategory}
                  onReset={handleResetFilters}
                />
              )}

            </section>
          )
        ) : activeTab === 'dashboard' ? (
          <StudentDashboard
            mentors={mentors}
            refreshKey={dashboardRefreshKey}
            onOpenSignup={() => setIsRegistrationOpen(true)}
            onOpenWorkspace={(session) => {
              setWorkspaceSession(session);
              setActiveTab('workspace');
            }}
            onSelectMentor={(id) => {
              setSelectedMentorId(id);
              setActiveTab('discover');
            }}
            onQuickBookMentor={(mentor) => {
              setQuickBookingMentor(mentor);
            }}
            onAddReview={handleAddReview}
          />
        ) : activeTab === 'workspace' && workspaceSession ? (
          <SessionWorkspace
            key={workspaceSession.id}
            session={workspaceSession}
            onBack={() => {
              setWorkspaceSession(null);
              setActiveTab('dashboard');
            }}
          />
        ) : activeTab === 'vr-room' ? (
          <Suspense
            fallback={
              <div className="vr-loading-container" role="status" aria-live="polite">
                <div className="vr-loading-spinner" />
                <p className="vr-loading-text">Loading 3D Mentorship Environment...</p>
              </div>
            }
          >
            <VRMentorshipRoom
              mentor={selectedMentor}
              onExit={() => handleTabChange('discover')}
            />
          </Suspense>
        ) : activeTab === 'resources' ? (
          <ResourceLibrary
            onSelectMentor={(id) => {
              setSelectedMentorId(id);
              setActiveTab('discover');
            }}
          />
        ) : (
          <ProjectOverview />
        )}
      </main>

      {/* Quick Booking Modal if initiated from dashboard */}
      {quickBookingMentor && (
        <BookingModal
          mentor={quickBookingMentor}
          onClose={() => setQuickBookingMentor(null)}
          onBookingSuccess={() => setDashboardRefreshKey((key) => key + 1)}
        />
      )}
      {isRegistrationOpen && (
        <RegistrationModal onClose={() => {
          setIsRegistrationOpen(false);
          setDashboardRefreshKey((key) => key + 1);
        }} />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 Mentor Connect — ADYPU Capstone Mentorship Platform</p>
      </footer>
    </div>
  );
}

export default function App(props) {
  return (
    <ToastProvider>
      <AppContent {...props} />
    </ToastProvider>
  );
}
