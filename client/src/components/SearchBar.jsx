export default function SearchBar({ searchQuery, onSearchChange, onClearSearch }) {
  return (
    <div className="search-bar-container">
      <label htmlFor="mentor-search" className="search-label">
        Search Mentors
      </label>
      <div className="search-input-wrapper">
        <span className="search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <input
          id="mentor-search"
          type="search"
          className="search-input"
          placeholder="Search by name, expertise, or keywords — e.g. React, AI, System Design…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-describedby="search-hint"
          autoComplete="off"
          spellCheck="false"
        />
        {searchQuery && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={onClearSearch}
            aria-label="Clear search query"
            tabIndex={0}
          >
            ✕
          </button>
        )}
      </div>
      <p id="search-hint" className="sr-only">
        Type a name or skill to filter the mentors displayed below in real-time.
      </p>
    </div>
  );
}
