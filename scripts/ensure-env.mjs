/**
 * Ensures a local `.env` exists so you only paste GEMINI_API_KEY once.
 * Does not overwrite an existing `.env` (never touches your secrets).
 * Skipped when SKIP_ENSURE_ENV=1 (e.g. CI that only uses host env vars).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.SKIP_ENSURE_ENV === "1") process.exit(0);

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");
const examplePath = path.join(root, ".env.example");

if (fs.existsSync(envPath)) process.exit(0);

if (!fs.existsSync(examplePath)) {
  console.warn("[ensure-env] .env.example not found — create .env manually.");
  process.exit(0);
}

fs.copyFileSync(examplePath, envPath);
console.log(
  "[ensure-env] Created .env from .env.example — paste your GEMINI_API_KEY there, save, restart dev.",
);
