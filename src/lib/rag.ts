import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Default path to the SUDATA markdown knowledge base (next to this file: `src/data/`). */
export const DEFAULT_KB_PATH = join(__dirname, "../data/sudata-context.md");

export type ContextChunk = {
  /** Zero-based index in document order */
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
    // Drop a trailing markdown horizontal rule often used between ## sections in the source file.
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

/**
 * Load and optionally cache the raw markdown file.
 */
export function loadKnowledgeBaseMarkdown(
  path: string = DEFAULT_KB_PATH,
  useCache = true
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
  options: RetrieveOptions = {}
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
 * End-to-end: load KB file, chunk, and retrieve top sections for a query.
 */
export function getContextForQuery(
  query: string,
  kbPath: string = DEFAULT_KB_PATH,
  options: RetrieveOptions = {}
): string {
  const raw = loadKnowledgeBaseMarkdown(kbPath);
  const chunks = chunkMarkdown(raw);
  const hits = retrieveRelevantChunks(query, chunks, options);
  const pack = (list: typeof hits) => {
    const seen = new Set<number>();
    const texts: string[] = [];
    for (const h of list) {
      const t = h.chunk.text.trim();
      if (!t || seen.has(h.chunk.index)) continue;
      seen.add(h.chunk.index);
      texts.push(t);
    }
    return texts.join("\n\n---\n\n");
  };
  if (hits.length === 0) {
    const fallback = retrieveRelevantChunks(query, chunks, {
      ...options,
      minScore: 0,
      maxChunks: options.maxChunks ?? 3,
    });
    return pack(fallback);
  }
  return pack(hits);
}
