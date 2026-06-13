import type { APIRoute } from 'astro'
import { callFormProcessor, crmConfigured } from '../../../lib/crm'

// Volunteer / partner / contact forms post here; each kind maps to a CRM
// form processor. Strict allowlist — unknown kinds 404.
export const prerender = false

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FORMS: Record<string, { processor: string; required: string[]; optional: string[] }> = {
  volunteer: { processor: 'volunteer_signup', required: ['first_name', 'last_name', 'email'], optional: ['message'] },
  partner: { processor: 'partner_inquiry', required: ['first_name', 'last_name', 'email', 'organization'], optional: ['message'] },
  contact: { processor: 'contact_message', required: ['first_name', 'last_name', 'email', 'message'], optional: [] },
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

  const ok = await callFormProcessor(def.processor, payload)
  return ok ? json({ ok: true }) : json({ ok: false, error: 'upstream' }, 502)
}
