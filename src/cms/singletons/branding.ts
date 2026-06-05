import { fields, singleton } from '@keystatic/core'
import { FONT_PAIRINGS, FONT_WEIGHTS, DEFAULT_TYPOGRAPHY } from '../../settings/fonts'

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
      typography: fields.object(
        {
          pairing: fields.select({
            label: 'Font pairing',
            description: 'Heading + body fonts',
            options: FONT_PAIRINGS.map((p) => ({ label: p.label, value: p.id })),
            defaultValue: DEFAULT_TYPOGRAPHY.pairing,
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
