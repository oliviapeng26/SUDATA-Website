import { useState, useRef, useEffect } from "react";

const SITE_URL =
  import.meta.env.PUBLIC_SITE_URL ?? "https://sudata-website.vercel.app";
const ICS_PATH = "/api/calendar.ics";
const ICS_URL = `${SITE_URL}${ICS_PATH}`;
const WEBCAL_URL = ICS_URL.replace(/^https?:\/\//, "webcal://");
const GOOGLE_URL = `https://www.google.com/calendar/render?cid=${encodeURIComponent(WEBCAL_URL)}`;
const IS_LOCAL = SITE_URL.includes("localhost") || SITE_URL.includes("127.0.0.1");

function IconCalendar() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ imageRendering: "pixelated", flexShrink: 0 }}
    >
      <rect x="1" y="2" width="14" height="13" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 6h14" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="0" width="2" height="4" rx="0.5" fill="currentColor" />
      <rect x="10" y="0" width="2" height="4" rx="0.5" fill="currentColor" />
      <rect x="4" y="9" width="2" height="2" fill="currentColor" />
      <rect x="7" y="9" width="2" height="2" fill="currentColor" />
      <rect x="10" y="9" width="2" height="2" fill="currentColor" />
    </svg>
  );
}

function IconApple() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      style={{ imageRendering: "pixelated", flexShrink: 0 }}
    >
      <path d="M11.182 1c.07.822-.238 1.637-.728 2.228-.49.59-1.27.996-2.05.93-.08-.79.266-1.612.74-2.165C9.62 1.44 10.45 1.06 11.182 1zm2.16 5.19c-.89-.55-1.51-.54-2.14-.54-.63 0-1.26.36-1.68.36-.43 0-1-.34-1.68-.34-.67 0-1.38.38-1.84 1.02C5.22 7.55 5 8.6 5 9.62c0 1.55.54 3.2 1.35 4.24.67.87 1.25 1.14 1.82 1.14.56 0 .98-.34 1.65-.34.67 0 1.03.33 1.65.33.6 0 1.19-.33 1.82-1.16.5-.65.84-1.43 1.04-2.14-.88-.37-1.46-1.2-1.46-2.17 0-.88.47-1.64 1.25-2.12z" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      style={{ imageRendering: "pixelated", flexShrink: 0 }}
    >
      <circle cx="8" cy="8" r="6.5" />
      <ellipse cx="8" cy="8" rx="2.5" ry="6.5" />
      <path d="M1.5 8h13" />
      <path d="M2.5 5h11M2.5 11h11" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      style={{ imageRendering: "pixelated", flexShrink: 0 }}
    >
      <path d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5L7 4" />
      <path d="M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5L9 12" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="#22d3ee"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ imageRendering: "pixelated", flexShrink: 0 }}
    >
      <polyline points="2,8 6,12 14,4" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      style={{
        imageRendering: "pixelated",
        flexShrink: 0,
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
      }}
    >
      <polyline points="2,4 6,8 10,4" />
    </svg>
  );
}

export default function CalendarSubscribe() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  function handleCopy() {
    navigator.clipboard?.writeText(ICS_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 px-4 py-2 font-mono-tech text-sm font-semibold tracking-wider border border-sudata-neon text-sudata-neon rounded transition-all duration-200 bg-transparent"
        style={{
          filter: open
            ? "drop-shadow(0 0 10px #00F0FF)"
            : "drop-shadow(0 0 6px rgba(0,240,255,0.4))",
          background: open ? "rgba(0,240,255,0.067)" : "transparent",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(0,240,255,0.067)";
          (e.currentTarget as HTMLButtonElement).style.filter =
            "drop-shadow(0 0 10px #00F0FF)";
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.filter =
              "drop-shadow(0 0 6px rgba(0,240,255,0.4))";
          }
        }}
      >
        <IconCalendar />
        <span>Subscribe to Calendar</span>
        <IconChevron open={open} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 rounded-md border font-mono-tech z-50"
          style={{
            top: "100%",
            minWidth: "280px",
            background: "#020617",
            borderColor: "rgba(0,240,255,0.267)",
            boxShadow: "0 0 24px rgba(0,240,255,0.13)",
          }}
        >
          <div className="p-1">
            {/* Apple Calendar */}
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                const a = document.createElement("a");
                a.href = WEBCAL_URL;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
              className="w-full flex items-start gap-3 px-3 py-3 rounded text-left transition-colors duration-150 bg-transparent border-none cursor-pointer"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(0,240,255,0.051)";
                (e.currentTarget as HTMLButtonElement).style.color = "#00F0FF";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "";
              }}
            >
              <span className="text-sudata-neon mt-0.5">
                <IconApple />
              </span>
              <div>
                <div className="text-white text-sm font-semibold leading-tight">
                  Apple Calendar
                </div>
                <div className="text-sudata-grey text-xs mt-0.5">
                  iOS, macOS, iPadOS
                </div>
              </div>
            </button>

            {/* Google Calendar */}
            <button
              role="menuitem"
              onClick={() => {
                if (IS_LOCAL) return;
                setOpen(false);
                window.open(GOOGLE_URL, "_blank", "noopener,noreferrer");
              }}
              className="w-full flex items-start gap-3 px-3 py-3 rounded text-left transition-colors duration-150 bg-transparent border-none"
              style={{ cursor: IS_LOCAL ? "default" : "pointer", opacity: IS_LOCAL ? 0.45 : 1 }}
            >
              <span className="text-sudata-neon mt-0.5">
                <IconGlobe />
              </span>
              <div>
                <div className="text-white text-sm font-semibold leading-tight">
                  Google Calendar
                </div>
                <div className="text-sudata-grey text-xs mt-0.5">
                  {IS_LOCAL
                    ? "Not available on localhost — works after deployment"
                    : "Opens Google Calendar in browser"}
                </div>
              </div>
            </button>

            {/* Copy URL */}
            <button
              onClick={handleCopy}
              role="menuitem"
              className="w-full flex items-start gap-3 px-3 py-3 rounded text-left transition-colors duration-150 bg-transparent border-none cursor-pointer"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(0,240,255,0.051)";
                (e.currentTarget as HTMLButtonElement).style.color = "#00F0FF";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "";
              }}
            >
              <span className="text-sudata-neon mt-0.5">
                {copied ? <IconCheck /> : <IconLink />}
              </span>
              <div>
                <div className="text-sm font-semibold leading-tight" style={{ color: copied ? "#22d3ee" : "white" }}>
                  {copied ? "Link copied!" : "Copy calendar URL"}
                </div>
                <div className="text-sudata-grey text-xs mt-0.5">
                  Outlook, Fantastical, Thunderbird&hellip;
                </div>
              </div>
            </button>
          </div>

          {/* Footer note */}
          <div
            className="px-4 py-2.5 text-[11px] text-sudata-grey/60 leading-snug"
            style={{
              borderTop: "1px solid rgba(0,240,255,0.133)",
            }}
          >
            Subscribing means new SUDATA events appear automatically — no
            re-importing needed.
          </div>
        </div>
      )}
    </div>
  );
}
