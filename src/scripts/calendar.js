// Renders live Gancio events into any [data-gancio] container on the page.
// One fetch per source (cached). The tabbed widget keeps a small `state`
// (active tag filters + timeframe); changing a filter re-runs applyFilters()
// and re-renders whatever view is showing, so List / Calendar / Map all stay
// in sync. The simple list view (Meals & Distributions) just applies its
// fixed base tags. Map tiles use Leaflet + OpenStreetMap, lazy-loaded on open.

const cache = new Map()

function getEvents(source) {
  if (!cache.has(source)) {
    const now = Math.floor(Date.now() / 1000)
    cache.set(
      source,
      fetch(`${source}/api/events?start=${now}&max=200`)
        .then((r) => r.json())
        .then((e) => (Array.isArray(e) ? e : []))
        .catch(() => [])
    )
  }
  return cache.get(source)
}

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )
const eventUrl = (source, ev) => `${source}/event/${encodeURIComponent(ev.slug)}`
const fmtDate = (ts) =>
  new Date(ts * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const fmtTime = (ts) =>
  new Date(ts * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

const parseTags = (csv) =>
  (csv || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
const eventTags = (ev) => (ev.tags || []).map((t) => String(t).toLowerCase())

// ----- filtering -----------------------------------------------------------

function timeframeWindow(tf) {
  const now = Math.floor(Date.now() / 1000)
  if (tf === 'today') {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return [now, Math.floor(end.getTime() / 1000)]
  }
  const days = { '7': 7, '30': 30, '90': 90 }[tf]
  if (days) return [now, now + days * 86400]
  return [now, null] // all upcoming
}

function applyFilters(events, { baseTags = [], activeTags = [], timeframe = 'all' }) {
  const [from, to] = timeframeWindow(timeframe)
  const base = baseTags.map((t) => t.toLowerCase())
  const active = [...activeTags].map((t) => t.toLowerCase())
  return events
    .filter((ev) => {
      if (ev.start_datetime < from) return false
      if (to !== null && ev.start_datetime > to) return false
      const tags = eventTags(ev)
      if (base.length && !base.some((t) => tags.includes(t))) return false
      if (active.length && !active.some((t) => tags.includes(t))) return false
      return true
    })
    .sort((a, b) => a.start_datetime - b.start_datetime)
}

// ----- view renderers ------------------------------------------------------

function listHtml(events, source, max) {
  if (!events.length)
    return `<li class="text-base-content/50 col-span-full py-10 text-center">No matching events — try widening the filters.</li>`
  return events
    .slice(0, max)
    .map((ev) => {
      const place =
        ev.place && ev.place.name
          ? `<div class="text-base-content/70 text-sm">${esc(ev.place.name)}</div>`
          : ''
      return `<li>
        <a href="${eventUrl(source, ev)}" target="_blank" rel="noopener"
           class="card bg-base-200 h-full shadow-md transition-transform hover:-translate-y-1">
          <div class="card-body gap-2">
            <div class="text-primary font-semibold">${fmtDate(ev.start_datetime)} · ${fmtTime(ev.start_datetime)}</div>
            <h3 class="card-title text-xl">${esc(ev.title)}</h3>
            ${place}
          </div>
        </a>
      </li>`
    })
    .join('')
}

function gridHtml(events, source, year, month) {
  const first = new Date(year, month, 1)
  const startDay = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const byDay = {}
  for (const ev of events) {
    const d = new Date(ev.start_datetime * 1000)
    if (d.getFullYear() === year && d.getMonth() === month) {
      ;(byDay[d.getDate()] ||= []).push(ev)
    }
  }
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  let cells = ''
  for (let i = 0; i < startDay; i++) cells += `<div class="bg-base-100 min-h-24"></div>`
  for (let day = 1; day <= daysInMonth; day++) {
    const evs = byDay[day] || []
    const items = evs
      .slice(0, 3)
      .map(
        (ev) =>
          `<a href="${eventUrl(source, ev)}" target="_blank" rel="noopener" title="${esc(ev.title)}"
             class="text-primary block truncate text-left text-xs hover:underline">${fmtTime(ev.start_datetime)} ${esc(ev.title)}</a>`
      )
      .join('')
    const more = evs.length > 3 ? `<div class="text-base-content/50 text-xs">+${evs.length - 3} more</div>` : ''
    cells += `<div class="bg-base-100 min-h-24 space-y-0.5 p-1"><div class="text-base-content/60 text-xs font-semibold">${day}</div>${items}${more}</div>`
  }
  return `
    <div class="mb-4 flex items-center justify-between">
      <button data-cal-nav="-1" class="btn btn-ghost btn-sm" aria-label="Previous month">‹</button>
      <div class="font-heading text-xl">${first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
      <button data-cal-nav="1" class="btn btn-ghost btn-sm" aria-label="Next month">›</button>
    </div>
    <div class="border-base-300 grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-base-300">
      ${dow.map((d) => `<div class="bg-base-200 py-2 text-center text-xs font-semibold">${d}</div>`).join('')}
      ${cells}
    </div>`
}

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L)
  return new Promise((resolve) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const s = document.createElement('script')
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    s.onload = () => resolve(window.L)
    s.onerror = () => resolve(null)
    document.head.appendChild(s)
  })
}

