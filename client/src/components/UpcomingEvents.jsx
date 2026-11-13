import { UPCOMING_EVENTS } from '../data/mockEvents.js';

const EVENT_TYPE_ICONS = {
  Webinar: '◉',
  Workshop: '⚒',
  Mentoring: '✦',
};

function formatEventDate(date) {
  const parsedDate = new Date(`${date}T00:00:00`);
  return {
    month: new Intl.DateTimeFormat('en', { month: 'short' }).format(parsedDate),
    day: new Intl.DateTimeFormat('en', { day: '2-digit' }).format(parsedDate),
    full: new Intl.DateTimeFormat('en', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(parsedDate),
  };
}

export default function UpcomingEvents() {
  return (
    <section className="dashboard-panel upcoming-events-panel" aria-labelledby="upcoming-events-heading">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-icon" aria-hidden="true">📣</span>
          <h2 id="upcoming-events-heading" className="panel-title">Upcoming Events</h2>
        </div>
        <span className="badge-count">{UPCOMING_EVENTS.length} Events</span>
      </div>
      <p className="panel-caption">
        Webinars, hands-on workshops, and mentoring sessions to keep your projects moving.
      </p>

      <div className="upcoming-events-list">
        {UPCOMING_EVENTS.map((event) => {
          const date = formatEventDate(event.date);
          const typeClass = event.type.toLowerCase();
          return (
            <article className={`event-card event-card-${typeClass}`} key={event.id}>
              <div className="event-date-tile" aria-label={date.full}>
                <span>{date.month}</span>
                <strong>{date.day}</strong>
              </div>
              <div className="event-card-content">
                <div className="event-card-heading">
                  <span className={`event-type-badge event-type-${typeClass}`}>
                    <span aria-hidden="true">{EVENT_TYPE_ICONS[event.type]}</span>
                    {event.type}
                  </span>
                  <span className="event-format">{event.format}</span>
                </div>
                <h3>{event.title}</h3>
                <p className="event-description">{event.description}</p>
                <div className="event-details">
                  <span><span aria-hidden="true">◷</span> {date.full} · {event.time}</span>
                  <span><span aria-hidden="true">♙</span> Hosted by {event.host}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <p className="events-demo-note">Illustrative event listings · All times shown in IST</p>
    </section>
  );
}
