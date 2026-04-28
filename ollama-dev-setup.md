# Ollama setup for Sudino chat (local dev)

The in-site **Sudino** assistant (`/api/chat`) calls **Ollama** on your machine at **`http://localhost:11434`** using the **`llama3.2`** model. Every developer who wants the chatbot to answer (not just show errors) needs Ollama installed and that model pulled.

---

## 1. Install Ollama

1. Download the installer for your OS from **[https://ollama.com/download](https://ollama.com/download)**.
2. Run the installer and complete the steps (Windows, macOS, or Linux).

After installation, the **Ollama app/service** usually starts automatically and listens on **port `11434`**.

---

## 2. Pull the required model

Open a terminal and run:

```bash
ollama pull llama3.2
```

This downloads the weights for the model name the app expects (see `src/pages/api/chat.ts`: `MODEL = "llama3.2"`).

Verify:

```bash
ollama list
```

You should see **`llama3.2`** (often as `llama3.2:latest`).

---

## 3. Make sure the server is running

- **Windows / macOS:** Ollama normally runs in the background after install. If chat fails, open the **Ollama** app or run:

  ```bash
  ollama serve
  ```

- **Port already in use:** If you see `bind: ... 11434 ... already in use`, something is already serving Ollama—**do not** start a second `ollama serve`; use the existing process.

Quick health check:

```bash
ollama run llama3.2 "Say hi in one sentence."
```

If that replies, the runtime and model are fine.

---

## 4. Run the website and test the chatbot

From the repo root:

```bash
npm install
npm run dev
```

Open the site, open the **Sudino** chat panel, send a message. The UI **POST**s to **`/api/chat`**, which forwards your text to Ollama.

---

## 5. Troubleshooting

| Issue | What to try |
|--------|-------------|
| Chat says it can’t reach `localhost:11434` | Confirm Ollama is installed, then `ollama list`. Start the app or `ollama serve` if needed. |
| Model not found / 404 from Ollama | Run `ollama pull llama3.2` again. |
| Wrong or slow model | The code uses the tag **`llama3.2`**; changing models requires editing `src/pages/api/chat.ts` (`MODEL`). |
| Works on dev but not on deployed site | Production hosting must be able to reach **your** Ollama (usually it can’t). Local chat is intended for **`astro dev`** on each machine unless you deploy an SSR API and host Ollama separately. |

---

## Reference

- Ollama docs: [https://github.com/ollama/ollama](https://github.com/ollama/ollama)
- Project API route: `src/pages/api/chat.ts`