async function renderMap(panel, events, source) {
  const located = events.filter((ev) => ev.place && ev.place.latitude && ev.place.longitude)
  if (!located.length) {
    panel.innerHTML = `<div class="text-base-content/50 py-10 text-center">No events with a location to map.</div>`
    return
  }
  const L = await loadLeaflet()
  if (!L) {
    panel.innerHTML = `<div class="text-base-content/50 py-10 text-center">Couldn't load the map.</div>`
    return
  }
  panel.innerHTML = ''
  const mapEl = document.createElement('div')
  mapEl.className = 'h-96 w-full rounded-2xl'
  panel.appendChild(mapEl)
  const map = L.map(mapEl)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)
  const points = []
  for (const ev of located) {
    L.marker([ev.place.latitude, ev.place.longitude])
      .addTo(map)
      .bindPopup(
        `<strong>${esc(ev.title)}</strong><br>${fmtDate(ev.start_datetime)} · ${fmtTime(ev.start_datetime)}<br>${esc(
          ev.place.name || ''
        )}<br><a href="${eventUrl(source, ev)}" target="_blank" rel="noopener">Details</a>`
      )
    points.push([ev.place.latitude, ev.place.longitude])
  }
  map.fitBounds(points, { padding: [30, 30], maxZoom: 15 })
  setTimeout(() => map.invalidateSize(), 60)
}

// ----- filter bar ----------------------------------------------------------

const TIMEFRAMES = [
  ['today', 'Today'],
  ['7', 'Next 7 days'],
  ['30', 'Next 30 days'],
  ['90', 'Next 3 months'],
  ['all', 'All upcoming'],
]

function barHtml(presets, activeTags, timeframe, allTags) {
  const chipTags = [...new Set([...presets, ...activeTags])]
  const chips = chipTags
    .map((t) => {
      const on = activeTags.has(t.toLowerCase())
      return `<button type="button" data-tag-chip="${esc(t)}" class="btn btn-sm ${on ? 'btn-primary' : 'btn-outline'}">${esc(t)}</button>`
    })
    .join('')
  const options = TIMEFRAMES.map(
    ([v, l]) => `<option value="${v}" ${v === timeframe ? 'selected' : ''}>${l}</option>`
  ).join('')
  const datalist = `<datalist id="gancio-all-tags">${[...new Set(allTags)]
    .map((t) => `<option value="${esc(t)}"></option>`)
    .join('')}</datalist>`
  return `
    <div class="bg-base-200 mb-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl p-4">
      <div class="flex flex-wrap items-center justify-center gap-2">
        ${chips}
        <input type="text" list="gancio-all-tags" data-tag-input placeholder="Add a tag…"
               class="input input-bordered input-sm w-32" aria-label="Add a tag filter" />
      </div>
      <select data-timeframe class="select select-bordered select-sm" aria-label="Timeframe">${options}</select>
      ${datalist}
    </div>`
}

// ----- widget --------------------------------------------------------------

