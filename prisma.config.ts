import "dotenv/config";
import { defineConfig } from "prisma/config";

/** Direct URL for migrations; falls back so `prisma generate` works before .env is fully filled in. */
function directDatabaseUrl(): string {
  const url = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (url && url !== '""' && url !== "''") return url;
  return "postgresql://localhost:5432/postgres";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Use direct connection for migrations — pooled URLs can stall the CLI
    url: directDatabaseUrl(),
  },
});
