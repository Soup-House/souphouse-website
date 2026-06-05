import { fields, singleton } from '@keystatic/core';
import { pageBlocks } from '../fields';

export const partners = singleton({
  label: 'Partners Page',
  format: { data: 'json' },
  path: 'src/content/pages/partners',
  schema: {
    title: fields.text({
      label: 'Page Title',
      description: 'The title of the page',
      defaultValue: 'Partners',
    }),
    blocks: pageBlocks,
  },
});
