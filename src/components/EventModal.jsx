import { useEffect, useState, useRef } from 'react';

const EventModal = ({ event, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // THREE DIFFERENT BLUE/TEAL COLORS matching EventCalendar
  const typeColors = {
    academic: '#00F0FF',  // Bright cyan
    social: '#FAD85D',    // Yellow
    // industry: '#0EA5E9'   // Sky-500
  };

  const typeIcons = {
    academic: 'M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3Z',
    social: 'M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z',
    // industry: 'M12 7V3H2V21H22V7H12ZM6 19H4V17H6V19ZM6 15H4V13H6V15ZM6 11H4V9H6V11ZM6 7H4V5H6V7ZM10 19H8V17H10V19ZM10 15H8V13H10V15ZM10 11H8V9H10V11ZM10 7H8V5H10V7ZM20 19H12V17H14V15H12V13H14V11H12V9H20V19ZM18 11H16V13H18V11ZM18 15H16V17H18V15Z'
  };

  const typeColor = typeColors[event.type];

  const [calMenuOpen, setCalMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // close calendar menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setCalMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Parse event time safely — falls back to midnight for "TBD" or missing times
  const parseEventTime = (timeStr) => {
    if (timeStr && timeStr.includes(':')) {
      const [h, m] = timeStr.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) return { hours: h, minutes: m };
    }
    return { hours: 0, minutes: 0 };
  };

  /**
   * Generate ICS file content for calendar import
   */
  const generateICS = () => {
    // Parse date and time
    const [year, month, day] = event.date.split('-').map(Number);
    const { hours, minutes } = parseEventTime(event.time);
    
    // Create start date object
    const startDate = new Date(year, month - 1, day, hours, minutes);
    
    // Assume 1 hour duration if not specified
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    
    // Format dates for ICS (YYYYMMDDTHHMMSS)
    const formatICSDate = (date) => {
      const pad = (num) => String(num).padStart(2, '0');
      return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    };
    
    const dtstart = formatICSDate(startDate);
    const dtend = formatICSDate(endDate);
    const dtstamp = formatICSDate(new Date());
    
    // Generate unique ID
    const uid = `${event.id}@sudata.org`;
    
    // Escape special characters in text fields
    const escapeICS = (text) => {
      if (!text) return '';
      return text.replace(/\\/g, '\\\\')
                 .replace(/;/g, '\\;')
                 .replace(/,/g, '\\,')
                 .replace(/\n/g, '\\n');
    };
    
    // Build description
    let description = escapeICS(event.description);
    if (event.collaborators && event.collaborators.length > 0) {
      description += `\\n\\nCollaborators: ${event.collaborators.join(', ')}`;
    }
    if (event.catering && event.catering !== 'None') {
      description += `\\n\\nCatering: ${event.catering}`;
    }
    description += `\\n\\nSign up: ${event.signupLink}`;
    
    // ICS content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SUDATA//Events Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${escapeICS(event.venue)}`,
      `CATEGORIES:${event.type.toUpperCase()}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    return icsContent;
  };

  /**
   * Download ICS file
   */
  const downloadICS = () => {
    const icsContent = generateICS();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Create filename from event title and date
    const filename = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${event.date}.ics`;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // will open a google cal page to request to add the event to users calendar
  const buildGoogleCalUrl = () => {
    const [year, month, day] = event.date.split('-').map(Number);
    const { hours, minutes } = parseEventTime(event.time);
    const start = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${fmt(start)}/${fmt(end)}`,
      details: event.description || '',
      location: event.venue || '',
      sprop: `name:SUDATA Events`,
    });
    return `https://www.google.com/calendar/render?${params.toString()}`;
  };


  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl max-h-[90dvh] sm:max-h-[90vh] overflow-y-auto bg-[#020617] rounded-xl sm:rounded-2xl border-2 border-[#00F0FF]/30 p-4 sm:p-6 md:p-8"
        style={{ 
          backdropFilter: 'blur(40px)',
          boxShadow: '0 0 60px rgba(0,240,255,0.3), inset 0 0 40px rgba(0,240,255,0.05)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (X) - Only this one remains */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] 
                   hover:bg-[#00F0FF]/20 active:bg-[#00F0FF]/30 hover:scale-110 active:scale-95 transition-all duration-300 touch-manipulation"
          aria-label="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="sm:w-6 sm:h-6" style={{ imageRendering: 'pixelated' }}>
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" />
          </svg>
        </button>

        {/* Event Type Badge - NO attendee count */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div 
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 flex items-center gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm uppercase"
            style={{
              borderColor: typeColors[event.type],
              color: typeColors[event.type],
              backgroundColor: `${typeColors[event.type]}20`,
              boxShadow: `0 0 20px ${typeColors[event.type]}40`
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="sm:w-5 sm:h-5" style={{ imageRendering: 'pixelated' }}>
              <path d={typeIcons[event.type]} />
            </svg>
            {event.type}
          </div>
        </div>

        {/* Event Title */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6" style={{ color: typeColor, textShadow: `0 0 20px ${typeColor}` }}>
          {event.title}
        </h2>

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Date */}
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex-shrink-0" style={{ backgroundColor: `${typeColor}20`, borderColor: `${typeColor}40` }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#00F0FF" className="sm:w-6 sm:h-6" style={{ fill: typeColor, imageRendering: 'pixelated' }}>
                <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V9H19V19ZM19 7H5V5H19V7Z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">Date</div>
              <div className="text-sm sm:text-base font-semibold" style={{ color: typeColor }}>{formatDate(event.date)}</div>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex-shrink-0" style={{ backgroundColor: `${typeColor}20`, borderColor: `${typeColor}40` }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#00F0FF" className="sm:w-6 sm:h-6" style={{ fill: typeColor, imageRendering: 'pixelated' }}>
                <path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20ZM12.5 7H11V13L16.2 16.2L17 14.9L12.5 12.2V7Z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">Time</div>
              <div className="text-sm sm:text-base font-semibold" style={{ color: typeColor }}>{event.time}</div>
            </div>
          </div>

          {/* Venue */}
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex-shrink-0" style={{ backgroundColor: `${typeColor}20`, borderColor: `${typeColor}40` }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#00F0FF" className="sm:w-6 sm:h-6" style={{ fill: typeColor, imageRendering: 'pixelated' }}>
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5S14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">Venue</div>
              <div className="text-sm sm:text-base font-semibold break-words" style={{ color: typeColor }}>{event.venue}</div>
            </div>
          </div>

          {/* Catering */}
          {event.catering && event.catering !== 'None' && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30" style={{ backgroundColor: `${typeColor}20`, borderColor: `${typeColor}40` }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#00F0FF" style={{ fill: typeColor, imageRendering: 'pixelated' }}>
                  <path d="M8.1 13.34L10.93 10.51L13.76 13.34L16.59 10.51L13.76 7.68L16.59 4.85L13.76 2.02L7.26 8.52L8.1 13.34ZM14.5 17C14.5 15.62 13.38 14.5 12 14.5S9.5 15.62 9.5 17C9.5 18.38 10.62 19.5 12 19.5S14.5 18.38 14.5 17ZM8 21L16 21L14 19L10 19L8 21Z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">Catering</div>
                <div className="font-semibold" style={{ color: typeColor }}>{event.catering}</div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3" style={{ color: typeColor }}>About This Event</h3>
          <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">{event.description}</p>
        </div>

        {/* Collaborators */}
        {event.collaborators && event.collaborators.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3" style={{ color: typeColor }}>Collaborators</h3>
            <div className="flex flex-wrap gap-2">
              {event.collaborators.map((collab, idx) => (
                <span 
                  key={idx}
                  className="px-2 sm:px-3 py-1 rounded-full border text-xs sm:text-sm font-semibold"
                  style={{ 
                    backgroundColor: `${typeColor}20`, 
                    borderColor: `${typeColor}40`,
                    color: typeColor
                  }}
                >
                  {collab}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons - BOLD TEAL STYLE (like original View Sign-Up Form) */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          <a
            href={event.signupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-lg text-[#020617] font-bold text-center text-sm sm:text-base
                     hover:scale-105 active:scale-95 transition-all duration-300 touch-manipulation"
            style={{ 
              backgroundColor: typeColor,
              boxShadow: `0 0 30px ${typeColor}80`,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${typeColor}cc`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = typeColor}
            onMouseDown={(e) => e.currentTarget.style.backgroundColor = `${typeColor}99`}
            onMouseUp={(e) => e.currentTarget.style.backgroundColor = typeColor}
          >
            View Sign-Up Form
          </a>
          
          <div className="flex-1 flex flex-col-reverse gap-2" ref={menuRef}>
            <button
              onClick={() => setCalMenuOpen((o) => !o)}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-lg text-[#020617] font-bold text-sm sm:text-base
                       hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 touch-manipulation"
              style={{ 
                backgroundColor: typeColor,
                boxShadow: `0 0 30px ${typeColor}80`,
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${typeColor}cc`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = typeColor}
              onMouseDown={(e) => e.currentTarget.style.backgroundColor = `${typeColor}99`}
              onMouseUp={(e) => e.currentTarget.style.backgroundColor = typeColor}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="sm:w-5 sm:h-5" style={{ imageRendering: 'pixelated' }}>
                <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V9H19V19ZM19 7H5V5H19V7Z" />
              </svg>
              Add to Calendar
            </button>

            {calMenuOpen && (
              <div className="w-full bg-[#020617] rounded-lg border border-[#555] shadow-lg overflow-hidden">
                <button
                  onClick={() => {
                    downloadICS();
                    setCalMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#333] transition"
                  style={{ color: typeColor }}
                >
                  Apple Calendar
                </button>
                <a
                  href={buildGoogleCalUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-left px-4 py-2 hover:bg-[#333] transition"
                  style={{ color: typeColor }}
                  onClick={() => setCalMenuOpen(false)}
                >
                  Google Calendar
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
