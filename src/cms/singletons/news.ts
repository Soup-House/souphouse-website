import { fields, singleton } from '@keystatic/core';
import { pageBlocks } from '../fields';

export const news = singleton({
  label: 'News Page',
  format: { data: 'json' },
  path: 'src/content/pages/posts',
  schema: {
    title: fields.text({
      label: 'Page Title',
      description: 'The title of the page',
      defaultValue: 'News',
    }),
    blocks: pageBlocks,
  },
});
