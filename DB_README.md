## Database (Prisma + PostgreSQL)

This repo uses **Prisma ORM** with a **PostgreSQL** database (currently Supabase).

For the Astro-specific "call the API route to fetch data" approach, see:
https://www.prisma.io/docs/guides/frameworks/astro#34-fetch-the-data-from-the-api-route-recommended-method

---

## Key files

- Prisma config: `prisma.config.ts`
- Prisma schema (source of truth): `prisma/schema.prisma`
- Prisma generated client types (do not edit): `prisma/generated/*`
- Seed script: `prisma/seed.ts`
- Prisma client wrapper for runtime usage: `src/lib/prisma.ts`
- Example API route (querying data): `src/pages/api/users.ts`

---

## Environment variables

Prisma CLI commands require a connection string intended for direct connections (not pooled).
Your app code requires a connection string available at runtime.

- `DATABASE_URL` (app/runtime; used by `src/lib/prisma.ts`)
- `DIRECT_URL` (Prisma CLI; used by `prisma.config.ts` for migrations + seeding)

Notes:

- When `prisma migrate dev` runs and triggers the seed, `prisma/seed.ts` reads `DATABASE_URL` via `process.env.DATABASE_URL`.
- So for migration+seed workflows you typically need both `DIRECT_URL` and `DATABASE_URL` set.
- For local development, `DIRECT_URL` can usually be the same as `DATABASE_URL` (unless your host requires a separate direct-connection URL).
- `.env` files are ignored by git (`.gitignore` includes `.env` and `/.env.production`).
- Ensure your hosting environment (e.g. Vercel/Supabase integration) provides `DATABASE_URL` (and `DIRECT_URL` if you run migrations as part of CI).

---

## Current example schema (models)

`prisma/schema.prisma` currently defines:

- `User`
  - `id` (Int, primary key, auto-increment)
  - `email` (String, unique)
  - `name` (String, optional)
  - relation: `posts Post[]`
- `Post`
  - `id` (Int, primary key, auto-increment)
  - `title` (String)
  - `content` (String, optional)
  - `published` (Boolean, default `false`)
  - `authorId` (Int; foreign key to `User.id`)
  - relation: `author User`

---

## Add / change tables (the workflow colleagues should follow)

1. Edit `prisma/schema.prisma`
   - Add new `model`s and/or relations.
   - Prefer explicit relation fields (e.g. `authorId` + `author` + `@relation(...)`) so migrations are predictable.
2. Create a migration and apply it to your local DB
   - Run:
     ```sh
     npx prisma migrate dev --name <your_migration_name>
     ```
   - Make sure `DIRECT_URL` is set before running this command.
3. Prisma will generate updated client types
   - Your Prisma generator outputs to `prisma/generated`.
   - (The generated output is ignored by git; it is produced by Prisma.)
4. (Optional) Update seed data
   - Edit `prisma/seed.ts` if you want new records after migrations.
   - Your `prisma.config.ts` is configured with:
     - `migrations.seed = "tsx prisma/seed.ts"`
   - This means `prisma migrate dev` will run the seed by default (per Prisma's behavior).

### If you only want to generate types (no migration)

```sh
npx prisma generate
```

---

## Helpful Prisma npm scripts

Instead of typing `npx` commands each time, you can use the npm scripts defined in `package.json`:

- `npm run prisma:migrate` – runs `prisma migrate dev` against the database in `DIRECT_URL`
- `npm run prisma:generate` – runs `prisma generate` to regenerate the client/types
- `npm run prisma:studio` – opens Prisma Studio to inspect/edit data

Example with a custom migration name:

```sh
npm run prisma:migrate -- --name add-new-table
```

---

## Querying data in Astro (recommended approach)

Recommended pattern in this repo:

- Create/update an Astro API route under `src/pages/api/*`
- Import the shared Prisma instance from `src/lib/prisma.ts`
- Query Prisma models (`prisma.user`, `prisma.post`, etc.)
- Return JSON from the API route

### Example: API route querying `User` + `posts`

File: `src/pages/api/users.ts`

It uses:

- `import prisma from "../../lib/prisma";`
- `prisma.user.findMany({ include: { posts: true } })`

---

## Using Prisma types in pages (for safer TS)

When consuming API data in an Astro page, you can import Prisma-generated types.

Example pattern (adjust imports/paths as needed):

```astro
---
import type { User, Post } from "../../prisma/generated/client";
import { GET } from "./api/users.ts";

type UserWithPosts = User & { posts: Post[] };

const response = await GET(Astro);
const users: UserWithPosts[] = await response.json();
---

<html lang="en">
  <body>
    <ul>
      {users.map((user: UserWithPosts) => (
        <li>
          <h2>{user.name}</h2>
          <ul>
            {user.posts.map((post: Post) => (
              <li>{post.title}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  </body>
</html>
```

---

## Seed script details (seed used for testing)

`prisma/seed.ts` currently:

- Creates an adapter + `PrismaClient` (similar to the runtime pattern)
- Seeds `User` (by `email`) using `upsert`
- Seeds related `Post` records via nested writes (`posts.create`)

When adding models, keep seed scripts in sync if you rely on reference data for dev/testing.

---

## Do not edit these by hand (unless you have a specific reason)

- `prisma/generated/*` (generated code/types)
- SQL inside `prisma/migrations/*` (let Prisma generate migrations from `schema.prisma`)
