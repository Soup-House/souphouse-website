// Default Gancio instance for calendar blocks. Shared by the Calendar block
// (prop default) and the /api/events proxy (allowlist seed) so a block saved
// without an explicit source still resolves to an allowed origin.
export const DEFAULT_CALENDAR_SOURCE = 'https://calendar.souphouse.org'
