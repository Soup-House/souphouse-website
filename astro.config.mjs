import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// Static by default. Routes marked prerender:false (Keystatic's /keystatic and
// /api/keystatic, and the API routes in src/pages/api) become Node serverless
// functions on Vercel, while every page stays static.
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
