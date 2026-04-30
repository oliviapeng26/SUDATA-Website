import { useRef, useState, useEffect } from 'react';

const EXECUTIVES = [
  { name: 'Cecilia Ma', role: 'President', linkedin: 'https://www.linkedin.com/in/cecilia-ma-usyd/', image: '/assets/execs/cecilia.jpeg' },
  { name: 'Xiaochen Chen', role: 'President', linkedin: 'https://www.linkedin.com/in/xiaochen-chen-2b165628a/', image: '/assets/execs/xiaochen.jpeg' },
  { name: 'Yanney Ou', role: 'Vice President', linkedin: 'https://www.linkedin.com/in/yanney-ou-596a68238/', image: '/assets/execs/yanney.jpeg' },
  { name: 'Tianna Lu', role: 'Vice President', linkedin: 'https://www.linkedin.com/in/tianna-luangrath-46a01b322/', image: '/assets/execs/tianna.jpeg' },
  { name: 'Audrey Shan', role: 'Vice President', linkedin: 'https://www.linkedin.com/in/audrey-shan/', image: '/assets/execs/audrey.jpeg' },
  { name: 'Felix Chan', role: 'Secretary', linkedin: 'https://www.linkedin.com/in/felix-chan-ab0aa9242/', image: '/assets/execs/felix.jpeg' },
  { name: 'Rhea Kumar', role: 'Treasurer', linkedin: 'https://www.linkedin.com/in/rhea-kumar-1a7625272/', image: '/assets/execs/rhea.jpeg' },
  { name: 'Margaret Zhao', role: 'Academic Events Director', linkedin: 'https://www.linkedin.com/in/margaret-zhao-56a505291/', image: '/assets/execs/margaret.jpeg' },
  { name: 'Emma Shan', role: 'Social Events Director', linkedin: '#', image: null },
  { name: 'Allayna Sachin', role: 'Marketing Director', linkedin: 'https://www.linkedin.com/in/allaynasachin/', image: '/assets/execs/allayna.jpeg' },
  { name: 'Madison Kim', role: 'Marketing Director', linkedin: 'https://www.linkedin.com/in/madison-kim-9319b7311/', image: null },
  { name: 'Reuben Thomas', role: 'Sponsorships Director', linkedin: 'https://www.linkedin.com/in/reuben-t-231725347/', image: '/assets/execs/reuben.jpeg' },
  { name: 'Olivia Peng', role: 'Technology Director', linkedin: 'https://www.linkedin.com/in/oliviapeng26/', image: '/assets/execs/olivia.jpeg' },
  { name: 'Lucas Fishburn', role: 'First-Year Representative', linkedin: 'https://www.linkedin.com/in/lucas-fishburn-a4639b26b/', image: '/assets/execs/lucas f.jpeg' },
  { name: 'Florencia Huang', role: 'Diversity Officer', linkedin: 'https://www.linkedin.com/in/florencia-huang-31a9092b9/', image: '/assets/execs/florencia.jpeg' },
  { name: 'Lucas Sue', role: 'International Director', linkedin: 'https://www.linkedin.com/in/lucas-sue-5aa720358/', image: '/assets/execs/lucas s.jpeg' },
];

const DEFAULT_CARD_WIDTH = 300;
const CARD_GAP_PX = 24;
const VIEWPORT_THREE_CARDS = DEFAULT_CARD_WIDTH * 3 + CARD_GAP_PX * 2; // 972px

