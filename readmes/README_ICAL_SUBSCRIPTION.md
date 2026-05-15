# iCalendar Subscription Feed

A live, subscribable calendar feed that lets SUDATA members add all events directly to Apple Calendar, Google Calendar, Outlook, or any standards-compliant calendar app. Once subscribed, new events added through the admin panel appear automatically — no re-importing needed.

---

## How it works (end to end)

```
Admin adds event via /admin/events
         ↓
Event saved to PostgreSQL (Supabase) via existing API

Member visits /events page
         ↓
Clicks "Subscribe to Calendar" → chooses Apple / Google / Copy URL
         ↓
Calendar app subscribes to https://sudata-website.vercel.app/api/calendar.ics
         ↓
Every ~2 hours the calendar app re-polls that URL automatically
         ↓
/api/calendar.ics queries the database and returns a fresh iCal feed
         ↓
New events appear in the member's calendar with zero manual steps
```

---

## Files changed

### Created

| File | Purpose |
|------|---------|
| `src/pages/api/calendar.ics.ts` | API route — generates the live iCal feed |
| `src/components/CalendarSubscribe.tsx` | React component — "Subscribe to Calendar" button with dropdown |
| `.vscode/settings.json` | Tells VSCode to use the workspace TypeScript (fixes red squiggly on `tsconfig.json`) |

### Modified

| File | What changed |
|------|-------------|
| `src/pages/events.astro` | Added `CalendarSubscribe` import and placed the button on the page |
| `src/env.d.ts` | Added `PUBLIC_SITE_URL` to `ImportMetaEnv` so TypeScript knows about the env var |
| `.env` | Added `PUBLIC_SITE_URL`, `DATABASE_URL`, `DIRECT_URL`, `ADMIN_PASSWORD`, `AUTH_SECRET` entries |

---

## File details

### `src/pages/api/calendar.ics.ts`

An Astro API route that serves an RFC 5545-compliant iCalendar feed at `/api/calendar.ics`.

**What it does:**
- Queries `prisma.event.findMany()` for all events from January 1 of the current year onwards, ordered by date ascending
- Builds a valid `VCALENDAR` string with one `VEVENT` block per event
- Returns `Content-Type: text/calendar; charset=utf-8` with a 2-hour cache header

**Field mapping from the `Event` Prisma model:**

| Prisma field | iCal property | Notes |
|---|---|---|
| `id` | `UID` | Format: `sudata-{id}@sudata-website.vercel.app` — stable and globally unique |
| `time` | `DTSTART` | The `Timestamptz` field that holds the full event datetime |
| `time + 1hr` | `DTEND` | No end time in the schema, so all events default to 1 hour duration |
| `title` | `SUMMARY` | Text-escaped |
| `description` | `DESCRIPTION` | Only included if non-empty |
| `venue` | `LOCATION` | Only included if non-empty |
| `signupLink` | `URL` | Only included if it starts with `http://` or `https://` — "TBA" and blank values are skipped to keep the feed valid |

**RFC 5545 compliance rules implemented:**
- Line endings: `\r\n` (CRLF) everywhere including the final line
- Line folding: lines longer than 75 characters are split with `\r\n ` (CRLF + single space)
- Text escaping: `,` → `\,` — `;` → `\;` — `\n` → `\\n` — `\` → `\\`
- Timestamps: UTC format `YYYYMMDDTHHmmssZ`

**Calendar metadata headers in the feed:**
```
PRODID:-//Sydney University Data Society//SUDATA Events//EN
X-WR-CALNAME:SUDATA Events
X-WR-CALDESC:Events from the Sydney University Data Society
X-WR-TIMEZONE:Australia/Sydney
X-PUBLISHED-TTL:PT2H
```

**Response headers:**
```
Content-Type: text/calendar; charset=utf-8
Cache-Control: public, max-age=7200, s-maxage=7200
Content-Disposition: inline; filename="sudata-events.ics"
```

---

### `src/components/CalendarSubscribe.tsx`

A React component (`client:load`) that renders the "Subscribe to Calendar" button and dropdown.

**Three subscription options:**

| Option | Behaviour | Works locally? |
|--------|-----------|---------------|
| Apple Calendar | Creates a hidden `<a href="webcal://...">` and clicks it — macOS intercepts the scheme and opens Calendar.app | Yes |
| Google Calendar | Opens `google.com/calendar/render?cid=webcal://...` in a new tab | No — Google's servers can't reach `localhost`. Greyed out with a note. Works after deployment. |
| Copy calendar URL | Copies the `https://` feed URL to clipboard. Shows "Link copied!" + check icon for 2 seconds. | Yes |

