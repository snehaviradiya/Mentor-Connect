export default function EmptyState({ searchQuery, selectedCategory, onReset }) {
  return (
    <div className="empty-state-card" role="status" aria-live="polite">
      <div className="empty-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </svg>
      </div>
      <h3 className="empty-title">No mentors found</h3>
      <p className="empty-description">
        We couldn&apos;t find any mentors matching{' '}
        {searchQuery ? <strong className="query-highlight">&ldquo;{searchQuery}&rdquo;</strong> : ''}
        {searchQuery && selectedCategory !== 'All' ? ' in ' : ''}
        {selectedCategory !== 'All' ? <strong>&ldquo;{selectedCategory}&rdquo;</strong> : ''}.
      </p>
      <p className="empty-suggestion">
        Try broadening your search terms, checking your spelling, or clearing filters to see all available mentors.
      </p>
      <button
        type="button"
        className="reset-filters-btn"
        onClick={onReset}
        id="empty-state-reset-btn"
      >
        <span>↺</span> Reset Search &amp; Filters
      </button>
    </div>
  );
}
