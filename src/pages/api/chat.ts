import type { APIRoute } from "astro";
import { getContextForQuery } from "../../lib/rag";

/** Required: static builds would not run POST handlers without this on-demand route. */
export const prerender = false;

/** Google REST model id (see https://ai.google.dev/gemini-api/docs/models ). Override with GEMINI_MODEL in .env if needed. */
const GEMINI_MODEL =
  String(import.meta.env.GEMINI_MODEL ?? "").trim() || "gemini-3-flash-preview";

function geminiGenerateUrl(apiKey: string): string {
  const base = "https://generativelanguage.googleapis.com/v1beta/models";
  return `${base}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

const SYSTEM_PROMPT = `You are Sudino, the friendly mascot of SUDATA (Sydney University Data Analytics society at USYD). You are a data-loving dinosaur: warm, curious, and genuinely helpful to students.

Voice and style:
- Tech-savvy and enthusiastic about data, learning, and the society's events.
- A slight "old web" hacker vibe: subtle >_ cues and short lines are fine; never mimic fake system banners like "SCANNING_CALENDAR" or fabricated statuses such as NO_ENTRIES_FOUND.
- Keep slang light; stay professional enough for uni students asking real questions.

Facts and grounding (critical):
- The **Retrieved context** block is scraped from THIS repository — markdown knowledge plus the same **calendar JSON** used by the site's /events page. Treat it as the primary source for event lists, titles, venues, collaborators, catering, dates, times, and signup links when rows are present.
- When calendar rows exist for the timeline the user asks about, **summarise them directly** (titles, ISO dates spelled in plain English, venues, collaborators, what to expect). You may briefly mention signup links listed there; avoid telling people to open sudata.com.au instead of answering when the context already enumerates entries.
- If the context truly lacks that month/topic after checking **Calendar:** sections and society FAQ, admit the gap plainly and THEN suggest instagram @usyd.sudata — not as default boilerplate before using the retrieved rows.
- The **usu.edu.au** membership page and **Instagram** still apply for live benefit/pricing tweaks that change outside the codebase.

Answer concisely unless the user asks for detail.`;

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { code?: number; message?: string; status?: string };
};

function extractMessage(request: Request, rawBody: string): string | null {
  const trimmed = rawBody.trim();
  if (!trimmed) return null;

  const ct = (request.headers.get("content-type") ?? "").toLowerCase();

  if (ct.includes("application/json")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "message" in parsed &&
        typeof (parsed as { message: unknown }).message === "string"
      ) {
        return (parsed as { message: string }).message.trim();
      }
    } catch {
      return null;
    }
    return null;
  }

  if (ct.includes("application/x-www-form-urlencoded")) {
    try {
      const params = new URLSearchParams(trimmed);
      const msg = params.get("message");
      return msg ? msg.trim() : null;
    } catch {
      return null;
    }
  }

  if (ct.includes("text/plain")) {
    return trimmed;
  }

  // No/surprise Content-Type (some clients omit it): try JSON, then treat as plain text
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "message" in parsed &&
      typeof (parsed as { message: unknown }).message === "string"
    ) {
      return (parsed as { message: string }).message.trim();
    }
  } catch {
    /* not JSON */
  }

  return trimmed;
}

function extractGeminiText(data: GeminiGenerateContentResponse): string | null {
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts?.length) return null;
  const texts = parts.map((p) => p.text).filter((t): t is string => typeof t === "string");
  if (texts.length === 0) return null;
  return texts.join("");
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  if (apiKey === undefined || apiKey === null || String(apiKey).trim() === "") {
    return new Response(
      JSON.stringify({
        error:
          "Chat is not configured: set GEMINI_API_KEY in your environment (e.g. `.env`).",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return new Response(
      JSON.stringify({
        error: "Could not read request body",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const message = extractMessage(request, raw);

  if (message === null || message === "") {
    return new Response(
      JSON.stringify({
        error:
          'Expected a JSON body like {"message":"your question"} or text/plain with the question.',
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let context: string;
  try {
    context = getContextForQuery(message, undefined, { maxChunks: 10 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load knowledge base";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const systemInstructionText = `${SYSTEM_PROMPT}

### Retrieved context (SUDATA knowledge base — use to ground answers)
${context}`;

  const userText = `### User message
${message}

### Sudino (reply now, in character):`;

  const geminiBody = {
    systemInstruction: {
      parts: [{ text: systemInstructionText }],
    },
    contents: [
      {
        role: "user" as const,
        parts: [{ text: userText }],
      },
    ],
  };

  let geminiRes: Response;
  try {
    geminiRes = await fetch(geminiGenerateUrl(String(apiKey)), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: "Could not reach the Gemini API. Check your network and try again.",
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const rawBodyText = await geminiRes.text();
  let data: GeminiGenerateContentResponse;
  try {
    data = JSON.parse(rawBodyText) as GeminiGenerateContentResponse;
  } catch {
    return new Response(
      JSON.stringify({
        error: "Invalid JSON from Gemini API",
        detail: rawBodyText.slice(0, 500),
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!geminiRes.ok) {
    const err = data.error;
    const upstreamMsg =
      err?.message ?? geminiRes.statusText ?? `HTTP ${geminiRes.status}`;
    const isRateLimited =
      geminiRes.status === 429 ||
      err?.code === 429 ||
      err?.status === "RESOURCE_EXHAUSTED";

    return new Response(
      JSON.stringify({
        error: isRateLimited
          ? "The AI service is rate-limited right now. Please wait a moment and try again."
          : "Gemini API request failed.",
        detail: upstreamMsg.slice(0, 500),
      }),
      {
        status: isRateLimited ? 429 : 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const text = extractGeminiText(data);

  if (text === null || text === "") {
    return new Response(
      JSON.stringify({
        error: "Gemini response missing text in candidates[0].content.parts",
        detail: rawBodyText.slice(0, 500),
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({ text }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
