import type { APIRoute } from 'astro'

// Newsletter signups: the homepage form posts here, and this route forwards
// to the CRM's Form Processor endpoint with a server-side API key. The key
// never reaches the browser; the form never talks to the CRM directly.
export const prerender = false

const CRM_URL = import.meta.env.CIVI_CRM_URL ?? 'https://crm.souphouse.org'
const API_KEY = import.meta.env.CIVI_API_KEY

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const POST: APIRoute = async ({ request }) => {
  if (!API_KEY) {
    return json({ ok: false, error: 'not configured' }, 503)
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json({ ok: false, error: 'bad request' }, 400)
  }

  // Honeypot: real visitors never fill this; bots that do get a quiet "ok".
  if (String(form.get('_gotcha') ?? '').trim() !== '') {
    return json({ ok: true })
  }

  const email = String(form.get('email') ?? '').trim()
  const firstName = String(form.get('first_name') ?? '').trim()
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ ok: false, error: 'invalid email' }, 400)
  }

  const payload: Record<string, string> = { email, source: 'website' }
  if (firstName) payload.first_name = firstName.slice(0, 100)

  try {
    const upstream = await fetch(`${CRM_URL}/civicrm/ajax/rest`, {
      method: 'POST',
      headers: {
        'X-Civi-Auth': `Bearer ${API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        entity: 'FormProcessor',
        action: 'newsletter_signup',
        json: JSON.stringify(payload),
      }),
      signal: AbortSignal.timeout(8000),
    })
    const result = await upstream.json().catch(() => null)
    if (!upstream.ok || !result || result.is_error) {
      return json({ ok: false, error: 'upstream' }, 502)
    }
    return json({ ok: true })
  } catch {
    return json({ ok: false, error: 'unreachable' }, 502)
  }
}
