import { fields, singleton } from '@keystatic/core';
import { pageBlocks } from '../fields';

export const home = singleton({
  label: 'Home Page',
  format: { data: 'json' },
  path: 'src/content/pages/home',
  schema: {
    title: fields.text({
      label: 'Page Title',
      description: 'The title of the page',
      defaultValue: 'Home',
    }),
    blocks: pageBlocks,
  },
});
