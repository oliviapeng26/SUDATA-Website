// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

// https://astro.build/config
// Astro 5: "hybrid" was removed; static output supports on-demand routes via `prerender = false`
export default defineConfig({
	adapter: vercel(),
	integrations: [react(), tailwind()],
});
