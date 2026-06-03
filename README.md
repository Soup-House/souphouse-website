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

## Running the site (for editors)

You don't need the command line. In VSCode:

- Press Ctrl+Shift+B (Cmd+Shift+B on Mac), or
- Terminal menu -> Run Task -> "Start Soup House site"

This starts the site and the content editor. The addresses are printed in the
terminal panel and saved to logs/server.log:

- Editor on this computer:   https://localhost:4321/keystatic
- Editor over the network:   https://<your-ip>:4321/keystatic   (the real IP is printed at startup)

The browser warns about a self-signed certificate the first time. That's normal
for local use - click "Advanced" then "Proceed".

To stop the server, click the trash/stop icon on that terminal panel.

Not using VSCode? Run ./serve.sh from a terminal instead - it does the same thing.

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
