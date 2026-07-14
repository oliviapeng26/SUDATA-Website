# SUDATA Website

Welcome to the repository for the SUDATA website. This project is built with **Astro**, **React**, and **Tailwind CSS**, designed with a high-fidelity "Cyberpunk/Retro" aesthetic.

## Tech Stack

- **Framework**: [Astro](https://astro.build)
- **UI Library**: [React](https://react.dev)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Icons**: [pixelarticons](https://pixelarticons.com/)
- **3D/Graphics**: [Three.js](https://threejs.org/) / [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- **Sudino chat**: Google **Gemini** via server route `POST /api/chat` (requires `GEMINI_API_KEY` — see below)

## Getting Started

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the development server**:
    ```bash
    npm run dev
    ```
    Access the site at `http://localhost:4321`.

### Sudino chat (Gemini API)

The in-site Sudino assistant calls **`POST /api/chat`** and needs a Gemini key on the server.

1. Run **`npm run dev`** once (or **`npm run env:setup`**). That creates **`.env`** from **`.env.example`** if you don’t have one yet — it is **gitignored** and never committed.
2. Open **`.env`**, paste your key after **`GEMINI_API_KEY=`** from [Google AI Studio](https://aistudio.google.com/apikey). No quotes, no spaces around `=`.
3. **Restart** `npm run dev` after saving.
4. **Production:** set **`GEMINI_API_KEY`** in your host’s environment/secrets (not in the repo).

More detail: [readmes/README_SUDINO_CHAT.md](readmes/README_SUDINO_CHAT.md).

## Design System & recent Updates

We have recently overhauled the UI to ensure a unified visual identity. Please adhere to the following guidelines when contributing.

### 1. Color Palette
-   **Neon Blue (Primary)**: `#00F0FF` (Used for text glows, icons, borders, and active states).
-   **Deep Navy (Background)**: `#020617` (Main background).
-   **Grey (Text)**: `#94a3b8`.

### 2. Iconography (`pixelarticons`)
We have migrated to **pixelarticons** for all glyphs to maintain a retro 32-bit feel.
-   **Usage**: Embed SVG paths directly or import if available.
-   **Rendering**: ALWAYS apply `style="image-rendering: pixelated;"` to SVGs to prevent blurring at larger scales.
-   **Styling**:
    -   Fill: `#00F0FF` (Electric Blue) or `#020617` (Navy) for contrast on blue buttons.
    -   Glow: `filter: drop-shadow(0 0 10px #00F0FF);` for neon elements.
-   **Exceptions**:
    -   **Instagram Icon**: The standard package version may lack the Instagram logo. A custom pixel-art SVG path has been implemented in `index.astro`.
    -   **Brain Icon**: A custom high-def pixel brain is used for "The Hub".

### 3. Glass Slabs (Knowledge Hub)
-   **Interaction**: Cards lift vertically (`translateY(-20px)`) and scale (`1.05`) on hover.
-   **Visuals**: Use `backdrop-blur-2xl` and a deep blue outer glow on hover.
-   **Animation**: Elements use a scroll-driven intersection observer with a "heavy" mechanical easing (`cubic-bezier(0.16, 1, 0.3, 1)`).

## Development Notes & Missing Items

Things team members should be aware of:

1.  **Missing Icons**: Not all icons are present in the installed `pixelarticons` version (v1.8.1). If you need a specific brand icon (e.g., Discord, LinkedIn), you may need to manually create a pixel-perfect SVG path or find a compatible retro alternative.
2.  **Performance**: The heavy usage of `backdrop-blur` and `box-shadow` glows can be performance-intensive on lower-end devices. Future optimization may be needed.
3.  **Accessibility**:
    -   Ensure contrast ratios are maintained, especially with neon text on dark backgrounds.
    -   **Action Item**: SVGs currently lack proper `aria-label` or `title` tags. These should be added for screen readers.
4.  **Mobile Responsiveness**: While the grid collapses to a single column, the large 96px icons and glass padding should be tested on very small screens (iPhone SE, etc.) to ensure no overflow.
5.  **3D Elements**: The `NetworkLogo` component relies on client-side React hydration (`client:only="react"`). Ensure Three.js context is handled correctly to prevent memory leaks during hot reloads.

## Project Structure

```text
/
├── public/
│   ├── favicon.svg      # Site icon
├── src
│   ├── assets/          # Static assets (SVGs, images)
│   ├── components/      # React & Astro components (NetworkLogo, etc.)
│   ├── layouts/         # Main layout wrapper (Layout.astro)
│   ├── pages/           # Route pages (index.astro)
│   └── styles/          # Global CSS (Tailwind imports, custom animations)
└── package.json
```
