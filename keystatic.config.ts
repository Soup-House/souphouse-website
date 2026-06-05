import { config } from '@keystatic/core';
import { home, about, getInvolved, donate, contact, board, partners, navbar, footer, branding, seo } from 'src/cms/singletons';
import { posts } from 'src/cms/collections';

// Local file storage during `astro dev` (edit straight from the repo, no auth),
// GitHub storage in production (editors sign in with GitHub on the deployed
// site; saves commit to the repo). The GitHub App env vars only matter for the
// production/github path. import.meta.env.DEV is replaced at build time by Vite.
const storage = import.meta.env.DEV
  ? ({ kind: 'local' } as const)
  : ({ kind: 'github', repo: 'Soup-House/souphouse-website' } as const);

export default config({
  storage,

    ui: {
    brand: { name: 'Soup House' },
    navigation: {
      'Content': ['home', 'about', 'getInvolved', 'donate', 'contact', 'board', 'partners', 'posts'],
      'Components': ['navbar', 'footer'],
      'Site Settings': ['branding', 'seo'],
    },
  },

  collections: {
    posts,
  },

  singletons: {
    home,
    about,
    getInvolved,
    donate,
    contact,
    board,
    partners,
    navbar,
    footer,
    branding,
    seo,
  },
});
