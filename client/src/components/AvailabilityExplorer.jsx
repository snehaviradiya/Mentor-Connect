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

function toMinutes(hour, minute, meridiem) {
  const normalizedHour = hour % 12 + (meridiem === 'PM' ? 12 : 0);
  return normalizedHour * 60 + minute;
}

function getAvailability(mentor) {
  const schedule = mentor.sampleAvailability || '';
  const daysText = schedule.split(',')[0] || '';
  const days = new Set(
    daysText
      .split(/\s*(?:&|and)\s*/i)
      .map((day) => day.trim().replace(/s$/i, '').toLowerCase())
  );
  const times = [...schedule.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi)];
  if (times.length < 2) return null;

  const start = toMinutes(Number(times[0][1]), Number(times[0][2] || 0), times[0][3].toUpperCase());
  const end = toMinutes(Number(times[1][1]), Number(times[1][2] || 0), times[1][3].toUpperCase());
  if (end <= start) return null;

  return { days, start, end };
}

function formatHour(hour) {
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${hour < 12 ? 'AM' : 'PM'}`;
}

function isAvailable(mentor, day, hour) {
  const availability = getAvailability(mentor);
  if (!availability || !availability.days.has(day.toLowerCase())) return false;
  const slotStart = hour * 60;
  return slotStart < availability.end && slotStart + 60 > availability.start;
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
          <p>Pick a time to see mentors available that day, before opening their profiles.</p>
        </div>
        <span className="availability-demo-label">Illustrative schedule · IST</span>
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
        <p>Counts show mentors with an illustrative demo slot during that hour.</p>
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
