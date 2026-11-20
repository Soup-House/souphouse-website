import type { APIRoute } from 'astro'
import { fetchSoupEvents } from '../../lib/soupEvents'

// Same-origin cached proxy for Soup House's own events from the CRM (the
// "Our events" block and /volunteer). Like /api/events for the community
// calendar: the edge keeps serving the last good copy for up to a week if the
// CRM is unreachable.
//   ?days=60  how far ahead (1-180)
//   ?id=12    one event
export const prerender = false

const FRESH_SECONDS = 300
const STALE_SECONDS = 604800 // 7 days

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })

export const GET: APIRoute = async ({ url }) => {
  const id = Number(url.searchParams.get('id') ?? 0)
  const days = Math.min(Math.max(Number(url.searchParams.get('days') ?? 60) || 60, 1), 180)
  if (!Number.isInteger(id) || id < 0) return json({ error: 'invalid id' }, { status: 400 })
  try {
    const events = await fetchSoupEvents(id ? { id } : { days })
    return json(events, {
      headers: { 'Cache-Control': `public, s-maxage=${FRESH_SECONDS}, stale-while-revalidate=${STALE_SECONDS}` },
    })
  } catch {
    // No cache headers on errors: a failed revalidation must not evict the
    // stale copy the edge is still serving.
    return json({ error: 'events unreachable' }, { status: 502 })
  }
}
