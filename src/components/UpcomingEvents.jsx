import { useState, useEffect } from 'react';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
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

function EventRow({ ev }) {
  const rawLink = ev.signupLink || ev.registrationLink || ev.link;
  const hasLink = rawLink && rawLink.startsWith('http') ? rawLink : null;
  const color = (ev.type || ev.category || 'academic').toLowerCase() === 'social'
    ? '#FAD85D'  // yellow
    : '#00F0FF';

  const inner = (
    <div
      className="flex items-start gap-3 p-3 sm:p-4 rounded transition-all duration-200"
      style={{
        background: `${color}10`,
        border: `1px solid ${color}33`,
      }}
    >
      <div
        className="flex-shrink-0 w-1 self-stretch rounded-full"
        style={{ background: color }}
      />
      <div className="flex-1 min-w-0">
        <div
          className="font-mono-tech font-bold text-sm sm:text-base leading-tight mb-1 truncate"
          style={{ color }}
        >
          {ev.title || ev.name}
        </div>
        <div className="font-mono-tech text-xs text-[#94a3b8] space-x-2">
          <span>{formatDate(ev.date)}</span>
          {ev.time && <span>· {formatTime(ev.time)}{ev.endTime ? ` – ${formatTime(ev.endTime)}` : ''}</span>}
          {(ev.location || ev.venue) && <span>· {ev.location || ev.venue}</span>}
        </div>
        {hasLink ? (
          <div className="font-mono-tech text-[10px] mt-1 tracking-wider" style={{ color }}>Sign up here →</div>
        ) : (
          <div className="font-mono-tech text-[10px] text-white/25 mt-1 tracking-wider">Sign up coming soon</div>
        )}
      </div>
    </div>
  );

  if (hasLink) {
    return (
      <a
        href={hasLink}
        target="_blank"
        rel="noopener noreferrer"
        data-track={`event-signup:${(ev.title || 'unknown').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
        className="block hover:opacity-90 active:opacity-75 transition-opacity"
        style={{ textDecoration: 'none' }}
      >
        {inner}
      </a>
    );
  }

  return <div>{inner}</div>;
}

export default function UpcomingEvents({ events = [] }) {
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + 14);

    const filtered = (events || [])
      .filter(ev => {
        const d = new Date(ev.date);
        return d >= today && d <= cutoff;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    setUpcoming(filtered);
  }, [events]);

  if (upcoming.length === 0) return null;

  return (
    <div className="terminal-block scanline-overlay" style={{ marginBottom: '32px' }}>
      <div className="relative z-10 p-6 sm:p-8">
        <div className="font-mono-tech text-sudata-neon/80 text-xs sm:text-sm tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="animate-flicker">&gt;_</span>
          <span className="whitespace-nowrap">[SECTION: UPCOMING_EVENTS]</span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-white font-mono-tech tracking-widest mb-1">
          Next 14 Days
        </h2>
        <p className="text-sudata-grey font-mono-tech text-xs sm:text-sm mb-5">
          {upcoming.length} event{upcoming.length !== 1 ? 's' : ''} incoming — tap to register
        </p>
        <div className="space-y-2 sm:space-y-3">
          {upcoming.map((ev, i) => (
            <EventRow key={ev.id || i} ev={ev} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
