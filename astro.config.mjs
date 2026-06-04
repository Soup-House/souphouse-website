import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';

import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

import cloudflare from '@astrojs/cloudflare';

// The Keystatic admin (/keystatic + /api/keystatic) needs a server runtime, so
// we only load it during `astro dev`. The `astro build` output is 100% static
// (no adapter), which deploys cleanly to Cloudflare Pages. Editors run Keystatic
// locally for now; serving the admin from Cloudflare is a later step.
//
// We key off argv ('dev' vs 'build') rather than NODE_ENV, which isn't reliably
// set when the config is first evaluated.
const isDev = process.argv.includes('dev');

// https://astro.build/config
export default defineConfig({
  integrations: [react(), markdoc(), ...(isDev ? [keystatic()] : [])],
  output: 'static',

  vite: {
    plugins: [tailwindcss(), ...(isDev ? [basicSsl()] : [])],
  },

  adapter: cloudflare(),
});