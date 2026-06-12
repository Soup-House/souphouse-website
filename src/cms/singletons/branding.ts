import { fields, singleton } from '@keystatic/core'
import { FONT_FAMILIES, FONT_WEIGHTS, DEFAULT_TYPOGRAPHY } from '../../settings/fonts'

export const branding = singleton({
  label: 'Branding',
  format: { data: 'json' },
  path: 'src/settings/branding',
  schema: {
    site: fields.object({
      siteName: fields.text({ label: 'Site Name' }),
      theme: fields.select({
        label: 'Select a theme',
        description: "Themes available from DaisyUI",
        options: [
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
        ],
        defaultValue: 'souphouse',
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
