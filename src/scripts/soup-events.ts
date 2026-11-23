// Client side of Soup House's own events (from the CRM, via /api/soup-events):
// the "Our events" block and the /volunteer and /reserve pages.
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
export const reserveHref = (e: SoupEvent) => `/reserve?event=${e.id}`

// "12 spots left", "1 spot left"; nothing when there's no limit.
export const spotsLeft = (e: SoupEvent) =>
  e.reserve_url && e.spots_left != null ? `${e.spots_left} spot${e.spots_left === 1 ? '' : 's'} left` : ''

// One event as a card: the flyer, the date, then name and time, place,
// description, menu and cost. `buttons` adds what the event offers: "Reserve
// a spot", "Get tickets", "Sign up to help" (the /reserve and /volunteer pages
// show the card without them, above their form).
export function eventCard(e: SoupEvent, buttons = true): string {
  const lines = [`${esc(e.title)} · ${esc(time(e.start))}`]
  if (e.location) lines.push(esc(e.location))
  const more: string[] = []
  if (e.summary) more.push(esc(e.summary.trim()).replace(/\r?\n/g, '<br>'))
  if (e.menu) more.push(`<strong>On the menu:</strong> ${esc(e.menu)}`)
  if (e.cost) more.push(`<strong>Cost:</strong> ${esc(e.cost)}`)
  if (e.reservations && !e.reserve_url) more.push('<em>Reservations are full.</em>')
  const actions = buttons
    ? [
        e.reserve_url && `<a class="btn btn-primary btn-sm" href="${reserveHref(e)}">Reserve a spot</a>`,
        e.ticket_url && `<a class="btn btn-primary btn-sm" href="${esc(e.ticket_url)}" target="_blank" rel="noopener">Get tickets</a>`,
        e.volunteers_wanted && `<a class="btn btn-primary btn-sm" href="${signupHref(e)}">Sign up to help</a>`,
      ].filter(Boolean)
    : []
  const left = buttons ? spotsLeft(e) : ''
  return `<article class="card bg-base-100 shadow-sm">
  ${e.flyer_url ? `<figure class="bg-base-200"><a href="${esc(e.flyer_url)}" target="_blank" rel="noopener"><img src="${esc(e.flyer_url)}" alt="Flyer: ${esc(e.title)}" loading="lazy" class="max-h-80 w-auto object-contain" /></a></figure>` : ''}
  <div class="card-body gap-1 p-5">
    <h3 class="font-heading text-primary text-xl">${esc(day(e.start))}</h3>
    <p class="text-base-content/80">${lines.join('<br>')}</p>
    ${more.map((m) => `<p class="text-base-content/80 mt-1">${m}</p>`).join('')}
    ${actions.length ? `<div class="card-actions mt-2 items-center">${actions.join('')}${left ? `<span class="text-base-content/60 text-sm">${left}</span>` : ''}</div>` : ''}
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
