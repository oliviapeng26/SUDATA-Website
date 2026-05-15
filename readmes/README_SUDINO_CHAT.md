# Sudino chat: Gemini API setup

Sudino uses **Google’s hosted Gemini API only** (no local or self-hosted models). The route **`src/pages/api/chat.ts`** calls the **Generative Language API** (`gemini-3-flash`). **`GEMINI_API_KEY`** is **server-only** and must not ship in client-side bundles.

**Context retrieval** merges **`src/data/sudata-context.md`** with **monthly calendar chunks** parsed from **`src/data/events.json`** (the same dataset as **`/events`**). Updating the calendar file updates Sudino automatically after restart.

## Where to put your key

| Environment | What to do |
|-------------|------------|
| **Local dev** | Run **`npm run dev`** or **`npm run env:setup`** — a **`.env`** is created from **`.env.example`** if missing. Paste your key on **`GEMINI_API_KEY=`** and restart dev. |
| **Production** | Set **`GEMINI_API_KEY`** in your deploy platform’s secret/environment variables. Do not paste the key into any committed file. |

If the key is missing or empty, the API returns **`503`** with *“Chat is not configured…”* until you fix the env.

## After pasting the key

1. Save `.env` in the project root.
2. **Restart** the dev server (`Ctrl+C`, then `npm run dev`). Astro reads `.env` when the process starts.
3. Open the site, use the Sudino panel, send a message.

## Get a Gemini API key

1. Open [Google AI Studio – API keys](https://aistudio.google.com/apikey).
2. Create an API key and ensure billing / quotas allow use of the Generative Language API if your account requires it.
3. Paste the key into **`.env`** as `GEMINI_API_KEY=...`.

## Troubleshooting

- **Still “not configured”** — Wrong filename (must be `.env` at repo root), typo in `GEMINI_API_KEY`, or dev server not restarted.
- **HTTP errors from Gemini** — API not enabled for the key, quota/billing, or model access; the chat UI now shows a short `detail` line from Google when the server returns one. If a model is not found for your project, set **`GEMINI_MODEL`** in `.env` (for example `gemini-2.5-flash`) and restart dev.

## Reference

- API route: `src/pages/api/chat.ts`
- Env typing: `src/env.d.ts` (`GEMINI_API_KEY`)
