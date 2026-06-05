import { fields, singleton } from '@keystatic/core';
import { pageBlocks } from '../fields';

export const contact = singleton({
  label: 'Contact Page',
  format: { data: 'json' },
  path: 'src/content/pages/contact',
  schema: {
    title: fields.text({
      label: 'Page Title',
      description: 'The title of the page',
      defaultValue: 'Contact',
    }),
    blocks: pageBlocks,
  },
});
