import type { APIRoute } from 'astro'
import { callFormProcessor, crmConfigured } from '../../lib/crm'

// Newsletter signups: the homepage form posts here; forwarded to the CRM's
// newsletter_signup form processor. Email-only by design.
export const prerender = false

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const POST: APIRoute = async ({ request }) => {
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

  const email = String(form.get('email') ?? '').trim()
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ ok: false, error: 'invalid email' }, 400)
  }

  const ok = await callFormProcessor('newsletter_signup', { email, source: 'website' })
  return ok ? json({ ok: true }) : json({ ok: false, error: 'upstream' }, 502)
}
