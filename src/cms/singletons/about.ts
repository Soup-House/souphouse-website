import { fields, singleton } from '@keystatic/core';
import { pageBlocks } from '../fields';

export const about = singleton({
  label: 'About Page',
  format: { data: 'json' },
  path: 'src/content/pages/about',
  schema: {
    title: fields.text({
      label: 'Page Title',
      description: 'The title of the page',
      defaultValue: 'About',
    }),
    blocks: pageBlocks,
  },
});
