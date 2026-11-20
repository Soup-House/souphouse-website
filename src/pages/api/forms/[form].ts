import type { APIRoute } from 'astro'
import { callFormProcessor, crmConfigured } from '../../../lib/crm'
import { eventDay, fetchSoupEvents } from '../../../lib/soupEvents'

// Volunteer / partner / contact forms post here; each kind maps to a CRM
// form processor. Strict allowlist — unknown kinds 404.
// event-volunteer (from /volunteer?event=<id>) signs someone up to help at one
// event; the event must be public and want volunteers.
export const prerender = false

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FORMS: Record<string, { processor: string; required: string[]; optional: string[] }> = {
  volunteer: { processor: 'volunteer_signup', required: ['first_name', 'last_name', 'email'], optional: ['message'] },
  partner: { processor: 'partner_inquiry', required: ['first_name', 'last_name', 'email', 'organization'], optional: ['message'] },
  contact: { processor: 'contact_message', required: ['first_name', 'last_name', 'email', 'message'], optional: [] },
  'event-volunteer': { processor: 'event_volunteer_signup', required: ['first_name', 'last_name', 'email', 'event_id'], optional: ['message'] },
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const POST: APIRoute = async ({ params, request }) => {
  const def = FORMS[params.form ?? '']
  if (!def) return json({ ok: false, error: 'unknown form' }, 404)
  if (!crmConfigured()) return json({ ok: false, error: 'not configured' }, 503)

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json({ ok: false, error: 'bad request' }, 400)
  }

  if (String(form.get('_gotcha') ?? '').trim() !== '') {
    return json({ ok: true })
  }

  const payload: Record<string, string> = { source: 'website' }
  for (const field of [...def.required, ...def.optional]) {
    const value = String(form.get(field) ?? '').trim()
    if (!value && def.required.includes(field)) {
      return json({ ok: false, error: `missing ${field}` }, 400)
    }
    if (value) payload[field] = value.slice(0, field === 'message' ? 4000 : 200)
  }
  if (!EMAIL_RE.test(payload.email) || payload.email.length > 254) {
    return json({ ok: false, error: 'invalid email' }, 400)
  }

  if (params.form === 'event-volunteer') {
    const id = Number(payload.event_id)
    if (!Number.isInteger(id) || id <= 0) return json({ ok: false, error: 'invalid event' }, 400)
    let event
    try {
      event = (await fetchSoupEvents({ id }))[0]
    } catch {
      return json({ ok: false, error: 'upstream' }, 502)
    }
    if (!event?.volunteers_wanted) return json({ ok: false, error: 'event closed' }, 409)
    payload.event_id = String(id)
    // Shows as the inquiry's subject in the CRM and the team's email.
    payload.subject = `Event volunteer: ${event.title}, ${eventDay(event.start)} -- website`.slice(0, 250)
  }

  const ok = await callFormProcessor(def.processor, payload)
  return ok ? json({ ok: true }) : json({ ok: false, error: 'upstream' }, 502)
}
