import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Default path to the SUDATA markdown knowledge base (next to this file: `src/data/`). */
export const DEFAULT_KB_PATH = join(__dirname, "../data/sudata-context.md");

/** Canonical events calendar synced with `/events` in this codebase. */
export const DEFAULT_EVENTS_PATH = join(__dirname, "../data/events.json");

export type ContextChunk = {
  /** Stable id for merging sources (markdown + calendar) */
  index: number;
  /** Markdown heading line without leading `#`, or `(preamble)` for text before the first `##` */
  heading: string;
  /** Chunk body (markdown), excluding the heading line */
  body: string;
  /** Heading + body for LLM injection */
  text: string;
};

export type RetrieveOptions = {
  /** Maximum chunks to return after ranking (default: 5) */
  maxChunks?: number;
  /** Minimum keyword overlap score to include (default: 1) */
  minScore?: number;
};

const MONTH_LOOKUP: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

/** Match longest month tokens first (“september” before “sep”). */
const MONTH_TERMS_SORTED = Object.keys(MONTH_LOOKUP).sort((a, b) => b.length - a.length);

const GENERIC_EVENTS_QUERY =
  /\b(events?|calendar|schedule|what(?:'s|\s+is)\s+on|happening|upcoming|this\s+semester|hackathon|datathon|workshops?)\b/i;

let cachedRaw: string | null = null;
let cachedPath: string | null = null;

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((t) => t.length > 1);
}

/**
 * Split markdown into chunks at level-2 headings (`## ` at line start).
 * The preamble before the first `##` is one chunk with heading `(preamble)`.
 */
export function chunkMarkdown(markdown: string): ContextChunk[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const chunks: ContextChunk[] = [];
  let currentHeading = "(preamble)";
  let currentBody: string[] = [];
  let chunkIndex = 0;

  function flush() {
    let body = currentBody.join("\n").trim();
    body = body.replace(/\n---\s*$/s, "").trim();
    if (!body) return;
    const text =
      currentHeading === "(preamble)"
        ? body
        : `## ${currentHeading}\n\n${body}`;
    chunks.push({
      index: chunkIndex++,
      heading: currentHeading,
      body,
      text,
    });
  }

  for (const line of lines) {
    if (line.startsWith("## ") && !line.startsWith("###")) {
      flush();
      currentHeading = line.slice(3).trim();
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  flush();
  return chunks;
}

function scoreChunk(queryTokens: Set<string>, chunk: ContextChunk): number {
  const headingTokens = new Set(tokenize(chunk.heading));
  const bodyTokens = tokenize(chunk.body);
  let score = 0;
  for (const q of queryTokens) {
    if (headingTokens.has(q)) score += 3;
  }
  const bodySet = new Set(bodyTokens);
  for (const q of queryTokens) {
    if (bodySet.has(q)) score += 1;
  }
  return score;
}

type EventRow = {
  title: string;
  date: string;
  time?: string;
  venue?: string;
  type?: string;
  description?: string;
  collaborators?: string[];
  catering?: string;
  signupLink?: string;
};

function isValidEventRow(x: unknown): x is EventRow {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.title === "string" && typeof o.date === "string";
}

/** Public for tests — load `events.json` rows only. */
export function loadCalendarEvents(eventsPath: string = DEFAULT_EVENTS_PATH): EventRow[] {
  try {
    const raw = readFileSync(eventsPath, "utf-8");
    const data = JSON.parse(raw) as { events?: unknown };
    if (!Array.isArray(data.events)) return [];
    return data.events.filter(isValidEventRow);
  } catch {
    return [];
  }
}

function ymKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function parseEventMidday(ev: EventRow): Date | null {
  const d = new Date(`${ev.date}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function calendarHeading(year: number, month: number): string {
  const labels = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `Calendar: ${labels[month - 1]} ${year}`;
}

function formatSignup(line: string | undefined): string {
  if (line === undefined || line.trim() === "" || /^tba$/i.test(line.trim()))
    return "Registration link: TBA in calendar data.";
  return `Registration/signup: ${line.trim()}`;
}

function formatEventRow(ev: EventRow): string {
  const parsed = parseEventMidday(ev);
  const pretty = parsed
    ? parsed.toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : ev.date;

  const time = ev.time && String(ev.time).trim() ? String(ev.time).trim() : "Time TBA";
  const venue = ev.venue && String(ev.venue).trim() ? String(ev.venue).trim() : "Venue TBA";
  const type = ev.type ? String(ev.type) : "event";
  const collab =
    Array.isArray(ev.collaborators) && ev.collaborators.length
      ? `Collaborators: ${ev.collaborators.join(", ")}.`
      : "";
  const cater = ev.catering && String(ev.catering).trim() ? ` Catering: ${ev.catering.trim()}.` : "";
  const desc = ev.description?.trim()
    ? ` ${ev.description.trim()}`
    : "";

  const lines = [
    `- **${ev.title.trim()}**`,
    `  - **When:** ${pretty}, ${time} (${type})`,
    `  - **Where:** ${venue}.${cater}`,
    `${collab ? `  - ${collab}` : ""}`,
    `  - ${formatSignup(ev.signupLink)}`,
    desc ? `  - **About:** ${desc}` : "",
  ].filter(Boolean);

  return lines.join("\n");
}

/**
 * Monthly calendar chunks sourced from repo `events.json` (same feed as `/events`).
 */
export function chunksFromCalendarEvents(events: EventRow[], indexBase = 10_000): ContextChunk[] {
  const grouped = new Map<string, EventRow[]>();

  for (const ev of events) {
    const d = parseEventMidday(ev);
    if (!d) continue;
    const key = ymKey(d.getFullYear(), d.getMonth() + 1);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(ev);
  }

  const sortedKeys = [...grouped.keys()].sort();
  const chunks: ContextChunk[] = [];
  let i = indexBase;

  for (const key of sortedKeys) {
    const [yStr, mStr] = key.split("-");
    const year = Number(yStr);
    const month = Number(mStr);
    if (!month || month < 1 || month > 12) continue;

    const list = grouped.get(key)!;
    list.sort((a, b) => a.date.localeCompare(b.date));

    const heading = calendarHeading(year, month);
    const body = [`Events in this site's calendar (${key}):\n`, ...list.map(formatEventRow)].join(
      "\n",
    );

    chunks.push({
      index: i++,
      heading,
      body,
      text: `## ${heading}\n\n${body}`,
    });
  }

  return chunks;
}

/** Parse an explicit calendar month/year from the user's question (e.g. May → current year unless a year appears). */
export function parseCalendarMonthYear(
  query: string,
  now: Date = new Date(),
): { year: number; month: number } | null {
  const q = query.toLowerCase();
  const yearMatch = q.match(/\b(20\d{2})\b/);
  const inferredYear = yearMatch ? Number(yearMatch[1]) : now.getFullYear();

  for (const term of MONTH_TERMS_SORTED) {
    const rx = new RegExp(`\\b${escapeRx(term)}\\b`, "i");
    if (rx.test(query)) {
      return { year: inferredYear, month: MONTH_LOOKUP[term]! };
    }
  }
  return null;
}

function escapeRx(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function forceChunkForMonth(
  chunks: ContextChunk[],
  year: number,
  month: number,
): ContextChunk | undefined {
  const h = calendarHeading(year, month);
  return chunks.find((c) => c.heading === h);
}

/** When the query is vaguely about “events” but names no month — include upcoming months from the repo calendar. */
function forceUpcomingCalendarChunks(
  query: string,
  eventChunks: ContextChunk[],
  events: EventRow[],
  now: Date,
): ContextChunk[] {
  if (!GENERIC_EVENTS_QUERY.test(query.trim())) return [];
  if (parseCalendarMonthYear(query, now)) return [];

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const ordered = [...events]
    .map((e) => ({ e, d: parseEventMidday(e) }))
    .filter((x): x is { e: EventRow; d: Date } => x.d !== null)
    .filter(({ d }) => d >= startOfMonth)
    .sort((a, b) => a.e.date.localeCompare(b.e.date));

  const monthKeys: string[] = [];
  const seen = new Set<string>();
  const maxMonths = 4;

  for (const { e, d } of ordered) {
    const mk = ymKey(d.getFullYear(), d.getMonth() + 1);
    if (seen.has(mk)) continue;
    seen.add(mk);
    monthKeys.push(mk);
    if (monthKeys.length >= maxMonths) break;
  }

  const out: ContextChunk[] = [];
  for (const mk of monthKeys) {
    const [y, m] = mk.split("-").map(Number);
    const c = forceChunkForMonth(eventChunks, y, m);
    if (c) out.push(c);
  }

  return out;
}

function packDedup(forced: ContextChunk[], ranked: { chunk: ContextChunk; score: number }[]): string {
  const seen = new Set<string>();
  const texts: string[] = [];

  const pushChunk = (c: ContextChunk) => {
    const id = `${c.index}\0${c.heading}`;
    if (seen.has(id)) return;
    const t = c.text.trim();
    if (!t) return;
    seen.add(id);
    texts.push(t);
  };

  for (const f of forced) pushChunk(f);
  for (const r of ranked) pushChunk(r.chunk);

  return texts.join("\n\n---\n\n");
}

/**
 * Load and optionally cache the raw markdown file.
 */
export function loadKnowledgeBaseMarkdown(
  path: string = DEFAULT_KB_PATH,
  useCache = true,
): string {
  if (useCache && cachedRaw !== null && cachedPath === path) {
    return cachedRaw;
  }
  const raw = readFileSync(path, "utf-8");
  if (useCache) {
    cachedRaw = raw;
    cachedPath = path;
  }
  return raw;
}

export function clearKnowledgeBaseCache(): void {
  cachedRaw = null;
  cachedPath = null;
}

/**
 * Return chunks ranked by simple keyword overlap between the user query and chunk text.
 * Suitable as lightweight context for an LLM when full vector RAG is not required.
 */
export function retrieveRelevantChunks(
  query: string,
  chunks: ContextChunk[],
  options: RetrieveOptions = {},
): { chunk: ContextChunk; score: number }[] {
  const maxChunks = options.maxChunks ?? 5;
  const minScore = options.minScore ?? 1;
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) {
    return chunks.slice(0, maxChunks).map((chunk) => ({ chunk, score: 0 }));
  }

  const ranked = chunks
    .map((chunk) => ({
      chunk,
      score: scoreChunk(queryTokens, chunk),
    }))
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score || a.chunk.index - b.chunk.index);

  return ranked.slice(0, maxChunks);
}

/**
 * Markdown KB + **`events.json` calendar chunks** merged for retrieval.
 * Month questions (e.g. “what’s on in May”) always receive that month’s **Calendar:** chunk when it exists.
 */
export function getContextForQuery(
  query: string,
  kbPath: string = DEFAULT_KB_PATH,
  options: RetrieveOptions & { eventsPath?: string } = {},
): string {
  const raw = loadKnowledgeBaseMarkdown(kbPath);
  const mdChunks = chunkMarkdown(raw);

  const eventsPath = options.eventsPath ?? DEFAULT_EVENTS_PATH;
  const events = loadCalendarEvents(eventsPath);
  const calChunks = chunksFromCalendarEvents(events);

  const allChunks = [...mdChunks, ...calChunks];
  const now = new Date();

  const forced: ContextChunk[] = [];
  const my = parseCalendarMonthYear(query, now);
  if (my) {
    const hit = forceChunkForMonth(calChunks, my.year, my.month);
    if (hit) forced.push(hit);
  }
  for (const extra of forceUpcomingCalendarChunks(query, calChunks, events, now)) {
    forced.push(extra);
  }

  const maxChunks = options.maxChunks ?? 6;
  const hits = retrieveRelevantChunks(query, allChunks, { ...options, maxChunks });

  if (hits.length === 0) {
    const fallback = retrieveRelevantChunks(query, allChunks, {
      ...options,
      minScore: 0,
      maxChunks: Math.min(5, maxChunks),
    });
    return packDedup(forced, fallback);
  }

  return packDedup(forced, hits);
}
