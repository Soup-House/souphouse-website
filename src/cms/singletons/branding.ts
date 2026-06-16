import { fields, singleton } from '@keystatic/core'
import { FONT_FAMILIES, FONT_WEIGHTS, DEFAULT_TYPOGRAPHY } from '../../settings/fonts'

// Shared between the light and dark theme pickers.
const THEME_OPTIONS = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Cupcake', value: 'cupcake' },
  { label: 'Bumblebee', value: 'bumblebee' },
  { label: 'Emerald', value: 'emerald' },
  { label: 'Corporate', value: 'corporate' },
  { label: 'Synthwave', value: 'synthwave' },
  { label: 'Retro', value: 'retro' },
  { label: 'Cyberpunk', value: 'cyberpunk' },
  { label: 'Valentine', value: 'valentine' },
  { label: 'Halloween', value: 'halloween' },
  { label: 'Garden', value: 'garden' },
  { label: 'Forest', value: 'forest' },
  { label: 'Aqua', value: 'aqua' },
  { label: 'Lofi', value: 'lofi' },
  { label: 'Pastel', value: 'pastel' },
  { label: 'Fantasy', value: 'fantasy' },
  { label: 'Wireframe', value: 'wireframe' },
  { label: 'Souphouse', value: 'souphouse' },
  { label: 'Souphouse Dark', value: 'souphouse-dark' },
]

export const branding = singleton({
  label: 'Branding',
  format: { data: 'json' },
  path: 'src/settings/branding',
  schema: {
    site: fields.object({
      siteName: fields.text({ label: 'Site Name' }),
      theme: fields.select({
        label: 'Light theme',
        description: 'Default theme, used in light mode. Themes come from DaisyUI.',
        options: THEME_OPTIONS,
        defaultValue: 'souphouse',
      }),
      darkTheme: fields.select({
        label: 'Dark mode theme',
        description: 'Theme used when a visitor turns on dark mode.',
        options: THEME_OPTIONS,
        defaultValue: 'souphouse-dark',
      }),
      defaultMode: fields.select({
        label: 'Default color mode',
        description:
          'What first-time visitors see before they choose. "Follow device" uses their system light/dark setting.',
        options: [
          { label: 'Follow device', value: 'system' },
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
        ],
        defaultValue: 'system',
      }),
      favicon: fields.image({
        label: 'Favicon',
        description: 'Favicon for the site',
        directory: 'public/images',
        publicPath: '/images/',
      }),
      logo: fields.image({
        label: 'Logo',
        description: 'Optional. Shown to the left of the site name in the top navigation. Leave empty for text only.',
        directory: 'public/images',
        publicPath: '/images/',
      }),
      typography: fields.object(
        {
          headingFont: fields.select({
            label: 'Heading font',
            options: FONT_FAMILIES.map((f) => ({ label: f.label, value: f.id })),
            defaultValue: DEFAULT_TYPOGRAPHY.headingFont,
          }),
          bodyFont: fields.select({
            label: 'Body font',
            options: FONT_FAMILIES.map((f) => ({ label: f.label, value: f.id })),
            defaultValue: DEFAULT_TYPOGRAPHY.bodyFont,
          }),
          uiFont: fields.select({
            label: 'Buttons & menus font',
            options: FONT_FAMILIES.map((f) => ({ label: f.label, value: f.id })),
            defaultValue: DEFAULT_TYPOGRAPHY.uiFont,
          }),
          headingWeight: fields.select({
            label: 'Heading weight',
            options: FONT_WEIGHTS,
            defaultValue: DEFAULT_TYPOGRAPHY.headingWeight,
          }),
          bodyWeight: fields.select({
            label: 'Body weight',
            options: FONT_WEIGHTS,
            defaultValue: DEFAULT_TYPOGRAPHY.bodyWeight,
          }),
        },
        { label: 'Typography' }
      ),
    }),
  },
})
