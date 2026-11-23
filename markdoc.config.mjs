import { defineMarkdocConfig, component } from '@astrojs/markdoc/config'

// Tags news posts can use. The newsletter editor writes them (event cards,
// buttons, images, quotes) so posts look like the rest of the site, and
// Keystatic edits them (src/cms/collections/posts.ts).
export default defineMarkdocConfig({
  tags: {
    event: {
      render: component('./src/components/markdoc/Event.astro'),
      selfClosing: true,
      attributes: {
        title: { type: String, required: true },
        when: { type: String },
        place: { type: String },
        menu: { type: String },
        signup: { type: String },
        details: { type: String },
        cost: { type: String },
        reserve: { type: String },
        tickets: { type: String },
      },
    },
    button: {
      render: component('./src/components/markdoc/Button.astro'),
      selfClosing: true,
      attributes: { label: { type: String, required: true }, href: { type: String, required: true } },
    },
    figure: {
      render: component('./src/components/markdoc/Figure.astro'),
      selfClosing: true,
      attributes: { src: { type: String, required: true }, alt: { type: String }, caption: { type: String } },
    },
    quote: {
      render: component('./src/components/markdoc/Quote.astro'),
      attributes: { by: { type: String } },
    },
  },
})
