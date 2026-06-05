import { fields, singleton } from '@keystatic/core';
import { pageBlocks } from '../fields';

export const board = singleton({
  label: 'Board Page',
  format: { data: 'json' },
  path: 'src/content/pages/board',
  schema: {
    title: fields.text({
      label: 'Page Title',
      description: 'The title of the page',
      defaultValue: 'Board',
    }),
    blocks: pageBlocks,
  },
});
