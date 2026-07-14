interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  readonly PUBLIC_SITE_URL: string;
  /** Google Gemini API key (server-only; set in `.env` for chat). */
  readonly GEMINI_API_KEY?: string;
  /** Optional: REST model id, e.g. `gemini-2.5-flash` if the default is unavailable. */
  readonly GEMINI_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
