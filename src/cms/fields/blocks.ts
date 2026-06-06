import { fields } from '@keystatic/core';
import { buttons } from './buttons';

const anchorField = {
  anchorId: fields.text({
    label: 'Anchor ID',
    description: 'Optional. A short id so nav links can jump here, e.g. "mission" makes /#mission scroll to this section.',
  }),
};

export const pageBlocks = fields.blocks(
  {
    hero: {
      label: 'Hero',
      itemLabel: (props) => props.fields.heading.value || 'Hero',
      schema: fields.object({
        ...anchorField,
        heading: fields.text({ label: 'Heading' }),
        subheading: fields.text({ label: 'Subheading' }),
        intro: fields.text({ label: 'Intro', multiline: true }),
        image: fields.image({
          label: 'Image',
          directory: 'src/assets/images/pages',
          publicPath: '@assets/images/pages/',
        }),
        imageAlt: fields.text({ label: 'Image alt text' }),
        buttons,
      }),
    },
    header: {
      label: 'Page header',
      itemLabel: (props) => props.fields.heading.value || 'Page header',
      schema: fields.object({
        ...anchorField,
        eyebrow: fields.text({ label: 'Eyebrow' }),
        heading: fields.text({ label: 'Heading' }),
        subheading: fields.text({ label: 'Subheading', multiline: true }),
      }),
    },
    split: {
      label: 'Two-column text',
      itemLabel: (props) => props.fields.heading.value || 'Two-column text',
      schema: fields.object({
        ...anchorField,
        eyebrow: fields.text({ label: 'Eyebrow' }),
        heading: fields.text({ label: 'Heading' }),
        body: fields.text({ label: 'Body', multiline: true, description: 'Markdown is supported' }),
      }),
    },
    prose: {
      label: 'Rich text',
      itemLabel: (props) => props.fields.heading.value || 'Rich text',
      schema: fields.object({
        ...anchorField,
        eyebrow: fields.text({ label: 'Eyebrow' }),
        heading: fields.text({ label: 'Heading' }),
        body: fields.text({ label: 'Body', multiline: true, description: 'Markdown is supported' }),
      }),
    },
    cards: {
      label: 'Card grid',
      itemLabel: (props) => props.fields.heading.value || 'Card grid',
      schema: fields.object({
        ...anchorField,
        heading: fields.text({ label: 'Heading' }),
        subheading: fields.text({ label: 'Subheading', multiline: true }),
        items: fields.array(
          fields.object({
            icon: fields.text({ label: 'Icon', description: 'Inline SVG markup', multiline: true }),
            title: fields.text({ label: 'Title' }),
            body: fields.text({ label: 'Body', multiline: true }),
            link: fields.text({ label: 'Link', description: 'Optional' }),
            linkLabel: fields.text({ label: 'Link label', description: 'Optional' }),
          }),
          { label: 'Cards', itemLabel: (props) => props.fields.title.value || 'Card' }
        ),
      }),
    },
    steps: {
      label: 'Numbered steps',
      itemLabel: (props) => props.fields.heading.value || 'Numbered steps',
      schema: fields.object({
        ...anchorField,
        heading: fields.text({ label: 'Heading' }),
        subheading: fields.text({ label: 'Subheading', multiline: true }),
        items: fields.array(
          fields.object({
            title: fields.text({ label: 'Title' }),
            body: fields.text({ label: 'Body', multiline: true }),
          }),
          { label: 'Steps', itemLabel: (props) => props.fields.title.value || 'Step' }
        ),
      }),
    },
    calendar: {
      label: 'Events widget (list / calendar / map)',
      itemLabel: (props) => props.fields.heading.value || 'Events widget',
      schema: fields.object({
        ...anchorField,
        heading: fields.text({ label: 'Heading' }),
        subheading: fields.text({ label: 'Subheading', multiline: true }),
        source: fields.text({
          label: 'Calendar source',
          description: 'Gancio instance URL',
          defaultValue: 'https://calendar.souphouse.org',
        }),
        tags: fields.text({
          label: 'Base tag filter',
          description: 'Comma-separated; only events with these tags ever show. Leave blank for all.',
        }),
        presetTags: fields.text({
          label: 'Preset filter tags',
          description: 'Comma-separated chips shown in the filter bar for visitors to toggle',
        }),
        max: fields.integer({ label: 'Max events in the list view', defaultValue: 6 }),
        showList: fields.checkbox({ label: 'Show List tab', defaultValue: true }),
        showCalendar: fields.checkbox({ label: 'Show Calendar (month grid) tab', defaultValue: true }),
        showMap: fields.checkbox({ label: 'Show Map tab', defaultValue: true }),
        defaultTab: fields.select({
          label: 'Default tab',
          options: [
            { label: 'List', value: 'list' },
            { label: 'Calendar', value: 'calendar' },
            { label: 'Map', value: 'map' },
          ],
          defaultValue: 'list',
        }),
        defaultTimeframe: fields.select({
          label: 'Default timeframe',
          options: [
            { label: 'Today', value: 'today' },
            { label: 'Next 7 days', value: '7' },
            { label: 'Next 30 days', value: '30' },
            { label: 'Next 3 months', value: '90' },
            { label: 'All upcoming', value: 'all' },
          ],
          defaultValue: '30',
        }),
        showFilters: fields.checkbox({ label: 'Show the filter bar', defaultValue: true }),
      }),
    },
    postsTeaser: {
      label: 'Posts teaser',
      itemLabel: (props) => props.fields.heading.value || 'Posts teaser',
      schema: fields.object({
        ...anchorField,
        heading: fields.text({ label: 'Heading' }),
        subheading: fields.text({ label: 'Subheading', multiline: true }),
        maxPosts: fields.integer({ label: 'Number of posts to show', defaultValue: 3 }),
      }),
    },
    cta: {
      label: 'Call to action',
      itemLabel: (props) => props.fields.heading.value || 'Call to action',
      schema: fields.object({
        ...anchorField,
        heading: fields.text({ label: 'Heading' }),
        body: fields.text({ label: 'Body', multiline: true }),
        buttons,
      }),
    },
    signup: {
      label: 'Sign-up form',
      itemLabel: (props) => props.fields.heading.value || 'Sign-up form',
      schema: fields.object({
        ...anchorField,
        heading: fields.text({ label: 'Heading' }),
        note: fields.text({ label: 'Note', multiline: true }),
      }),
    },
    newsletter: {
      label: 'Newsletter signup',
      itemLabel: (props) => props.fields.heading.value || 'Newsletter signup',
      schema: fields.object({
        ...anchorField,
        heading: fields.text({ label: 'Heading' }),
        note: fields.text({ label: 'Note', multiline: true }),
      }),
    },
    schedule: {
      label: 'Meals & distributions',
      itemLabel: (props) => props.fields.heading.value || 'Meals & distributions',
      schema: fields.object({
        ...anchorField,
        heading: fields.text({ label: 'Heading' }),
        subheading: fields.text({ label: 'Subheading', multiline: true }),
        source: fields.text({
          label: 'Calendar source',
          description: 'Gancio instance URL',
          defaultValue: 'https://calendar.souphouse.org',
        }),
        tags: fields.text({
          label: 'Filter by tags',
          description: 'Comma-separated, e.g. meal, distribution',
          defaultValue: 'meal, distribution',
        }),
        max: fields.integer({ label: 'Max to show', defaultValue: 6 }),
      }),
    },
    team: {
      label: 'Team / board',
      itemLabel: (props) => props.fields.heading.value || 'Team / board',
      schema: fields.object({
        ...anchorField,
        heading: fields.text({ label: 'Heading' }),
        subheading: fields.text({ label: 'Subheading', multiline: true }),
        members: fields.array(
          fields.object({
            name: fields.text({ label: 'Name' }),
            role: fields.text({ label: 'Role' }),
            bio: fields.text({ label: 'Bio', multiline: true }),
            photo: fields.image({
              label: 'Photo',
              directory: 'src/assets/images/team',
              publicPath: '@assets/images/team/',
            }),
          }),
          { label: 'Members', itemLabel: (props) => props.fields.name.value || 'Member' }
        ),
      }),
    },
    embed: {
      label: 'Embed / form',
      itemLabel: (props) => props.fields.heading.value || 'Embed / form',
      schema: fields.object({
        ...anchorField,
        heading: fields.text({ label: 'Heading' }),
        note: fields.text({ label: 'Note', multiline: true }),
        html: fields.text({
          label: 'Embed code',
          description: 'Paste an iframe/embed snippet (e.g. Zeffy, a Google Form). Leave blank for a placeholder.',
          multiline: true,
        }),
      }),
    },
  },
  { label: 'Sections' }
);
