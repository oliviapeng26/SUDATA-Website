import { useCallback, useEffect, useRef, useState } from "react";

type Role = "user" | "assistant" | "system";

type ChatMessage = {
  id: string;
  role: Role;
  text: string;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  /** Full viewport chat vs right-rail docked panel */
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: uid(),
      role: "assistant",
      text: ">_ Hey, I'm Sudino. Ask me about SUDATA — events, USU membership, hackathons, whatever's on your mind.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, open, scrollToBottom]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const closeChat = useCallback(() => {
    setExpanded(false);
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  useEffect(() => {
    if (!open || !expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, expanded]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeChat]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const payload = JSON.stringify({ message: trimmed });
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
        },
        body: payload,
      });

      const raw = await res.text();
      let data: unknown = {};
      if (raw.trim()) {
        try {
          data = JSON.parse(raw) as unknown;
        } catch {
          data = { error: `Bad response from server (not JSON). Status ${res.status}` };
        }
      } else if (!res.ok) {
        data = { error: `Empty response (HTTP ${res.status})` };
      }

      const text =
        typeof data === "object" &&
        data !== null &&
        "text" in data &&
        typeof (data as { text: unknown }).text === "string"
          ? (data as { text: string }).text
          : null;

      const err =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : !res.ok
            ? `Request failed (${res.status})`
            : "No reply from Sudino.";

      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          text: text ?? err,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          text: ">_ Connection glitch. Is Ollama running on this machine? (localhost:11434)",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const dockBottom =
    "calc(5.75rem + env(safe-area-inset-bottom, 0px))";

  return (
    <>
      {/* Chat panel: docked right rail or full-screen; glass + sudata-neon */}
      <div
        className={`chatbot-ui chatbot-panel pointer-events-none fixed flex flex-col transition-[transform,opacity,width,height,top,right,bottom,left,border-radius] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overscroll-contain ${
          expanded
            ? `inset-0 z-[75] h-dvh max-h-dvh w-full max-w-none rounded-none ${open ? "translate-x-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`
            : `right-0 top-[max(4.5rem,env(safe-area-inset-top,0px)+4.25rem)] z-[68] h-[calc(100dvh-max(4.5rem,env(safe-area-inset-top,0px)+4.25rem)-env(safe-area-inset-bottom,0px))] max-h-[calc(100dvh-max(4.5rem,env(safe-area-inset-top,0px)+4.25rem)-env(safe-area-inset-bottom,0px))] w-[min(22rem,calc(100vw-1rem))] sm:top-[max(5.5rem,env(safe-area-inset-top,0px)+5rem)] sm:h-[calc(100dvh-max(5.5rem,env(safe-area-inset-top,0px)+5rem)-env(safe-area-inset-bottom,0px))] sm:max-h-[calc(100dvh-max(5.5rem,env(safe-area-inset-top,0px)+5rem)-env(safe-area-inset-bottom,0px))] sm:w-[min(24rem,calc(100vw-1.25rem))] md:w-[26rem] ${open ? "translate-x-0 opacity-100" : "translate-x-[calc(100%+12px)] opacity-0"}`
        }`}
        style={
          expanded && open
            ? {
                paddingTop: "env(safe-area-inset-top, 0px)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
                paddingLeft: "env(safe-area-inset-left, 0px)",
                paddingRight: "env(safe-area-inset-right, 0px)",
              }
            : undefined
        }
        aria-hidden={!open}
      >
        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white/5 shadow-[-16px_0_48px_rgba(0,240,255,0.12)] backdrop-blur-xl ${
            expanded
              ? "rounded-none border border-white/15"
              : "rounded-l-2xl border border-white/20 border-r-0 sm:rounded-l-3xl"
          } ${open ? "pointer-events-auto" : "pointer-events-none"}`}
          role="dialog"
          aria-label={expanded ? "Chat with Sudino (full screen)" : "Chat with Sudino"}
          aria-modal={open}
        >
          {/* Header — terminal-style label, site chrome */}
          <header className="flex shrink-0 items-center justify-between gap-1 border-b border-white/15 bg-sudata-navy/60 px-2 py-2 sm:gap-2 sm:px-3 sm:py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
              <span className="animate-flicker shrink-0 font-mono-tech text-sm font-bold text-sudata-neon">
                &gt;_
              </span>
              <span className="truncate font-mono-tech text-[10px] font-bold tracking-[0.12em] text-white/90 sm:text-xs sm:tracking-[0.15em]">
                SUDINO_CHAT
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                className="chatbot-header-close flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-sudata-neon/90 transition hover:border-sudata-neon/50 hover:bg-sudata-neon/10 hover:text-sudata-neon"
                aria-label={expanded ? "Exit full screen" : "Enter full screen"}
                aria-pressed={expanded}
                onClick={() => setExpanded((e) => !e)}
              >
                {expanded ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M15 3h6v6" />
                    <path d="M9 21H3v-6" />
                    <path d="M21 3l-7 7" />
                    <path d="M3 21l7-7" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                className="chatbot-header-close flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-lg leading-none text-white/70 transition hover:border-sudata-neon/50 hover:bg-sudata-neon/10 hover:text-sudata-neon"
                aria-label="Close chat"
                onClick={closeChat}
              >
                ×
              </button>
            </div>
          </header>

          <div className="relative flex min-h-0 flex-1 flex-col bg-sudata-navy/85">
            <div
              className="pointer-events-none absolute inset-0 z-10 opacity-[0.12]"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.22) 2px, rgba(0,240,255,0.22) 4px)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_60px_rgba(0,240,255,0.04)]" />

            <div
              className={`relative z-20 flex justify-center border-b border-sudata-neon/15 bg-sudata-navy/50 scanline-overlay ${expanded ? "py-2 sm:py-4" : "py-2 sm:py-3"}`}
            >
              <div
                className={`chatbot-mascot-float ${loading ? "chatbot-mascot-thinking" : ""}`}
              >
                <div
                  className={`chatbot-mascot-tail relative ${expanded ? "h-12 w-12 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-16 sm:w-16"}`}
                >
                  <img
                    src="/sudino.svg"
                    alt="Sudino"
                    className="chatbot-sudino-img relative z-0 h-full w-full object-contain"
                  />
                  <span
                    className={`chatbot-eye-dot pointer-events-none absolute top-[30%] left-[36%] z-10 h-2 w-2 rounded-full bg-sudata-neon transition-opacity duration-200 sm:top-[31%] sm:left-[37%] ${loading ? "opacity-100" : "opacity-0"}`}
                    aria-hidden
                  />
                  <span
                    className={`chatbot-eye-dot pointer-events-none absolute top-[30%] right-[36%] z-10 h-2 w-2 rounded-full bg-sudata-neon transition-opacity duration-200 sm:top-[31%] sm:right-[37%] ${loading ? "opacity-100" : "opacity-0"}`}
                    aria-hidden
                  />
                </div>
              </div>
            </div>

            <div
              ref={scrollRef}
              className={`scrollbar-hide relative z-20 min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden px-2 py-2 sm:px-3 sm:py-3 ${expanded ? "md:px-6 md:py-4 lg:mx-auto lg:max-w-3xl lg:w-full" : ""}`}
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.role === "user"
                      ? `rounded-xl border border-sudata-neon/35 bg-sudata-neon/10 px-2.5 py-2 text-right font-mono-tech text-sudata-grey text-sm sm:px-3 sm:text-base ${expanded ? "ml-0 sm:ml-8 md:ml-16" : "ml-2 sm:ml-3"}`
                      : `rounded-xl border border-white/15 bg-white/[0.06] px-2.5 py-2 text-left font-mono-tech text-sudata-grey text-sm sm:px-3 sm:text-base ${expanded ? "mr-0 sm:mr-8 md:mr-16" : "mr-2 sm:mr-3"}`
                  }
                >
                  <span className="whitespace-pre-wrap break-words">{m.text}</span>
                </div>
              ))}
              {loading && (
                <div
                  className={`flex items-center gap-2 rounded-xl border border-sudata-neon/25 bg-white/[0.06] px-2.5 py-2 font-mono-tech text-sm text-sudata-grey sm:px-3 sm:text-base ${expanded ? "mr-0 sm:mr-8" : "mr-2 sm:mr-3"}`}
                >
                  <span className="inline-flex gap-0.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sudata-neon [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sudata-neon [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sudata-neon [animation-delay:300ms]" />
                  </span>
                  <span className="text-xs tracking-wide text-sudata-neon/90">
                    Sudino is thinking...
                  </span>
                </div>
              )}
            </div>

            <div
              className={`relative z-20 border-t border-white/10 bg-sudata-navy/90 backdrop-blur-sm ${expanded ? "p-2 sm:p-3 md:pb-[max(0.75rem,env(safe-area-inset-bottom))]" : "p-2 sm:p-2.5"}`}
            >
              <div
                className={`flex gap-2 ${expanded ? "md:mx-auto md:max-w-3xl" : ""}`}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={loading}
                  placeholder=">_ Type a message..."
                  className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-sudata-neon/35 bg-sudata-navy/80 px-3 py-2 font-mono-tech text-base leading-normal text-sudata-grey placeholder:text-sudata-grey/40 outline-none transition focus:border-sudata-neon/70 focus:ring-1 focus:ring-sudata-neon/30"
                  autoComplete="off"
                  enterKeyHint="send"
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={loading || !input.trim()}
                  className="chatbot-send-btn shrink-0 rounded-xl border border-sudata-neon/50 bg-sudata-neon px-3 py-2 font-mono-tech text-xs font-bold text-sudata-navy shadow-[0_0_16px_rgba(0,240,255,0.35)] transition hover:bg-[#70FFFF] hover:shadow-[0_0_24px_rgba(0,240,255,0.45)] disabled:opacity-40 disabled:shadow-none sm:px-4"
                >
                  SEND
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Launcher — hidden while drawer open */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="chatbot-ui pointer-events-auto fixed right-3 z-[69] flex h-14 w-14 items-center justify-center rounded-full border border-sudata-neon/50 bg-sudata-navy/90 shadow-[0_0_20px_rgba(0,240,255,0.35)] backdrop-blur-md transition hover:border-sudata-neon hover:shadow-[0_0_28px_rgba(0,240,255,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sudata-neon sm:right-4"
          style={{ bottom: dockBottom }}
          aria-expanded={false}
          aria-label="Open Sudino chat"
        >
          <img src="/sudino.svg" alt="" className="h-9 w-9 object-contain" />
        </button>
      )}
    </>
  );
}
