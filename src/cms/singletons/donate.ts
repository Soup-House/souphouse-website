import { fields, singleton } from '@keystatic/core';
import { pageBlocks } from '../fields';

export const donate = singleton({
  label: 'Donate Page',
  format: { data: 'json' },
  path: 'src/content/pages/donate',
  schema: {
    title: fields.text({
      label: 'Page Title',
      description: 'The title of the page',
      defaultValue: 'Donate',
    }),
    blocks: pageBlocks,
  },
});
