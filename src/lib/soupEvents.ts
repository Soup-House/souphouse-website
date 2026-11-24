// Soup House's own events (dinners, classes, community events) from the CRM:
// the public feed of the CRM's souphouse extension. Only events marked public
// there are in it, never catering jobs. Server-side only (the API routes);
// pages and blocks read them through /api/soup-events.
const env = (name: string): string | undefined =>
  (typeof process !== 'undefined' ? process.env?.[name] : undefined) ??
  (import.meta.env[name] as string | undefined)

export interface SoupEvent {
  id: number
  title: string
  type: string
  start: string // ISO 8601 with offset, Soup House local time
  end: string | null
  summary?: string | null // the description, plain text with line breaks
  menu: string | null
  location: string | null
  volunteers_wanted: boolean
  signup_url: string | null
  flyer_url?: string | null // an image, public on the CRM
  cost?: string | null // "Free", "$10 suggested donation"...
  ticket_url?: string | null // tickets sold elsewhere (Zeffy)
  reservations?: boolean // taking reservations (they may be full)
  spots?: number | null // null: no limit
  spots_left?: number | null // null: no limit
  reserve_url?: string | null // null when not taking reservations, or full
}

export async function fetchSoupEvents(opts: { days?: number; id?: number } = {}): Promise<SoupEvent[]> {
  const base = env('CIVI_CRM_URL') ?? 'https://crm.souphouse.org'
  const query = new URLSearchParams()
  if (opts.id) query.set('id', String(opts.id))
  else if (opts.days) query.set('days', String(opts.days))
  const res = await fetch(`${base}/civicrm/souphouse/events?${query}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`CRM events ${res.status}`)
  const data = await res.json()
  return Array.isArray(data?.events) ? data.events : []
}

// "Thursday, December 10", in Soup House time whatever the visitor's (or the
// server's) timezone.
const TZ = 'America/Chicago'
export const eventDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric' })
