import { useState } from 'react';

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return 'TBA';
  try {
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Australia/Sydney'
    }).format(date);
  } catch (e) {
    return dateTimeStr;
  }
};

export default function EventList({ events, onDelete, onEdit }) {
  // Debugging log to confirm the data is here during render
  console.log("Rendering EventList with count:", events?.length);

  // 1. Handle the "Truly Empty" state
  if (!events || events.length === 0) {
    return (
      <div className="border border-dashed border-[#00F0FF]/20 p-12 text-center text-[#94a3b8] font-mono">
        [ NO EVENTS FOUND]
      </div>
    );
  }

  // 2. Group events by type
  const eventsByType = {
    academic: events.filter(e => e.type === 'academic'),
    social: events.filter(e => e.type === 'social')
  };

  // 3. Render the grid with columns
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-sm">
      {/* Academic Column */}
      <div className="space-y-4">
        <div className="text-[#00F0FF] font-bold text-lg tracking-widest uppercase border-b border-[#00F0FF]/30 pb-3">
          ACADEMIC
        </div>
        <div className="space-y-3">
          {eventsByType.academic.length > 0 ? (
            eventsByType.academic.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onEdit={onEdit} 
                onDelete={onDelete}
                typeColor="#00F0FF"
              />
            ))
          ) : (
            <div className="text-[#94a3b8] text-xs italic">No academic events</div>
          )}
        </div>
      </div>

      {/* Social Column */}
      <div className="space-y-4">
        <div className="text-[#FF00FF] font-bold text-lg tracking-widest uppercase border-b border-[#FF00FF]/30 pb-3">
          SOCIAL
        </div>
        <div className="space-y-3">
          {eventsByType.social.length > 0 ? (
            eventsByType.social.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onEdit={onEdit} 
                onDelete={onDelete}
                typeColor="#FF00FF"
              />
            ))
          ) : (
            <div className="text-[#94a3b8] text-xs italic">No social events</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Event Card Component
function EventCard({ event, onEdit, onDelete, typeColor }) {
  // Use image_url from API (which is a proper data URL)
  const getImageUrl = () => {
    if (event.image_url) {
      return event.image_url;
    }
    return null;
  };

  const imageUrl = getImageUrl();

  return (
    <div 
      className="group relative overflow-hidden backdrop-blur-2xl bg-slate-900/40 border p-0
                 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                 hover:translate-y-[-8px]"
      style={{
        borderColor: `${typeColor}40`,
        backgroundColor: `${typeColor}08`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${typeColor}80`;
        e.currentTarget.style.boxShadow = `0 0 20px ${typeColor}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${typeColor}40`;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* IMAGE */}
      {imageUrl && (
        <div className="w-full h-80 overflow-hidden bg-slate-900">
          <img 
            src={imageUrl} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* CONTENT */}
      <div className="relative z-10 space-y-3 p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold tracking-widest border px-2 py-0.5 uppercase" style={{ borderColor: typeColor, color: typeColor }}>
              ID: {event.id}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-[#00F0FF] transition-colors leading-tight">
            {event.title}
          </h3>
          <p className="text-[10px] text-white/60 tracking-widest">
            {formatDateTime(event.date)}
          </p>
        </div>

        {event.venue && (
          <p className="text-[10px] text-white/50 truncate">
            📍 {event.venue}
          </p>
        )}

        {event.catering && (
          <p className="text-[10px] text-white/50 truncate">
            🍽️ {event.catering}
          </p>
        )}

        {/* ACTIONS */}
        <div className="flex gap-2 pt-3 border-t" style={{ borderColor: `${typeColor}20` }}>
          <button 
            onClick={() => onEdit(event)}
            className="flex-1 px-2 py-1.5 border text-xs hover:text-white transition-all"
            style={{ 
              borderColor: typeColor, 
              color: typeColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = typeColor;
              e.currentTarget.style.color = '#020617';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = typeColor;
            }}
          >
            EDIT
          </button>
          <button 
            onClick={() => onDelete(event.id)}
            className="flex-1 px-2 py-1.5 border border-red-500/40 text-red-500 text-xs hover:bg-red-500 hover:text-white transition-all"
          >
            PURGE
          </button>
        </div>
      </div>
    </div>
  );
}