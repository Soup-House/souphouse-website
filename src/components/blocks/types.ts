import type { ImageMetadata } from 'astro'

export interface ButtonData {
  label: string
  link: string
  icon?: string
  style?: string
  type?: string
  size?: string
}

export interface CardItem {
  icon?: string
  title?: string
  body?: string
  link?: string
  linkLabel?: string
}

export interface StepItem {
  title?: string
  body?: string
}

export interface HeroBlock {
  heading?: string
  subheading?: string
  intro?: string
  image?: ImageMetadata | null
  imageAlt?: string
  buttons?: ButtonData[]
}

export interface HeaderBlock {
  eyebrow?: string
  heading?: string
  subheading?: string
}

export interface TextBlock {
  eyebrow?: string
  heading?: string
  body?: string
}

export interface CardsBlock {
  heading?: string
  subheading?: string
  items?: CardItem[]
}

export interface StepsBlock {
  heading?: string
  subheading?: string
  items?: StepItem[]
}

export interface CalendarBlock {
  heading?: string
  subheading?: string
  source?: string
  tags?: string
  presetTags?: string
  max?: number | null
  showList?: boolean
  showCalendar?: boolean
  showMap?: boolean
  defaultTab?: string
  defaultTimeframe?: string
  showFilters?: boolean
  showLocationFilter?: boolean
  defaultMapStyle?: string
}

export interface PostsTeaserBlock {
  heading?: string
  subheading?: string
  maxPosts?: number | null
  showAllLink?: boolean
}

export interface CtaBlock {
  heading?: string
  body?: string
  buttons?: ButtonData[]
}

export interface SignupBlock {
  heading?: string
  note?: string
  form?: 'volunteer' | 'partner' | 'contact'
  buttonLabel?: string
}

export interface NewsletterBlock {
  heading?: string
  note?: string
}

export interface Member {
  name?: string
  role?: string
  bio?: string
  photo?: ImageMetadata | null
}

export interface TeamBlock {
  heading?: string
  subheading?: string
  members?: Member[]
}

export interface EmbedBlock {
  heading?: string
  note?: string
  html?: string
}
