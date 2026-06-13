// Font families for the Branding CMS: heading and body are chosen
// independently. Each family carries its own Google Fonts stylesheet href;
// the layout loads the union of the chosen ones.
export interface FontFamily {
  id: string
  label: string
  stack: string
  href: string
}

const G = 'https://fonts.googleapis.com/css2?family='

export const FONT_FAMILIES: FontFamily[] = [
  // serifs
  { id: 'cardo', label: 'Cardo (serif)', stack: '"Cardo", ui-serif, Georgia, "Times New Roman", serif', href: `${G}Cardo:ital,wght@0,400;0,700;1,400&display=swap` },
  { id: 'playfair', label: 'Playfair Display (serif)', stack: '"Playfair Display", ui-serif, Georgia, serif', href: `${G}Playfair+Display:wght@400;500;600;700&display=swap` },
  { id: 'lora', label: 'Lora (serif)', stack: '"Lora", ui-serif, Georgia, serif', href: `${G}Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap` },
  { id: 'roboto-slab', label: 'Roboto Slab (slab serif)', stack: '"Roboto Slab", ui-serif, Georgia, serif', href: `${G}Roboto+Slab:wght@400;500;600;700&display=swap` },
  // sans
  { id: 'roboto', label: 'Roboto (sans)', stack: '"Roboto", ui-sans-serif, system-ui, sans-serif', href: `${G}Roboto:wght@400;500;700&display=swap` },
  { id: 'source-sans', label: 'Source Sans (sans)', stack: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif', href: `${G}Source+Sans+3:wght@400;500;600;700&display=swap` },
  { id: 'inter', label: 'Inter (sans)', stack: '"Inter", ui-sans-serif, system-ui, sans-serif', href: `${G}Inter:wght@400;500;600;700&display=swap` },
  { id: 'jost', label: 'Jost (geometric sans)', stack: '"Jost", ui-sans-serif, system-ui, sans-serif', href: `${G}Jost:wght@400;500;600;700&display=swap` },
  { id: 'plex', label: 'IBM Plex Sans (sans)', stack: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif', href: `${G}IBM+Plex+Sans:wght@400;500;600;700&display=swap` },
  // smooth / rounded sans
  { id: 'nunito', label: 'Nunito (rounded sans)', stack: '"Nunito", ui-sans-serif, system-ui, sans-serif', href: `${G}Nunito:wght@400;600;700;800&display=swap` },
  { id: 'nunito-sans', label: 'Nunito Sans (sans)', stack: '"Nunito Sans", ui-sans-serif, system-ui, sans-serif', href: `${G}Nunito+Sans:wght@400;600;700&display=swap` },
  { id: 'quicksand', label: 'Quicksand (rounded sans)', stack: '"Quicksand", ui-sans-serif, system-ui, sans-serif', href: `${G}Quicksand:wght@400;500;600;700&display=swap` },
  { id: 'dm-sans', label: 'DM Sans (sans)', stack: '"DM Sans", ui-sans-serif, system-ui, sans-serif', href: `${G}DM+Sans:wght@400;500;700&display=swap` },
  { id: 'outfit', label: 'Outfit (geometric sans)', stack: '"Outfit", ui-sans-serif, system-ui, sans-serif', href: `${G}Outfit:wght@400;500;600;700&display=swap` },
]

export const FONT_WEIGHTS = [
  { label: 'Normal', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
]

export const DEFAULT_TYPOGRAPHY = {
  headingFont: 'inter',
  bodyFont: 'lora',
  uiFont: 'lora',
  headingWeight: '400',
  bodyWeight: '400',
}
