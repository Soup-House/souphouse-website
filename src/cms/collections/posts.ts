import { fields, collection } from '@keystatic/core';
import { block, wrapper } from '@keystatic/core/content-components';

export const posts = collection({
  label: 'Posts',
  slugField: 'title',
  path: 'src/content/posts/*',
  entryLayout: 'content',
  format: { contentField: 'content' },
  schema: {
    title: fields.slug({ name: { label: 'Title' } }),
    featuredImage: fields.image({
      label: "Featured Image",
      directory: "src/assets/images/posts",
      publicPath: "@assets/images/posts/",
    }),
    imgAlt: fields.text({ label: 'Image Alt' }),
    content: fields.markdoc({
      label: "Content",
      options: {
        image: {
          directory: "src/assets/images/posts",
          publicPath: "@assets/images/posts/",
        },
      },
      // The same tags as markdoc.config.mjs (the newsletter editor writes them).
      components: {
        event: block({
          label: 'Event card',
          schema: {
            title: fields.text({ label: 'Name' }),
            when: fields.text({ label: 'When' }),
            place: fields.text({ label: 'Place' }),
            menu: fields.text({ label: 'Menu' }),
            signup: fields.text({ label: 'Signup link' }),
          },
        }),
        button: block({
          label: 'Button',
          schema: { label: fields.text({ label: 'Text' }), href: fields.text({ label: 'Link' }) },
        }),
        figure: block({
          label: 'Image (link)',
          schema: { src: fields.text({ label: 'Image link' }), alt: fields.text({ label: 'Description' }), caption: fields.text({ label: 'Caption' }) },
        }),
        quote: wrapper({
          label: 'Quote',
          schema: { by: fields.text({ label: 'Who said it' }) },
        }),
      },
    }),
    excerpt: fields.text({ label: 'Excerpt', multiline: true, description: 'A brief description of this article' }),
    publishedDate: fields.date({ label: "Published date" }),
    coverUrl: fields.url({ label: 'Cover image (link)', description: 'Shown at the top, and when the post is shared. Use this or the featured image.' }),
    coverAlt: fields.text({ label: 'Cover image description' }),
    accent: fields.select({ label: 'Accent colour', options: [{ label: 'Tomato', value: 'tomato' }, { label: 'Herb', value: 'herb' }, { label: 'Honey', value: 'honey' }], defaultValue: 'tomato' }),
    background: fields.select({ label: 'Header background', options: [{ label: 'Plain', value: 'plain' }, { label: 'Stelline', value: 'stelline' }], defaultValue: 'plain' }),


  },
});