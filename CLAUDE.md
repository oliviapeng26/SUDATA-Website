# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SUDATA (Sydney University Data Analytics society) website. **Astro 5 in `output: 'server'` mode** (SSR via the Vercel adapter), React 19 islands, Tailwind 3, Prisma 7 + PostgreSQL (Supabase). Dev server runs on **`http://localhost:4321`**.

## Commands

```bash
npm run dev              # ensure-env + prisma generate, then astro dev (port 4321)
npm run build            # prisma generate + astro build
npm run preview          # preview the production build
npm run prisma:migrate   # prisma migrate dev (also runs the seed)
npm run prisma:generate  # regenerate the client into prisma/generated
npm run prisma:studio    # open Prisma Studio
npm run env:setup        # create .env from .env.example if missing (idempotent)
```

There is **no test runner, linter, or formatter configured**. `tsconfig.json` extends `astro/tsconfigs/strict`. Several `src/lib/*.ts` functions (e.g. in `rag.ts`) carry "Public for tests" comments but no test harness exists yet — match that exported-pure-function style if adding tests.

## Environment & secrets

`.env` is gitignored; `predev` auto-creates it from `.env.example` via `scripts/ensure-env.mjs`. Two distinct DB URLs (see `DB_README.md`):
- **`DATABASE_URL`** — pooled, used at runtime by `src/lib/prisma.ts`.
- **`DIRECT_URL`** — direct connection, used by `prisma.config.ts` for migrations/seeding (pooled URLs stall the CLI).

`GEMINI_API_KEY` / `GEMINI_MODEL` are declared in `astro.config.mjs` `env.schema` and consumed via `astro:env/server` (not `process.env`). Other secrets (`ADMIN_PASSWORD`, `AUTH_SECRET`, Instagram tokens) are read via `import.meta.env`.

## Architecture

### Rendering model
Pages are `.astro` files in `src/pages/` (file-based routing). Interactivity comes from React islands hydrated with client directives — note `NetworkLogo`/`DataLogo` use `client:only="react"` because of Three.js. API routes live in `src/pages/api/*.ts` and **must export `export const prerender = false`** or the POST/PUT/DELETE handlers won't run under SSR.

### Data access — never query Prisma from components
Pattern (per `DB_README.md`): client components fetch from an API route, the API route calls a service in `src/services/`, the service uses the singleton in `src/lib/prisma.ts`. The Prisma client is generated to **`prisma/generated/`** (not `node_modules`) and imported from there; treat it as read-only build output. Uses the `@prisma/adapter-pg` driver adapter.

### Admin auth (custom, no library)
`src/middleware.ts` gates two things: admin pages (`/admin`, `/admin/*` except `/admin/login`) and protected writes (`POST/PUT/DELETE` to `/api/event` and `/api/album`). Auth is a stateless HMAC-signed cookie (`admin_session`) implemented by hand in `src/lib/adminAuth.ts` using `node:crypto` (`timingSafeEqual` for comparison). Login checks a plaintext `ADMIN_PASSWORD`; the cookie is signed with `AUTH_SECRET`. When adding a new admin page or a new write endpoint, **update the matchers in `middleware.ts`** — protection is path-based, not automatic.

### Sudino chatbot (RAG over Gemini)
`Chatbot.tsx` → `POST /api/chat` → `src/lib/rag.ts`. The RAG is keyword-overlap retrieval (no embeddings/vector DB) over two sources merged at request time: the markdown KB `src/data/sudata-context.md` and calendar events. The markdown KB is **imported with `?raw`, not read from disk** — serverless bundlers only trace imports, so `readFileSync` of that path ENOENTs in production (see the comment block at the top of `rag.ts`). Calendar events are the **DB `Event` table**: the chat route fetches them via `getFormattedEvents()` and passes them into `getContextForQuery({ events })`, so there is a single source of truth (no `events.json`). Month-specific and generic "what's on" queries force-inject the relevant `Calendar:` chunks. The chat route then calls Google Gemini's REST `generateContent` directly via `fetch` (default model `gemini-3-flash-preview`).

Assistant replies are rendered as markdown in `Chatbot.tsx` (via `marked`); user messages stay plain text. If the DB is unreachable, the chat answers from the markdown KB without calendar context rather than from a stale snapshot.

### Analytics
`/api/track` records `pageview` and `click` events into `PageView` / `LinkClick` tables. It **always returns 2xx and swallows errors** by design — tracking must never break navigation. `/admin/analytics` reads this back.

### Time zones
Events store `time`/`endTime` as `Timestamptz`. Conversion to/from **`Australia/Sydney`** is done explicitly with `Intl.DateTimeFormat` in `src/services/eventService.ts` and `src/pages/api/event.ts` — preserve this when touching event date/time handling; don't rely on the server's local zone.

### Photo albums
DB-backed: `Album`/`AlbumImage` with image bytes stored as `Bytes` in Postgres, managed through `/admin/photos`, read on `/photos` via `getDbAlbums()` in `src/services/albumService.ts`, and served via `/api/album-image`. The old static-bundled album system (`src/assets/albums/*` + `src/lib/albums.ts`) has been removed; `scripts/migrate-albums.ts` is the one-off that moved those into the DB.

## Conventions

- This project predates the global TS/React conventions in some files — **most components are `.jsx`, not `.tsx`**, and use default exports. Newer `src/lib` / `src/services` code is `.ts` with named exports and strict typing. Match the file you're editing; prefer typed named exports for new `lib`/`service`/API code.
- The careers/sponsorships opportunities list is file-based: `scripts/convertOpportunitiesExcelToJson.py` converts `src/data/opportunities_template.xlsx` → `src/data/opportunities.json`, read at build time by `src/pages/careers.astro`. Events are **not** file-based — they live in the DB (see the chatbot/data-access notes above).
- Topic-specific docs live in `readmes/` (calendar, iCal subscription, photos, pie chart, Sudino chat) and `DB_README.md` — consult these before changing those subsystems.

## Design system (from README)

Cyberpunk/retro aesthetic. Primary neon blue `#00F0FF`, deep navy bg `#020617`, grey text `#94a3b8`. Icons use **pixelarticons** — always apply `image-rendering: pixelated` to SVGs. Some brand icons (Instagram, brain/"Hub") are hand-authored pixel SVG paths because v1.8.1 lacks them.
