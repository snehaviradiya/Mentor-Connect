import { useCallback, useEffect, useState } from 'react';
import {
  cancelBooking,
  fetchMentorDashboard,
  rescheduleBooking,
  updateMentorAvailability,
} from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDate(value) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

function getLocalDateInputValue() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function MentorDashboard({ onOpenLogin }) {
  const toast = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [slotLabel, setSlotLabel] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [specificDate, setSpecificDate] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [today] = useState(getLocalDateInputValue);

  const loadDashboard = useCallback(async () => {
    const token = window.sessionStorage.getItem('mentor_connect_token');
    if (!token) {
      setError('Sign in with a mentor account to manage your sessions and availability.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetchMentorDashboard(token);
      setDashboard(response?.data?.mentor || null);
      if (!response?.data?.mentor) throw new Error('The mentor dashboard response was incomplete.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to load your mentor dashboard.');
      if ([401, 403].includes(requestError.status)) {
        window.sessionStorage.removeItem('mentor_connect_token');
        window.sessionStorage.removeItem('mentor_connect_user');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard, refreshKey]);

  const handleCancel = async (bookingId) => {
    const token = window.sessionStorage.getItem('mentor_connect_token');
    try {
      await cancelBooking(bookingId, token);
      toast.success('The booking was cancelled and its slot released.', 'Booking Cancelled');
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      toast.error(requestError.message || 'Unable to cancel this booking.', 'Cancellation Failed');
    }
  };

  const handleReschedule = async (event, booking) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const token = window.sessionStorage.getItem('mentor_connect_token');
    try {
      await rescheduleBooking(booking.bookingId, {
        sessionDate: formData.get('sessionDate'),
        timeSlot: formData.get('timeSlot'),
      }, token);
      toast.success('The booking was rescheduled.', 'Booking Updated');
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      toast.error(requestError.message || 'Unable to reschedule this booking.', 'Reschedule Failed');
    }
  };

  const handleAddAvailability = async (event) => {
    event.preventDefault();
    const token = window.sessionStorage.getItem('mentor_connect_token');
    const existing = dashboard?.availabilitySummary?.slots || [];
    const nextSlot = {
      slotLabel: slotLabel.trim(),
      ...(specificDate ? { specificDate } : { dayOfWeek: Number(dayOfWeek) }),
    };
    setSavingAvailability(true);
    try {
      await updateMentorAvailability(dashboard.profile.id, [
        ...existing.map((slot) => ({
          slotLabel: slot.label,
          ...(slot.specificDate ? { specificDate: slot.specificDate } : {}),
          ...(slot.dayOfWeek !== null ? { dayOfWeek: slot.dayOfWeek } : {}),
          isBookable: slot.isBookable,
        })),
        nextSlot,
      ], token);
      setSlotLabel('');
      setSpecificDate('');
      toast.success('Your availability was saved.', 'Availability Updated');
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      toast.error(requestError.message || 'Unable to save availability.', 'Update Failed');
    } finally {
      setSavingAvailability(false);
    }
  };

  if (loading) return <main className="student-dashboard" aria-busy="true"><p role="status">Loading your mentor dashboard…</p></main>;
  if (error) {
    return (
      <main className="student-dashboard mentor-dashboard">
        <section className="dashboard-panel" aria-labelledby="mentor-dashboard-heading">
          <h1 id="mentor-dashboard-heading">Mentor Dashboard</h1>
          <p role="alert">{error}</p>
          {onOpenLogin && <button type="button" className="btn-primary" onClick={onOpenLogin}>Sign in</button>}
          <button type="button" className="btn-secondary" onClick={() => setRefreshKey((key) => key + 1)}>Try again</button>
        </section>
      </main>
    );
  }

  const upcoming = dashboard?.upcomingAppointments || [];
  const past = dashboard?.pastAppointments || [];
  const cancelled = dashboard?.cancelledAppointments || [];

  return (
    <main className="student-dashboard mentor-dashboard" aria-label="Mentor dashboard">
      <section className="dashboard-hero">
        <div className="welcome-meta">
          <span className="welcome-tag">Mentor Portal</span>
          <h1 id="mentor-dashboard-heading" className="welcome-heading">Welcome, {dashboard.profile.name}</h1>
          <p className="welcome-subtext">{dashboard.profile.title} · {dashboard.profile.category}</p>
        </div>
      </section>

      <section className="dashboard-panel" aria-labelledby="mentor-appointments-heading">
        <div className="panel-header">
          <h2 className="panel-title" id="mentor-appointments-heading">Upcoming sessions ({upcoming.length})</h2>
        </div>
        {upcoming.length ? upcoming.map((booking) => (
          <article className="session-card session-board-card" key={booking.bookingId}>
            <h3>{booking.sessionTopic}</h3>
            <p>Student: <strong>{booking.student.name}</strong> · {booking.student.email}</p>
            <p>{formatDate(booking.sessionDate)} · {booking.timeSlot}</p>
            <form className="mentor-reschedule-form" onSubmit={(event) => handleReschedule(event, booking)}>
              <label>New date <input type="date" name="sessionDate" min={today} required /></label>
              <label>New time slot <input type="text" name="timeSlot" defaultValue={booking.timeSlot} required maxLength={100} /></label>
              <button type="submit" className="btn-secondary">Reschedule</button>
              <button type="button" className="btn-cancel-session" onClick={() => handleCancel(booking.bookingId)}>Cancel booking</button>
            </form>
          </article>
        )) : <p>No upcoming sessions.</p>}
      </section>

      <section className="dashboard-panel" aria-labelledby="mentor-availability-heading">
        <div className="panel-header">
          <h2 className="panel-title" id="mentor-availability-heading">Availability</h2>
          <span>{dashboard.availabilitySummary.bookableSlots} bookable slots</span>
        </div>
        {dashboard.availabilitySummary.slots.map((slot) => (
          <p key={slot.id}>
            {slot.label} · {slot.specificDate || WEEKDAYS[slot.dayOfWeek] || 'Every day'}
            {' · '}{slot.isBookable ? 'Bookable' : 'Unavailable'}
          </p>
        ))}
        <form className="mentor-availability-form" onSubmit={handleAddAvailability}>
          <label>Time slot label <input value={slotLabel} onChange={(event) => setSlotLabel(event.target.value)} placeholder="10:00 AM – 11:00 AM IST" maxLength={100} required /></label>
          <label>Weekly day
            <select value={dayOfWeek} onChange={(event) => setDayOfWeek(event.target.value)} disabled={Boolean(specificDate)}>
              {WEEKDAYS.map((day, index) => <option value={index} key={day}>{day}</option>)}
            </select>
          </label>
          <label>Or specific date <input type="date" value={specificDate} onChange={(event) => setSpecificDate(event.target.value)} min={today} /></label>
          <button type="submit" className="btn-primary" disabled={savingAvailability}>{savingAvailability ? 'Saving…' : 'Add availability'}</button>
        </form>
      </section>

      <section className="dashboard-panel" aria-labelledby="mentor-history-heading">
        <h2 className="panel-title" id="mentor-history-heading">Session history</h2>
        {past.length === 0 && cancelled.length === 0 && <p>No past or cancelled sessions.</p>}
        {[...past, ...cancelled].map((booking) => (
          <article className="session-card" key={booking.bookingId}>
            <h3>{booking.sessionTopic}</h3>
            <p>{booking.student.name} · {formatDate(booking.sessionDate)} · {booking.status}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