function ExecutiveCard({ executive, cardWidth = DEFAULT_CARD_WIDTH }) {
  const initials = executive.name.split(' ').map(n => n[0]).join('');
  return (
    <div
      className="executive-card flex-shrink-0 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl flex flex-col items-center text-center executive-card-3d snap-start sm:snap-align-none"
      style={{ width: `${cardWidth}px`, minWidth: `${cardWidth}px` }}
    >
      <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-2 border-sudata-neon/60 bg-sudata-navy/80 mb-3 sm:mb-4 flex items-center justify-center overflow-hidden ring-2 ring-sudata-neon/30 object-cover">
        {executive.image ? (
          <img src={executive.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sudata-grey/50 text-2xl sm:text-3xl md:text-4xl font-bold font-mono select-none">
            {initials}
          </span>
        )}
      </div>
      <h3 className="font-mono-tech font-bold text-white text-base sm:text-lg tracking-wider mb-1">
        {executive.name}
      </h3>
      <p className="font-mono-tech text-sudata-neon/90 text-xs sm:text-sm tracking-widest mb-3 sm:mb-4">
        {executive.role}
      </p>
      <a
        href={executive.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        data-track={`contact:linkedin-${executive.name.toLowerCase().replace(/\s+/g, '-')}`}
        className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-sudata-neon/50 text-sudata-neon hover:bg-sudata-neon/20 active:bg-sudata-neon/30 hover:shadow-[0_0_15px_rgba(0,240,255,0.5)] transition-all duration-300 touch-manipulation"
        aria-label={`${executive.name} on LinkedIn`}
      >
        <LinkedInIcon />
      </a>
    </div>
  );
}

function LinkedInIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className="text-sudata-neon"
      style={{ imageRendition: 'pixelated' }}
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function ArrowButton({ direction, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="carousel-arrow flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-lg sm:rounded-xl border-2 border-sudata-neon/60 bg-sudata-navy/80 text-sudata-neon hover:bg-sudata-neon/20 active:bg-sudata-neon/30 hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] hover:border-sudata-neon transition-all duration-300 z-10 touch-manipulation"
      aria-label={direction === 'left' ? 'Previous executives' : 'Next executives'}
    >
      {direction === 'left' ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" className="sm:w-6 sm:h-6" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" className="sm:w-6 sm:h-6" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </button>
  );
}

// Ease out quint (approximation of cubic-bezier(0.23, 1, 0.32, 1) for the feel)
const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

export default function ExecutiveCarousel({ executives = null }) {
  const scrollRef = useRef(null);
  const [cardWidth, setCardWidth] = useState(DEFAULT_CARD_WIDTH);
  
  const items = executives || EXECUTIVES;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const containerWidth = el.clientWidth;
      if (containerWidth < 640) {
        setCardWidth(containerWidth);
      } else {
        setCardWidth(DEFAULT_CARD_WIDTH);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scrollAmount = cardWidth + CARD_GAP_PX;

  const scrollToPosition = (target, duration = 800) => {
    const el = scrollRef.current;
    if (!el) return;
    const start = el.scrollLeft;
    const distance = target - start;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      if (elapsed > duration) {
        el.scrollLeft = target;
        return;
      }
      const t = elapsed / duration;
      const ease = easeOutQuint(t);
      
      el.scrollLeft = start + distance * ease;
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;

    if (dir === 'left') {
        if (el.scrollLeft <= 5) {
            // Loop to end
            scrollToPosition(el.scrollWidth - el.clientWidth);
        } else {
            scrollToPosition(Math.max(0, el.scrollLeft - scrollAmount));
        }
    } else {
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 5) {
            // Loop to start
            scrollToPosition(0);
        } else {
            scrollToPosition(Math.min(el.scrollWidth - el.clientWidth, el.scrollLeft + scrollAmount));
        }
    }
  };

  return (
    <div className="relative w-full max-w-[972px] mx-auto flex items-center gap-2 sm:gap-3 md:gap-4 px-2 sm:px-0">
      <ArrowButton direction="left" onClick={() => scroll('left')} />
      <div
        ref={scrollRef}
        className="executive-carousel flex overflow-x-auto gap-4 sm:gap-6 py-4 px-2 scrollbar-hide flex-1 min-w-0 touch-pan-x snap-x snap-mandatory sm:snap-none"
        style={{
          width: '100%',
          maxWidth: VIEWPORT_THREE_CARDS,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {items.map((exec, i) => (
          <ExecutiveCard key={`${exec.name}-${i}`} executive={exec} cardWidth={cardWidth} />
        ))}
      </div>
      <ArrowButton direction="right" onClick={() => scroll('right')} />
    </div>
  );
}
