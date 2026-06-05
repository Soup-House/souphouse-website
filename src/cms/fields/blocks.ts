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
      label: 'Calendar placeholder',
      itemLabel: (props) => props.fields.heading.value || 'Calendar placeholder',
      schema: fields.object({
        ...anchorField,
        heading: fields.text({ label: 'Heading' }),
        subheading: fields.text({ label: 'Subheading', multiline: true }),
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
        items: fields.array(
          fields.object({
            when: fields.text({ label: 'When', description: 'e.g. Wednesdays, 6pm' }),
            place: fields.text({ label: 'Place' }),
            detail: fields.text({ label: 'Detail', multiline: true }),
          }),
          { label: 'Times', itemLabel: (props) => props.fields.when.value || 'Time' }
        ),
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
