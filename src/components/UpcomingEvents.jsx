import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import EventModal from './EventModal';

const MAX_UPCOMING = 5;

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Australia/Sydney',
  });
}

function formatTime(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parts[1] ? parts[1].padStart(2, '0') : '00';
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m} ${period}`;
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7) return `In ${diff} days`;
  if (diff < 14) return 'Next week';
  return `In ${Math.round(diff / 7)} weeks`;
}

function EventCard({ ev, onOpen }) {
  const type = (ev.type || ev.category || 'academic').toLowerCase();
  const color = type === 'social' ? '#FAD85D' : '#00F0FF';

  const timeText = ev.time
    ? `${formatTime(ev.time)}${ev.endTime ? ` – ${formatTime(ev.endTime)}` : ''}`
    : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(ev)}
      className="group relative w-full overflow-hidden rounded-lg text-left transition-all duration-300 cursor-pointer"
      style={{ background: `${color}0d`, border: `1px solid ${color}33` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}80`;
        e.currentTarget.style.boxShadow = `0 0 24px ${color}25`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${color}33`;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color }} />

      <div className="p-5 sm:p-6 pl-6 sm:pl-8">
        {/* Top row: type badge + countdown */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span
            className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.15em]"
            style={{ background: `${color}1a`, border: `1px solid ${color}55`, color }}
          >
            {type}
          </span>
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-white/50">
            {daysUntil(ev.date)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-mono-tech font-bold text-lg sm:text-xl leading-tight mb-2" style={{ color }}>
          {ev.title || ev.name}
        </h3>

        {/* Meta line */}
        <div className="font-mono-tech text-xs sm:text-sm text-[#94a3b8] flex flex-wrap gap-x-2 gap-y-1 mb-3">
          <span>{formatDate(ev.date)}</span>
          {timeText && <span>· {timeText}</span>}
          {(ev.location || ev.venue) && <span>· {ev.location || ev.venue}</span>}
          {ev.catering && ev.catering !== 'None' && <span>· {ev.catering}</span>}
        </div>

        {/* Description */}
        {ev.description && (
          <p className="font-mono-tech text-xs sm:text-sm text-white/60 leading-relaxed line-clamp-2 mb-4">
            {ev.description}
          </p>
        )}

        {/* Affordance */}
        <span
          className="inline-flex items-center gap-1 font-mono-tech text-[11px] font-bold tracking-wider transition-transform duration-200 group-hover:translate-x-1"
          style={{ color }}
        >
          View details →
        </span>
      </div>
    </button>
  );
}

export default function UpcomingEvents({ events = [] }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (events || [])
      .filter((ev) => {
        const d = new Date(ev.date);
        return !Number.isNaN(d.getTime()) && d >= today;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, MAX_UPCOMING);
  }, [events]);

  const hasUpcoming = upcoming.length > 0;

  return (
    <div className="terminal-block scanline-overlay" style={{ marginBottom: '32px' }}>
      <div className="relative z-10 p-6 sm:p-8">
        <div className="font-mono-tech text-sudata-neon/80 text-xs sm:text-sm tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="animate-flicker">&gt;_</span>
          <span className="whitespace-nowrap">[SECTION: UPCOMING_EVENTS]</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white font-mono-tech tracking-widest mb-2">
          Upcoming Events
        </h2>

        {hasUpcoming ? (
          <>
            <p className="text-sudata-grey font-mono-tech text-xs sm:text-sm leading-relaxed mb-6 max-w-3xl">
              The next {upcoming.length} {upcoming.length === 1 ? 'event' : 'events'} on the SUDATA calendar — workshops, socials,
              and collaborations. Tap any card for the full details and sign-up link.
            </p>
            <div className="space-y-4">
              {upcoming.map((ev) => (
                <EventCard key={ev.id} ev={ev} onOpen={setSelectedEvent} />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-2 rounded-lg border border-dashed border-sudata-neon/25 bg-sudata-neon/5 px-6 py-10 text-center">
            <p className="font-mono-tech text-sudata-neon text-sm sm:text-base tracking-wide">
              No upcoming events for now — stay tuned!
            </p>
            <p className="font-mono-tech text-white/40 text-xs mt-2">
              Check back soon or browse the calendar below for past sessions.
            </p>
          </div>
        )}
      </div>

      {/* Portal to body so `position: fixed` escapes the terminal-block's
          backdrop-filter / reveal-on-scroll transform containing block */}
      {selectedEvent && typeof document !== 'undefined' &&
        createPortal(
          <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />,
          document.body,
        )}
    </div>
  );
}

