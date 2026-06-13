import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { DEFAULT_CALENDAR_SOURCE } from '../../lib/calendar'

// Same-origin cached proxy for the Gancio events widget. Runs as a serverless
// function (like the Keystatic routes); Vercel's edge caches the response, so
// while Gancio is unreachable the edge keeps serving the last good copy for up
// to STALE_SECONDS instead of breaking the homepage calendar.
export const prerender = false

const FRESH_SECONDS = 300
const STALE_SECONDS = 604800 // 7 days

// Only proxy to Gancio instances actually configured in content (or the
// default), so this route can't be used to fetch arbitrary URLs.
let allowedOrigins: Promise<Set<string>> | undefined

function calendarOrigins(): Promise<Set<string>> {
  allowedOrigins ??= getCollection('pages').then((pages) => {
    const origins = new Set([new URL(DEFAULT_CALENDAR_SOURCE).origin])
    for (const page of pages) {
      for (const block of page.data.blocks) {
        if (block.discriminant !== 'calendar' || !block.value.source) continue
        try {
          origins.add(new URL(block.value.source).origin)
        } catch {
          // unparseable source in content; skip
        }
      }
    }
    return origins
  })
  return allowedOrigins
}

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })

export const GET: APIRoute = async ({ url }) => {
  let origin: string
  try {
    origin = new URL(url.searchParams.get('source') ?? DEFAULT_CALENDAR_SOURCE).origin
  } catch {
    return json({ error: 'invalid source' }, { status: 400 })
  }
  if (!(await calendarOrigins()).has(origin)) {
    return json({ error: 'unknown source' }, { status: 403 })
  }

  // Hour-aligned start keeps the upstream query (and edge cache key) stable;
  // the widget applies the precise "from now on" cutoff client-side.
  const start = Math.floor(Date.now() / 1000 / 3600) * 3600
  try {
    const upstream = await fetch(`${origin}/api/events?start=${start}&max=200`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`)
    const events = await upstream.json()
    return json(Array.isArray(events) ? events : [], {
      headers: {
        'Cache-Control': `public, s-maxage=${FRESH_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
      },
    })
  } catch {
    // No cache headers on errors: a failed revalidation must not evict the
    // stale copy the edge is still serving.
    return json({ error: 'calendar unreachable' }, { status: 502 })
  }
}
