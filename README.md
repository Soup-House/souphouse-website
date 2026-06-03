# souphouse-website

Soup House website. Built with Astro, Keystatic (git-based CMS), Tailwind and DaisyUI.
Static site, deploys to Cloudflare Pages.

## Setup

Needs Node 22. System node here is 20, so load nvm first:

```sh
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
npm install
npm run dev -- --host 0.0.0.0
```

Dev server runs over https with a self-signed cert.
Keystatic needs https when you open it over a LAN IP, not just localhost.

- site: https://localhost:4321
- cms: https://localhost:4321/keystatic

## Build

```sh
npm run build
npm run preview
```

Note: the prod build needs a Cloudflare adapter for the Keystatic routes. Not added yet.

## Where things are

- `src/styles/global.css` - colors/theme (the `souphouse` DaisyUI theme)
- `src/components/` - page sections
- `src/content/` + `src/settings/` - content, edited through Keystatic
- `src/cms/` - Keystatic schema
- `keystatic.config.ts`, `astro.config.mjs` - config
