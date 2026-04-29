interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  /** Google Gemini API key (server-only; set in `.env` for chat). */
  readonly GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
