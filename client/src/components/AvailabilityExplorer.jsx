import { useEffect, useState } from 'react';
import { fetchMentorAvailability } from '../services/api.js';

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AvailabilityExplorer({
  mentors,
  selectedSlot,
  onSelectSlot,
  onClearSlot,
  onShowMentors,
}) {
  const [date, setDate] = useState(localDateString);
  const [availabilityState, setAvailabilityState] = useState({ key: null, status: 'idle', data: [] });
  const [retry, setRetry] = useState(0);
  const requestKey = date && mentors.length
    ? `${date}|${mentors.map((mentor) => mentor.id).join(',')}|${retry}`
    : null;

  useEffect(() => {
    if (!requestKey) return undefined;
    const controller = new AbortController();
    let current = true;
    Promise.all(mentors.map(async (mentor) => {
      const response = await fetchMentorAvailability(mentor.id, date, { signal: controller.signal });
      const slots = response?.data?.slots;
      if (!Array.isArray(slots)) throw new Error('Unexpected availability response format.');
      return { mentor, slots };
    }))
      .then((results) => {
        if (current) setAvailabilityState({ key: requestKey, status: 'success', data: results });
      })
      .catch((fetchError) => {
        if (!current || fetchError.name === 'AbortError') return;
        setAvailabilityState({
          key: requestKey,
          status: 'error',
          error: fetchError.message || 'Unable to load live availability. Please retry.',
          data: [],
        });
      });
    return () => {
      current = false;
      controller.abort();
    };
  }, [mentors, date, retry, requestKey]);

  const isLoading = Boolean(requestKey && availabilityState.key !== requestKey);
  const error = availabilityState.key === requestKey && availabilityState.status === 'error'
    ? availabilityState.error
    : null;
  const availability = availabilityState.key === requestKey && availabilityState.status === 'success'
    ? availabilityState.data
    : [];

  const slotGroups = new Map();
  availability.forEach(({ mentor, slots }) => {
    slots.filter((slot) => slot.isBookable).forEach((slot) => {
      const group = slotGroups.get(slot.label) || [];
      group.push(mentor);
      slotGroups.set(slot.label, group);
    });
  });

  return (
    <section className="availability-explorer" aria-labelledby="availability-heading">
      <div className="availability-explorer-header">
        <div>
          <span className="availability-explorer-eyebrow">PLAN YOUR NEXT SESSION</span>
          <h2 id="availability-heading">Explore mentor availability</h2>
          <p>Choose a date to see bookable time slots returned by the scheduling service.</p>
        </div>
        <label className="availability-date-control" htmlFor="availability-date">
          <span>Date · IST slots</span>
          <input
            id="availability-date"
            type="date"
            min={localDateString()}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              onClearSlot();
            }}
          />
        </label>
      </div>

      {isLoading ? (
        <p className="availability-feedback" role="status" aria-busy="true">Loading live availability…</p>
      ) : error ? (
        <div className="availability-feedback availability-feedback-error" role="alert">
          <span>{error}</span>{' '}
          <button type="button" onClick={() => setRetry((attempt) => attempt + 1)}>Retry</button>
        </div>
      ) : slotGroups.size === 0 ? (
        <p className="availability-feedback" role="status">
          {mentors.length === 0 ? 'No mentors match the current filters.' : 'No bookable slots are available for this date.'}
        </p>
      ) : (
        <div className="availability-live-list" aria-label={`Available mentor slots for ${date}`}>
          {[...slotGroups.entries()].map(([label, availableMentors]) => {
            const isSelected = selectedSlot?.date === date && selectedSlot?.label === label;
            const buttonLabel = `${label} · ${availableMentors.length} ${availableMentors.length === 1 ? 'mentor' : 'mentors'} available`;
            return (
              <button
                type="button"
                key={label}
                className={`availability-live-slot${isSelected ? ' is-selected' : ''}`}
                aria-label={buttonLabel}
                aria-pressed={isSelected}
                onClick={() => isSelected
                  ? onClearSlot()
                  : onSelectSlot({ date, label, mentors: availableMentors })}
              >
                <span>{label}</span>
                <span>{buttonLabel.split('· ')[1]}</span>
              </button>
            );
          })}
        </div>
      )}

      {selectedSlot && (
        <div className="availability-selection" role="status">
          <span>
            <strong>{selectedSlot.date} · {selectedSlot.label}</strong>
            {' · '}{selectedSlot.mentors.length}{' '}
            {selectedSlot.mentors.length === 1 ? 'mentor' : 'mentors'} available
          </span>
          <button type="button" onClick={onShowMentors}>Show mentors ↓</button>
          <button type="button" className="availability-clear-button" onClick={onClearSlot}>Clear time</button>
        </div>
      )}
    </section>
  );
}
