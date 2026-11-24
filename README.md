# souphouse-website

Soup House website. Built with Astro, Keystatic (git-based CMS), Tailwind and DaisyUI.
Mostly a static site, hosted on Vercel; the CMS routes run as serverless functions.

## Editing content (for editors)

You don't need to install anything. Content is edited in the browser:

1. Go to the live site and add `/keystatic` to the URL.
2. Click "Sign in with GitHub".
3. Edit pages, posts, and settings, then Save.

Each save commits to this repo and the site redeploys automatically (about a minute).
To get access you need to be a collaborator on this repo with write permission, so
ask an admin to add your GitHub account.

## Local development

For working on the code (or editing content offline). Needs Node 22 (if your
system node is older, load nvm first):

```sh
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
npm install
npm run dev -- --host 0.0.0.0
```

The dev server runs over https with a self-signed cert (the browser warns once -
click "Advanced" then "Proceed"). Keystatic needs https when you open it over a LAN
IP, not just localhost.

- site: https://localhost:4321
- cms:  https://localhost:4321/keystatic

In local development Keystatic uses **local file storage** - edits write straight to
the files in this repo, no GitHub login needed. In production it uses **GitHub
storage** (the browser login above). Pull before editing locally so you don't diverge
from changes made through the live editor.

### Easy start in VSCode

You can also start it without the command line: press Ctrl+Shift+B (Cmd+Shift+B on
Mac), or Terminal -> Run Task -> "Start Soup House site". The addresses are printed in
the terminal panel and saved to logs/server.log. Not using VSCode? Run `./serve.sh`.

## Build

```sh
npm run build     # static pages + the Keystatic serverless function
npm run preview
```

## Deploy / hosting

Hosted on **Vercel**. Every push to `main` auto-deploys. Pages are static; the
Vercel adapter builds these routes as Node serverless functions:

- `/keystatic`, `/api/keystatic`: the CMS UI and its GitHub sign-in;
- `/api/forms/*`: the signup, volunteer, reservation and contact forms (they
  call the CRM's form processors);
- `/api/subscribe`: newsletter signups;
- `/api/events`, `/api/soup-events`: cached proxies for the community calendar
  and Soup House's own events from the CRM.

Environment variables in the Vercel project (Production and Preview), none
stored in the repo:

- `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`,
  `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`: Keystatic's GitHub App, installed on this repo
- `KEYSTATIC_SECRET` (random; `openssl rand -base64 32`)
- `CIVI_API_KEY`: the CRM API key of the user "Website Bot" (the forms)
- `CIVI_CRM_URL`: `https://crm.souphouse.org`

## Where things are

- `src/styles/global.css` - colors/theme (the `souphouse` DaisyUI theme) and fonts
- `src/components/` - page sections
- `src/content/` + `src/settings/` - content, edited through Keystatic
- `src/cms/` - Keystatic schema
- `keystatic.config.ts`, `astro.config.mjs` - config
