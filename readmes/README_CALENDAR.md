# Events Calendar

## Events page

Events are managed in the **admin dashboard** (`/admin/events`) and stored in the **Postgres database** (Prisma `Event` model). The `/events` page, the iCal feed (`/api/calendar.ics`), and Sudino's chat all read from the database — it is the single source of truth, so there is no JSON file or import step to run.

Event fields (see `prisma/schema.prisma` → `model Event`):

- `title`, `venue`, `type`, `signupLink`, `catering`, `description`
- `date`: event date
- `time`: start time; `endTime`: optional end time
- `collaborators`: `String[]`
- `image_data` / `mime_type`: optional event image stored in the DB

## Careers/Sponsorships page

Opportunities are **not** in the database — they are file-based. Fill in `src/data/opportunities_template.xlsx`, then convert:

```bash
python3 scripts/convertOpportunitiesExcelToJson.py src/data/opportunities_template.xlsx src/data/opportunities.json
```

`src/data/opportunities.json` is read at build time by `src/pages/careers.astro` (the page is prerendered), so rebuild/redeploy after updating it.
