// Server-side bridge to the CRM's Form Processor API. Used by the form
// routes only — the API key lives in the runtime env and never reaches
// the browser.
const env = (name: string): string | undefined =>
  (typeof process !== 'undefined' ? process.env?.[name] : undefined) ??
  (import.meta.env[name] as string | undefined)

export const crmConfigured = (): boolean => Boolean(env('CIVI_API_KEY'))

export async function callFormProcessor(
  processor: string,
  payload: Record<string, string>
): Promise<boolean> {
  const base = env('CIVI_CRM_URL') ?? 'https://crm.souphouse.org'
  const key = env('CIVI_API_KEY')
  if (!key) return false
  try {
    const upstream = await fetch(`${base}/civicrm/ajax/rest`, {
      method: 'POST',
      headers: {
        'X-Civi-Auth': `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        entity: 'FormProcessor',
        action: processor,
        json: JSON.stringify(payload),
      }),
      signal: AbortSignal.timeout(8000),
    })
    const result = await upstream.json().catch(() => null)
    return Boolean(upstream.ok && result && !result.is_error)
  } catch {
    return false
  }
}
