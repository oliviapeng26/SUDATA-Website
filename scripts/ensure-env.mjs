/**
 * Ensures a local `.env` exists and includes every key from `.env.example`.
 * Never overwrites values already set in `.env`.
 * Skipped when SKIP_ENSURE_ENV=1 (e.g. CI that only uses host env vars).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.SKIP_ENSURE_ENV === "1") process.exit(0);

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");
const examplePath = path.join(root, ".env.example");

if (!fs.existsSync(examplePath)) {
  console.warn("[ensure-env] .env.example not found — create .env manually.");
  process.exit(0);
}

const example = fs.readFileSync(examplePath, "utf8");

if (!fs.existsSync(envPath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log(
    "[ensure-env] Created .env from .env.example — fill in DATABASE_URL, DIRECT_URL, and GEMINI_API_KEY, then restart dev.",
  );
  process.exit(0);
}

const keyPattern = /^([A-Z][A-Z0-9_]*)=/;
const existingKeys = new Set();

for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const match = line.match(keyPattern);
  if (match) existingKeys.add(match[1]);
}

const missingLines = [];
for (const line of example.split(/\r?\n/)) {
  const match = line.match(keyPattern);
  if (match && !existingKeys.has(match[1])) {
    missingLines.push(line);
  }
}

if (missingLines.length === 0) process.exit(0);

const suffix = missingLines.join("\n");
fs.appendFileSync(
  envPath,
  `${fs.readFileSync(envPath, "utf8").endsWith("\n") ? "" : "\n"}\n# Added by ensure-env (fill in before using Prisma/admin features)\n${suffix}\n`,
);
console.log(
  `[ensure-env] Appended ${missingLines.length} missing key(s) to .env: ${missingLines.map((l) => l.split("=")[0]).join(", ")}`,
);
