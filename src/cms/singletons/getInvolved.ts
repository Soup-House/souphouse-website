import { fields, singleton } from '@keystatic/core';
import { pageBlocks } from '../fields';

export const getInvolved = singleton({
  label: 'Get Involved Page',
  format: { data: 'json' },
  path: 'src/content/pages/get-involved',
  schema: {
    title: fields.text({
      label: 'Page Title',
      description: 'The title of the page',
      defaultValue: 'Get Involved',
    }),
    blocks: pageBlocks,
  },
});
