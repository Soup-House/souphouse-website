// Curated font pairings, shared by the Branding CMS dropdown and the layout so
// the two can't drift. `href` loads each family at the weights it actually ships.
export interface FontPairing {
  id: string
  label: string
  heading: string
  body: string
  href: string
}

export const FONT_PAIRINGS: FontPairing[] = [
  {
    id: 'roboto-cardo',
    label: 'Roboto headings / Cardo body',
    heading: '"Roboto", ui-sans-serif, system-ui, sans-serif',
    body: '"Cardo", ui-serif, Georgia, "Times New Roman", serif',
    href: 'https://fonts.googleapis.com/css2?family=Cardo:ital,wght@0,400;0,700;1,400&family=Roboto:wght@400;500;700&display=swap',
  },
  {
    id: 'cardo-roboto',
    label: 'Cardo headings / Roboto body',
    heading: '"Cardo", ui-serif, Georgia, "Times New Roman", serif',
    body: '"Roboto", ui-sans-serif, system-ui, sans-serif',
    href: 'https://fonts.googleapis.com/css2?family=Cardo:ital,wght@0,400;0,700;1,400&family=Roboto:wght@400;500;700&display=swap',
  },
  {
    id: 'playfair-source',
    label: 'Playfair Display headings / Source Sans body',
    heading: '"Playfair Display", ui-serif, Georgia, serif',
    body: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
    href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap',
  },
  {
    id: 'inter-lora',
    label: 'Inter headings / Lora body',
    heading: '"Inter", ui-sans-serif, system-ui, sans-serif',
    body: '"Lora", ui-serif, Georgia, serif',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
  },
]

export const FONT_WEIGHTS = [
  { label: 'Normal', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
]

export const DEFAULT_TYPOGRAPHY = {
  pairing: 'roboto-cardo',
  headingWeight: '400',
  bodyWeight: '400',
}
