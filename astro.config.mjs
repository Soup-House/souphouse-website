import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// Static by default. Keystatic's two routes (/keystatic, /api/keystatic) are
// marked prerender:false, so the Vercel adapter turns just those into Node
// serverless functions (for the GitHub OAuth + API), while every page stays
// static. The admin needs a Node runtime, which Vercel provides.
//
// basic-ssl is dev-only: HTTPS so the Keystatic admin gets a secure context
// when opened over a LAN IP. We key off argv ('dev') because NODE_ENV isn't
// reliably set when the config is first evaluated.
const isDev = process.argv.includes('dev');

// https://astro.build/config
export default defineConfig({
  site: 'https://souphouse.org',
  integrations: [react(), markdoc(), keystatic(), sitemap()],
  output: 'static',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss(), ...(isDev ? [basicSsl()] : [])],
  },
});
