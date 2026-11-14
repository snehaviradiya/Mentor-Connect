const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const HOURS = Array.from({ length: 11 }, (_, index) => index + 9);
const DAY_INDEXES = [1, 2, 3, 4, 5, 6, 0];

function formatHour(hour) {
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${hour < 12 ? 'AM' : 'PM'}`;
}

function isAvailable(mentor, day, hour) {
  const dayIndex = DAY_INDEXES[DAYS.indexOf(day)];
  const slotStart = hour * 60;
  return (mentor.availabilities || []).some((slot) => {
    if (!slot.isBookable || slot.specificDate) return false;
    if (slot.dayOfWeek !== null && slot.dayOfWeek !== undefined && slot.dayOfWeek !== dayIndex) return false;
    const times = slot.slotLabel.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
    if (!times) return false;
    const toMinutes = (hourValue, minuteValue, meridiem) =>
      (Number(hourValue) % 12 + (meridiem.toUpperCase() === 'PM' ? 12 : 0)) * 60 + Number(minuteValue || 0);
    const start = toMinutes(times[1], times[2], times[3]);
    const end = toMinutes(times[4], times[5], times[6]);
    return slotStart < end && slotStart + 60 > start;
  });
}

export default function AvailabilityExplorer({
  mentors,
  selectedSlot,
  onSelectSlot,
  onClearSlot,
  onShowMentors,
}) {
  return (
    <section className="availability-explorer" aria-labelledby="availability-heading">
      <div className="availability-explorer-header">
        <div>
          <span className="availability-explorer-eyebrow">PLAN YOUR NEXT SESSION</span>
          <h2 id="availability-heading">Explore mentor availability</h2>
          <p>Pick a time to see mentors with matching bookable schedule slots.</p>
        </div>
        <span className="availability-demo-label">Live weekly availability · IST</span>
      </div>

      <div className="availability-grid-scroll">
        <div className="availability-grid" role="grid" aria-label="Weekly mentor availability in IST">
          <div className="availability-grid-corner" role="columnheader">IST</div>
          {DAYS.map((day) => (
            <div className="availability-day-heading" role="columnheader" key={day}>
              {day.slice(0, 3)}
            </div>
          ))}
          {HOURS.map((hour) => (
            <div className="availability-grid-row" role="row" key={hour}>
              <div className="availability-time-heading" role="rowheader">
                {formatHour(hour)}
              </div>
              {DAYS.map((day) => {
                const availableMentors = mentors.filter((mentor) =>
                  isAvailable(mentor, day, hour)
                );
                const count = availableMentors.length;
                const isSelected = selectedSlot?.day === day && selectedSlot?.hour === hour;
                const label = `${day}, ${formatHour(hour)} — ${count} ${
                  count === 1 ? 'mentor' : 'mentors'
                } available`;

                return (
                  <div className="availability-grid-cell" role="gridcell" key={day}>
                    <button
                      type="button"
                      className={`availability-cell${count ? ` availability-cell-level-${Math.min(count, 3)}` : ''}${isSelected ? ' is-selected' : ''}`}
                      onClick={() =>
                        isSelected
                          ? onClearSlot()
                          : onSelectSlot({ day, hour, mentors: availableMentors })
                      }
                      disabled={count === 0}
                      aria-label={label}
                      aria-pressed={isSelected}
                      title={label}
                    >
                      {count || ''}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="availability-explorer-footer">
        <div className="availability-legend" aria-label="Availability legend">
          <span>Fewer mentors</span>
          <span className="availability-legend-swatch availability-cell-level-1" aria-hidden="true" />
          <span className="availability-legend-swatch availability-cell-level-2" aria-hidden="true" />
          <span className="availability-legend-swatch availability-cell-level-3" aria-hidden="true" />
          <span>More mentors</span>
        </div>
        <p>Counts use each mentor&apos;s configured bookable availability.</p>
      </div>

      {selectedSlot && (
        <div className="availability-selection" role="status">
          <span>
            <strong>{selectedSlot.day} at {formatHour(selectedSlot.hour)}</strong>
            {' · '}{selectedSlot.mentors.length}{' '}
            {selectedSlot.mentors.length === 1 ? 'mentor' : 'mentors'} available
          </span>
          <button type="button" onClick={onShowMentors}>Show mentors ↓</button>
          <button
            type="button"
            className="availability-clear-button"
            onClick={onClearSlot}
          >
            Clear time
          </button>
        </div>
      )}
    </section>
  );
}