**URL construction (module-level constants):**
```typescript
const SITE_URL  = import.meta.env.PUBLIC_SITE_URL ?? "https://sudata-website.vercel.app";
const ICS_URL   = `${SITE_URL}/api/calendar.ics`;
const WEBCAL_URL = ICS_URL.replace(/^https?:\/\//, "webcal://");
const GOOGLE_URL = `https://www.google.com/calendar/render?cid=${encodeURIComponent(WEBCAL_URL)}`;
const IS_LOCAL   = SITE_URL.includes("localhost") || SITE_URL.includes("127.0.0.1");
```

**Accessibility:** `aria-expanded`, `aria-haspopup="true"`, `role="menu"`, `role="menuitem"` on all interactive elements.

**Click-outside close:** `useRef` + `useEffect` with a `mousedown` listener on `document`.

**Styling:** Matches the SUDATA cyberpunk aesthetic — neon `#00F0FF` border/text, neon glow `filter: drop-shadow`, dark navy dropdown. Uses existing Tailwind tokens (`border-sudata-neon`, `text-sudata-neon`, `bg-sudata-navy`, `text-sudata-grey`) and the `font-mono-tech` class from `global.css`. All icons are inline SVG with `imageRendering: "pixelated"`.

---

### `src/pages/events.astro`

Two additions only — nothing existing was changed:

**Import added to frontmatter:**
```astro
import CalendarSubscribe from '../components/CalendarSubscribe';
```

**Button placed between subtitle and Upcoming Events section:**
```astro
<!-- Calendar subscription button -->
<div class="flex justify-center mb-6">
  <CalendarSubscribe client:load />
</div>
```

---

## Environment variables

### `PUBLIC_SITE_URL`

Controls what URL the subscribe button generates. The `PUBLIC_` prefix is Astro's convention for variables that are safe to expose to client-side code (`import.meta.env.PUBLIC_*`).

| Environment | Value |
|-------------|-------|
| Local dev | `http://localhost:4321` |
| Production (Vercel) | `https://sudata-website.vercel.app` |

**Local `.env`:**
```
# Local dev: http://localhost:4321  |  Production: https://sudata-website.vercel.app
PUBLIC_SITE_URL=http://localhost:4321
```

**For production**, set `PUBLIC_SITE_URL=https://sudata-website.vercel.app` in the Vercel dashboard under **Settings → Environment Variables**. This is the recommended approach — the `.env` file is gitignored and is only for local development.

---

## Deploying to production

1. Push the branch to GitHub — Vercel picks it up automatically.
2. In the Vercel dashboard, add the environment variable:
   - `PUBLIC_SITE_URL` = `https://sudata-website.vercel.app`
3. After deployment, all three subscription options (Apple Calendar, Google Calendar, Copy URL) will work fully.
4. The feed URL is: `https://sudata-website.vercel.app/api/calendar.ics`

---

## How the date filter works

The feed shows all events from **January 1 of the current year** onwards. This means:

- Subscribers see the full year's programme when they subscribe (including past events from earlier in the semester)
- Future events appear as soon as they're added in the admin panel (within the 2-hour cache window)
- On January 1 each year, the feed automatically shifts to show that year's events

If you ever need to change this window, edit the filter in `src/pages/api/calendar.ics.ts`:
```typescript
const startOfYear = new Date(new Date().getFullYear(), 0, 1);
```

---

## No new dependencies

The entire feature — iCal generation, React dropdown, URL handling — was built using only packages already in `package.json`. No `ical-generator`, `node-ical`, or similar library was added.
