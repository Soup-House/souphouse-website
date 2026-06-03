import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';

import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// HTTPS only for local dev so the Keystatic admin gets a secure context
// (Web Crypto / crypto.subtle) when accessed over a LAN IP. Production
// builds and the deployed site are unaffected.
const isDev = process.env.NODE_ENV !== 'production';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), markdoc(), keystatic()],
  output: 'static',
  vite: {
    plugins: [tailwindcss(), ...(isDev ? [basicSsl()] : [])]
  }
});