async function initWidget(el) {
  const source = el.dataset.source
  const baseTags = parseTags(el.dataset.tags)
  const max = parseInt(el.dataset.max || '6', 10) || 6
  const all = await getEvents(source)

  // Simple list (e.g. Meals & Distributions): base tags only, no controls.
  if (el.dataset.view !== 'tabs') {
    const events = applyFilters(all, { baseTags, timeframe: 'all' })
    el.innerHTML = `<ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${listHtml(events, source, max)}</ul>`
    return
  }

  const enabled = (el.dataset.tabs || 'list,calendar,map').split(',').map((s) => s.trim()).filter(Boolean)
  if (!enabled.length) enabled.push('list')
  const presets = parseTags(el.dataset.presetTags)
  const allTags = [...new Set(all.flatMap((ev) => ev.tags || []))]
  const showFilters = el.dataset.showFilters !== 'false'

  const state = {
    activeTags: new Set(),
    timeframe: el.dataset.timeframe || '30',
    tab: enabled.includes(el.dataset.default) ? el.dataset.default : enabled[0],
    gy: new Date().getFullYear(),
    gm: new Date().getMonth(),
    mapDrawn: false,
  }

  const labels = { list: 'List', calendar: 'Calendar', map: 'Map' }
  el.innerHTML = `
    <div data-bar></div>
    <div role="tablist" class="tabs tabs-boxed mb-8 justify-center">
      ${enabled.map((t) => `<button role="tab" data-tab="${t}" class="tab">${labels[t] || t}</button>`).join('')}
    </div>
    ${enabled.includes('list') ? `<div data-panel="list" class="hidden"></div>` : ''}
    ${enabled.includes('calendar') ? `<div data-panel="calendar" class="hidden"></div>` : ''}
    ${enabled.includes('map') ? `<div data-panel="map" class="hidden"></div>` : ''}
  `

  const bar = el.querySelector('[data-bar]')
  const panels = {
    list: el.querySelector('[data-panel="list"]'),
    calendar: el.querySelector('[data-panel="calendar"]'),
    map: el.querySelector('[data-panel="map"]'),
  }

  const filtered = () => applyFilters(all, { baseTags, activeTags: state.activeTags, timeframe: state.timeframe })

  function drawBar() {
    if (!showFilters) return
    bar.innerHTML = barHtml(presets, state.activeTags, state.timeframe, allTags)
  }

  function drawView(tab) {
    const events = filtered()
    if (tab === 'list' && panels.list)
      panels.list.innerHTML = `<ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${listHtml(events, source, max)}</ul>`
    if (tab === 'calendar' && panels.calendar)
      panels.calendar.innerHTML = gridHtml(events, source, state.gy, state.gm)
    if (tab === 'map' && panels.map) {
      state.mapDrawn = true
      renderMap(panels.map, events, source)
    }
  }

  function refresh() {
    // Re-render the visible view now; others redraw when shown.
    drawView(state.tab)
    if (state.tab === 'map') state.mapDrawn = true
  }

  function show(tab) {
    state.tab = tab
    Object.entries(panels).forEach(([k, p]) => p && p.classList.toggle('hidden', k !== tab))
    el.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('tab-active', b.dataset.tab === tab))
    drawView(tab)
  }

  // events: tag chips, tag input, timeframe, tabs, calendar nav
  bar.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-tag-chip]')
    if (!chip) return
    const t = chip.dataset.tagChip.toLowerCase()
    state.activeTags.has(t) ? state.activeTags.delete(t) : state.activeTags.add(t)
    drawBar()
    refresh()
  })
  bar.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return
    const input = e.target.closest('[data-tag-input]')
    if (!input || !input.value.trim()) return
    state.activeTags.add(input.value.trim().toLowerCase())
    input.value = ''
    drawBar()
    refresh()
  })
  bar.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-timeframe]')
    if (!sel) return
    state.timeframe = sel.value
    refresh()
  })
  el.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => show(b.dataset.tab)))
  if (panels.calendar)
    panels.calendar.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-cal-nav]')
      if (!nav) return
      state.gm += parseInt(nav.dataset.calNav, 10)
      if (state.gm < 0) {
        state.gm = 11
        state.gy--
      } else if (state.gm > 11) {
        state.gm = 0
        state.gy++
      }
      drawView('calendar')
    })

  drawBar()
  show(state.tab)
}

function initCalendars() {
  document.querySelectorAll('[data-gancio]').forEach((el) => {
    if (el.dataset.gancioInit) return
    el.dataset.gancioInit = '1'
    initWidget(el)
  })
}

document.addEventListener('astro:page-load', initCalendars)
