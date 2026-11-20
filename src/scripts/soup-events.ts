// Client side of Soup House's own events (from the CRM, via /api/soup-events):
// the "Our events" block and the /volunteer page.
import type { SoupEvent } from '../lib/soupEvents'

const TZ = 'America/Chicago'
const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric' })
const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })
const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export async function loadEvents(query: string): Promise<SoupEvent[]> {
  const res = await fetch(`/api/soup-events?${query}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`events ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export const signupHref = (e: SoupEvent) => `/volunteer?event=${e.id}`

// One event as a card. `button` adds "Sign up to help" when it wants volunteers.
export function eventCard(e: SoupEvent, button = true): string {
  const lines = [`${esc(e.title)} · ${esc(time(e.start))}`]
  if (e.location) lines.push(esc(e.location))
  if (e.menu) lines.push(`<strong>On the menu:</strong> ${esc(e.menu)}`)
  return `<article class="card bg-base-100 shadow-sm">
  <div class="card-body gap-1 p-5">
    <h3 class="font-heading text-primary text-xl">${esc(day(e.start))}</h3>
    <p class="text-base-content/80">${lines.join('<br>')}</p>
    ${button && e.volunteers_wanted ? `<div class="card-actions mt-2"><a class="btn btn-primary btn-sm" href="${signupHref(e)}">Sign up to help</a></div>` : ''}
  </div>
</article>`
}

function bindBlocks() {
  document.querySelectorAll<HTMLElement>('[data-soup-events]').forEach(async (el) => {
    if (el.dataset.bound) return
    el.dataset.bound = '1'
    const max = Number(el.dataset.max) || 8
    try {
      let events = await loadEvents(`days=${Number(el.dataset.days) || 60}`)
      if (el.dataset.onlyVolunteers === 'true') events = events.filter((e) => e.volunteers_wanted)
      events = events.slice(0, max)
      el.innerHTML = events.length
        ? `<div class="grid gap-4 sm:grid-cols-2">${events.map((e) => eventCard(e)).join('')}</div>`
        : '<p class="text-base-content/60 py-6 text-center">Nothing on the calendar right now. Check back soon!</p>'
    } catch {
      el.innerHTML = '<p class="text-base-content/60 py-6 text-center">Our events aren\'t loading right now. Please try again later.</p>'
    }
  })
}

document.addEventListener('astro:page-load', bindBlocks)
