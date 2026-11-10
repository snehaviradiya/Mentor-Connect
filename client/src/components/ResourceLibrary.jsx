import { useState, useMemo } from 'react';
import { MOCK_RESOURCES, RESOURCE_TYPES } from '../data/mockResources.js';
import { MOCK_CATEGORIES } from '../data/mockMentors.js';
import ShareResourceModal from './ShareResourceModal.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ResourceLibrary({ onSelectMentor }) {
  const toast = useToast();

  const [resources, setResources] = useState(MOCK_RESOURCES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All Types');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const stored = localStorage.getItem('mentor_connect_bookmarks');
      return stored ? JSON.parse(stored) : ['res-1', 'res-2', 'res-5'];
    } catch {
      return ['res-1', 'res-2', 'res-5'];
    }
  });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Toggle bookmark handler
  const handleToggleBookmark = (id, title) => {
    setBookmarkedIds((prev) => {
      const isBookmarked = prev.includes(id);
      const updated = isBookmarked ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('mentor_connect_bookmarks', JSON.stringify(updated));
      } catch {
        // storage quota fallback
      }
      if (isBookmarked) {
        toast.info(`"${title}" removed from your saved bookmarks.`, 'Bookmark Removed');
      } else {
        toast.success(`"${title}" saved to your bookmarks!`, 'Bookmark Saved');
      }
      return updated;
    });
  };

  const handleCopyLink = async (url, title) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      }
      toast.success(`Link for "${title}" copied to clipboard!`, 'Link Copied');
    } catch {
      toast.info(`Resource link: ${url}`, 'Resource Link');
    }
  };

  const handleAddResource = (newResource) => {
    setResources((prev) => [newResource, ...prev]);
  };

  // Filtered resources
  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return resources.filter((res) => {
      // 1. Bookmarks filter
      if (onlyBookmarks && !bookmarkedIds.includes(res.id)) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'All' && res.category !== selectedCategory) {
        return false;
      }

      // 3. Type filter
      if (selectedType !== 'All Types' && res.type !== selectedType) {
        return false;
      }

      // 4. Search query
      if (!q) return true;

      const titleMatch = res.title.toLowerCase().includes(q);
      const descMatch = res.description.toLowerCase().includes(q);
      const mentorMatch = res.mentorName.toLowerCase().includes(q);
      const tagMatch = Array.isArray(res.tags)
        ? res.tags.some((t) => t.toLowerCase().includes(q))
        : false;

      return titleMatch || descMatch || mentorMatch || tagMatch;
    });
  }, [resources, searchQuery, selectedCategory, selectedType, onlyBookmarks, bookmarkedIds]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedType('All Types');
    setOnlyBookmarks(false);
    toast.info('All resource filters have been reset.', 'Filters Reset');
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Documentation':
        return '📚';
      case 'Useful Websites':
        return '🌐';
      case 'YouTube Tutorials':
        return '📺';
      case 'PDFs & Study Material':
        return '📄';
      case 'Project References':
        return '💻';
      default:
        return '🔗';
    }
  };

  return (
    <div className="resource-library-view" aria-label="Resource Library">
      {/* 1. Header Hero Banner */}
      <section className="resource-hero">
        <div className="hero-content">
          <div className="hero-tag-row">
            <span className="library-badge">Curated Learning Hub</span>
            <span className="resource-count-pill">
              {resources.length} Mentorship Resources
            </span>
          </div>
          <h1 className="resource-hero-title">
            Mentor Knowledge &amp; Study Library
          </h1>
          <p className="resource-hero-subtitle">
            Essential documentation, video masterclasses, architecture blueprints,
            and research papers curated directly by ADYPU mentors to accelerate your Capstone.
          </p>
        </div>

        <div className="hero-cta-group">
          <button
            type="button"
            className="btn-share-resource"
            onClick={() => setIsShareModalOpen(true)}
            aria-label="Share a new resource"
          >
            + Share Resource
          </button>
        </div>
      </section>

      {/* 2. Search, Filter Controls & Bookmarks */}
      <section className="resource-controls-panel" aria-label="Resource filters and search">
        {/* Search Bar */}
        <div className="resource-search-wrapper">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            className="resource-search-input"
            placeholder="Search by topic, keyword, mentor, or library material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search resources"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Type Filter Pills Row */}
        <div className="resource-type-row" role="tablist" aria-label="Resource types">
          {RESOURCE_TYPES.map((t) => {
            const isActive = selectedType === t;
            return (
              <button
                key={t}
                type="button"
                className={`type-pill ${isActive ? 'type-pill-active' : ''}`}
                onClick={() => setSelectedType(t)}
                aria-pressed={isActive}
              >
                <span className="type-icon">{getTypeIcon(t)}</span>
                <span>{t}</span>
              </button>
            );
          })}
        </div>

        {/* Category Pills & Bookmarks Toggle */}
        <div className="filter-subrow">
          <div className="category-pills-scroll" role="group" aria-label="Domain categories">
            {MOCK_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`category-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={isActive}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Bookmarks Filter Pill */}
          <button
            type="button"
            className={`bookmark-toggle-btn ${onlyBookmarks ? 'bookmark-active' : ''}`}
            onClick={() => setOnlyBookmarks(!onlyBookmarks)}
            aria-pressed={onlyBookmarks}
            aria-label="Filter bookmarked resources"
          >
            <span className="star-icon">{onlyBookmarks ? '★' : '☆'}</span>
            <span>Saved Bookmarks</span>
            <span className="bookmark-counter">{bookmarkedIds.length}</span>
          </button>
        </div>
      </section>

      {/* 3. Results Status Bar */}
      <div className="resource-status-bar" aria-live="polite">
        <span className="results-count-text">
          Showing <strong>{filteredResources.length}</strong> of{' '}
          {resources.length} resources
          {onlyBookmarks && ' (Saved Bookmarks only)'}
        </span>
        {(searchQuery || selectedCategory !== 'All' || selectedType !== 'All Types' || onlyBookmarks) && (
          <button
            type="button"
            className="btn-clear-all-filters"
            onClick={resetAllFilters}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 4. Resources Grid */}
      {filteredResources.length > 0 ? (
        <div className="resources-grid" role="region" aria-label="Resource items">
          {filteredResources.map((res) => {
            const isBookmarked = bookmarkedIds.includes(res.id);
            return (
              <article
                key={res.id}
                className="resource-card"
                aria-labelledby={`res-title-${res.id}`}
              >
                {/* Top Badge Row */}
                <div className="resource-card-top">
                  <div className="type-badge-container">
                    <span className={`resource-type-badge type-${res.type.replace(/[\s&]+/g, '-').toLowerCase()}`}>
                      <span aria-hidden="true">{getTypeIcon(res.type)}</span>
                      {res.type}
                    </span>
                    <span className="resource-category-chip" data-domain={res.category}>
                      {res.category}
                    </span>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    type="button"
                    className={`btn-bookmark-card ${isBookmarked ? 'bookmarked' : ''}`}
                    onClick={() => handleToggleBookmark(res.id, res.title)}
                    aria-label={isBookmarked ? `Remove ${res.title} from bookmarks` : `Bookmark ${res.title}`}
                    title={isBookmarked ? 'Remove bookmark' : 'Bookmark this resource'}
                  >
                    {isBookmarked ? '★' : '☆'}
                  </button>
                </div>

                {/* Title & Description */}
                <h3 id={`res-title-${res.id}`} className="resource-title">
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-link"
                  >
                    {res.title}
                    <span className="external-arrow" aria-hidden="true"> ↗</span>
                  </a>
                </h3>

                <p className="resource-description">{res.description}</p>

                {/* Tags */}
                {res.tags && res.tags.length > 0 && (
                  <div className="resource-tags-row" aria-label="Resource tags">
                    {res.tags.map((tag) => (
                      <span key={tag} className="resource-tag-pill">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Mentor Attribution & Footer */}
                <div className="resource-card-footer">
                  <div className="mentor-attribution">
                    <div
                      className="mentor-avatar-micro"
                      aria-hidden="true"
                      data-domain={res.category}
                    >
                      {res.mentorAvatar || 'MC'}
                    </div>
                    <div className="attribution-meta">
                      <button
                        type="button"
                        className="btn-mentor-name-link"
                        onClick={() => onSelectMentor && onSelectMentor(res.mentorId)}
                        title={`View profile of ${res.mentorName}`}
                      >
                        {res.mentorName}
                      </button>
                      <span className="attribution-sub">{res.fileSizeOrDuration}</span>
                    </div>
                  </div>

                  <div className="card-action-btns">
                    <button
                      type="button"
                      className="btn-copy-resource-link"
                      onClick={() => handleCopyLink(res.url, res.title)}
                      aria-label={`Copy link for ${res.title}`}
                      title="Copy link to clipboard"
                    >
                      🔗
                    </button>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-open-resource"
                    >
                      Open Link ↗
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="empty-resources-panel" role="status">
          <div className="empty-icon" aria-hidden="true">📂</div>
          <h3 className="empty-title">
            {onlyBookmarks ? 'No Bookmarked Resources' : 'No Resources Found'}
          </h3>
          <p className="empty-text">
            {onlyBookmarks
              ? 'You have not saved any bookmarks yet. Click the star (☆) on any resource card to add it to your personal study bookmarks.'
              : 'No learning materials match your current search or category filters. Try expanding your search terms or clearing active filters.'}
          </p>
          <button
            type="button"
            className="btn-reset-empty"
            onClick={resetAllFilters}
          >
            Clear All Filters &amp; Show All Resources
          </button>
        </div>
      )}

      {/* Share Resource Modal Popup */}
      {isShareModalOpen && (
        <ShareResourceModal
          onClose={() => setIsShareModalOpen(false)}
          onAddResource={handleAddResource}
        />
      )}
    </div>
  );
}
