// Renders live Gancio events into any [data-gancio] container on the page.
// One fetch per source (cached); each container picks its tag filter and view
// (a simple list, or a tabbed List / Calendar grid / Map widget). Map tiles use
// Leaflet + OpenStreetMap, lazy-loaded only when the Map tab is first opened.

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

function filterByTags(events, tagsCsv) {
  const want = (tagsCsv || '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
  if (!want.length) return events
  return events.filter((ev) => (ev.tags || []).some((t) => want.includes(String(t).toLowerCase())))
}

function listHtml(events, source, max) {
  if (!events.length)
    return `<li class="text-base-content/50 col-span-full py-10 text-center">No upcoming events yet — check back soon.</li>`
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
    panel.innerHTML = `<div class="text-base-content/50 py-10 text-center">No events with a location to map yet.</div>`
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

async function initWidget(el) {
  const source = el.dataset.source
  const tags = el.dataset.tags || ''
  const max = parseInt(el.dataset.max || '6', 10) || 6
  const all = await getEvents(source)
  const events = filterByTags(all, tags).sort((a, b) => a.start_datetime - b.start_datetime)

  if (el.dataset.view !== 'tabs') {
    el.innerHTML = `<ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${listHtml(events, source, max)}</ul>`
    return
  }

  const enabled = (el.dataset.tabs || 'list,calendar,map').split(',').map((s) => s.trim()).filter(Boolean)
  if (!enabled.length) enabled.push('list')
  const def = enabled.includes(el.dataset.default) ? el.dataset.default : enabled[0]
  const labels = { list: 'List', calendar: 'Calendar', map: 'Map' }

  el.innerHTML = `
    <div role="tablist" class="tabs tabs-boxed mb-8 justify-center">
      ${enabled.map((t) => `<button role="tab" data-tab="${t}" class="tab">${labels[t] || t}</button>`).join('')}
    </div>
    ${enabled.includes('list') ? `<div data-panel="list" class="hidden"><ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${listHtml(events, source, max)}</ul></div>` : ''}
    ${enabled.includes('calendar') ? `<div data-panel="calendar" class="hidden"></div>` : ''}
    ${enabled.includes('map') ? `<div data-panel="map" class="hidden"></div>` : ''}
  `

  const today = new Date()
  let gy = today.getFullYear()
  let gm = today.getMonth()
  const gridPanel = el.querySelector('[data-panel="calendar"]')
  const drawGrid = () => {
    if (gridPanel) gridPanel.innerHTML = gridHtml(events, source, gy, gm)
  }
  if (gridPanel)
    gridPanel.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-cal-nav]')
      if (!nav) return
      gm += parseInt(nav.dataset.calNav, 10)
      if (gm < 0) {
        gm = 11
        gy--
      } else if (gm > 11) {
        gm = 0
        gy++
      }
      drawGrid()
    })

  const mapPanel = el.querySelector('[data-panel="map"]')
  let mapDone = false

  function show(tab) {
    el.querySelectorAll('[data-panel]').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== tab))
    el.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('tab-active', b.dataset.tab === tab))
    if (tab === 'calendar') drawGrid()
    if (tab === 'map' && !mapDone) {
      mapDone = true
      renderMap(mapPanel, events, source)
    }
  }
  el.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => show(b.dataset.tab)))
  show(def)
}

function initCalendars() {
  document.querySelectorAll('[data-gancio]').forEach((el) => {
    if (el.dataset.gancioInit) return
    el.dataset.gancioInit = '1'
    initWidget(el)
  })
}

document.addEventListener('astro:page-load', initCalendars)
