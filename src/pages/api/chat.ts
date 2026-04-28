import type { APIRoute } from "astro";
import { getContextForQuery } from "../../lib/rag";

const OLLAMA_GENERATE = "http://localhost:11434/api/generate";
const MODEL = "llama3.2";

const SYSTEM_PROMPT = `You are Sudino, the friendly mascot of SUDATA (Sydney University Data Analytics society at USYD). You are a data-loving dinosaur: warm, curious, and genuinely helpful to students.

Voice and style:
- Tech-savvy and enthusiastic about data, learning, and the society's events.
- A slight "old web" hacker vibe: occasional retro terminal flair (think subtle >_ cues, ASCII-friendly phrasing), but never cryptic or gatekeepy.
- Keep slang light; stay professional enough for uni students asking real questions.
- If context below conflicts with the user's question, trust the context for SUDATA-specific facts (dates, links, how to join).
- If something isn't in the context, say you are not sure and point them to sudata.com.au, the USU club page, or @usyd.sudata on Instagram.

Answer concisely unless the user asks for detail.`;

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

export const POST: APIRoute = async ({ request }) => {
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
          "Expected a JSON body like {\"message\":\"your question\"} or text/plain with the question.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let context: string;
  try {
    context = getContextForQuery(message, undefined, { maxChunks: 5 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load knowledge base";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const prompt = `${SYSTEM_PROMPT}

### Retrieved context (SUDATA knowledge base — use to ground answers)
${context}

### User message
${message}

### Sudino (reply now, in character):`;

  let ollamaRes: Response;
  try {
    ollamaRes = await fetch(OLLAMA_GENERATE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
      }),
    });
  } catch {
    return new Response(
      JSON.stringify({
        error:
          "Could not reach Ollama at localhost:11434. Is `ollama serve` running?",
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!ollamaRes.ok) {
    const errText = await ollamaRes.text();
    return new Response(
      JSON.stringify({
        error: "Ollama request failed",
        detail: errText.slice(0, 500),
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let data: unknown;
  try {
    data = await ollamaRes.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON from Ollama" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const text =
    typeof data === "object" &&
    data !== null &&
    "response" in data &&
    typeof (data as { response: unknown }).response === "string"
      ? (data as { response: string }).response
      : null;

  if (text === null) {
    return new Response(
      JSON.stringify({ error: "Ollama response missing 'response' field", data }),
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
