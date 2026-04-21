import React, { useMemo, useState } from 'react';

function formatDeadline(deadline) {
  if (!deadline) return null;
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const [year, month, day] = deadline.split('-').map(Number);
  return `${day} ${months[month - 1]} ${year}`;
}

function isPast(deadline) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function OpportunityCard({ opp }) {
  const [descExpanded, setDescExpanded] = useState(false);
  const deadlineStr  = formatDeadline(opp.deadline);
  const deadlinePast = isPast(opp.deadline);
  const effectiveStatus = (opp.status === 'closed' || deadlinePast) ? 'closed' : 'open';
  const isOpen = effectiveStatus === 'open';

  return (
    <div className="group glass-panel-3d p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 relative overflow-hidden scanline-overlay h-full">

      {/* Type tag + status badge — wrap on narrow cards so nothing is clipped */}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        <span className="font-mono-tech text-sudata-neon/80 text-xs tracking-[0.2em]">
          [ {opp.type.toUpperCase()} ]
        </span>
        <span
          className={`font-mono-tech text-xs tracking-widest px-2 py-0.5 border whitespace-nowrap flex-shrink-0 ${
            isOpen
              ? 'border-sudata-neon/60 text-sudata-neon bg-sudata-neon/10'
              : 'border-sudata-grey/30 text-sudata-grey/50 bg-transparent'
          }`}
        >
          {isOpen ? '● OPEN' : '○ CLOSED'}
        </span>
      </div>

      {/* Title */}
      <h3 className="relative z-10 text-sm sm:text-base font-bold text-white font-mono-tech tracking-wider group-hover:text-sudata-neon transition-colors leading-snug">
        {opp.title}
      </h3>

      {/* Description — always visible on desktop (flex-1 pushes footer down) */}
      <p className="relative z-10 text-xs font-mono-tech text-sudata-grey/90 leading-relaxed flex-1 hidden sm:block">
        {opp.description}
      </p>

      {/* Description — collapsible toggle on mobile only */}
      <div className="sm:hidden relative z-10">
        <button
          onClick={() => setDescExpanded(v => !v)}
          className="flex items-center gap-1.5 font-mono-tech text-xs text-sudata-neon/60 tracking-wider hover:text-sudata-neon transition-colors"
        >
          <span className="text-[10px]">{descExpanded ? '▲' : '▼'}</span>
          <span>{descExpanded ? 'HIDE DETAILS' : 'SHOW DETAILS'}</span>
        </button>
        {descExpanded && (
          <p className="text-xs font-mono-tech text-sudata-grey/90 leading-relaxed mt-2">
            {opp.description}
          </p>
        )}
      </div>

      {/* Deadline */}
      <div className="relative z-10 font-mono-tech text-xs text-sudata-grey/60 tracking-wider">
        {deadlineStr
          ? <span><span className="text-sudata-neon/60">CLOSES:</span> {deadlineStr}</span>
          : <span className="text-sudata-neon/60">ROLLING — NO DEADLINE</span>
        }
      </div>

      {/* Apply / closed button */}
      {isOpen ? (
        <a
          href={opp.applicationLink}
          target="_blank"
          rel="noopener noreferrer"
          data-track={`sponsor-opp:${opp.sponsor.toLowerCase().replace(/\s+/g, '-')}:${opp.id}`}
          className="relative z-10 inline-flex items-center gap-2 px-5 py-2 bg-sudata-neon text-black font-mono-tech font-bold text-xs tracking-wider hover:bg-sudata-neon/90 transition-all duration-300 self-start"
        >
          APPLY NOW
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      ) : (
        <span className="relative z-10 inline-flex items-center gap-2 px-5 py-2 border border-sudata-grey/20 text-sudata-grey/30 font-mono-tech font-bold text-xs tracking-wider self-start cursor-not-allowed">
          APPLICATIONS CLOSED
        </span>
      )}

    </div>
  );
}

/**
 * OpportunitiesBoard
 *
 * Renders all opportunity cards in a single unified CSS grid so that cards
 * in the same row — regardless of sponsor — are always the same height.
 * Sponsor groups are separated by full-width header rows (col-span-full).
 * Groups are ordered by sponsorTier (1 = Industry Partner → 3 = Sponsor).
 *
 * Props:
 *   opportunities — array from opportunities.json
 */
export default function OpportunitiesBoard({ opportunities }) {
  const sortedGroups = useMemo(() => {
    // Build a map: sponsor → { tier, logo, opps[] }
    const map = new Map();
    for (const opp of opportunities) {
      if (!map.has(opp.sponsor)) {
        map.set(opp.sponsor, {
          tier: opp.sponsorTier ?? 99,
          logo: opp.sponsorLogo,
          opps: [],
        });
      }
      map.get(opp.sponsor).opps.push(opp);
    }
    // Sort sponsor groups ascending by tier (lower tier = higher rank = shown first)
    return [...map.entries()].sort((a, b) => a[1].tier - b[1].tier);
  }, [opportunities]);

  if (!opportunities.length) {
    return (
      <div className="font-mono-tech text-sudata-grey/50 text-sm tracking-wider text-center py-12">
        &gt;_ No opportunities listed at this time. Check back soon.
      </div>
    );
  }

  // Shared sponsor header markup (used in both layouts)
  const SponsorHeader = ({ sponsor, logo, mt }) => (
    <div className={`flex items-center gap-3 sm:gap-4 ${mt ? 'mt-3 sm:mt-4' : ''}`}>
      {logo && (
        <img
          src={logo}
          alt={sponsor}
          className="h-7 w-auto max-w-[100px] object-contain opacity-80 flex-shrink-0"
          loading="lazy"
        />
      )}
      <div className="flex-1 h-px bg-sudata-neon/20" />
      <span className="font-mono-tech text-sudata-grey/60 text-xs tracking-[0.2em] whitespace-nowrap">
        [ {sponsor.toUpperCase()} ]
      </span>
      <div className="flex-1 h-px bg-sudata-neon/20" />
    </div>
  );

  return (
    <>
      {/* ── Mobile: per-group horizontal scroll rows ───────────────────────
           Each card is a fixed 240 px wide; the row scrolls horizontally so
           cards are always side-by-side without any text clipping.          */}
      <div className="sm:hidden flex flex-col gap-4">
        {sortedGroups.map(([sponsor, { logo, opps }], groupIdx) => (
          <div key={sponsor}>
            <SponsorHeader sponsor={sponsor} logo={logo} mt={groupIdx > 0} />
            <div className="mt-3 flex overflow-x-auto gap-3 pt-6 pb-4 snap-x snap-mandatory">
              {opps.map((opp) => (
                <div key={opp.id} className="flex-none w-[240px] snap-start">
                  <OpportunityCard opp={opp} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop: unified CSS grid (all cards share the same row tracks) */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedGroups.map(([sponsor, { logo, opps }], groupIdx) => (
          <React.Fragment key={sponsor}>
            <div className={`col-span-full ${groupIdx > 0 ? 'mt-4' : ''}`}>
              <SponsorHeader sponsor={sponsor} logo={logo} mt={false} />
            </div>
            {opps.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
