// Renders the live Gancio events widget into any [data-gancio] container.
// One fetch per source (cached). A small `state` (active tag filters, timeframe,
// an optional "within X miles of <place>" location filter, current tab, and map
// style) drives everything: changing a control re-runs applyFilters() and
// redraws the visible view, so List / Calendar / Map stay in sync. Tabs and
// filters share one control bar. Geocoding uses Nominatim (OpenStreetMap), only
// when the visitor submits an address/ZIP — we never request browser location.
// Map tiles use Leaflet, lazy-loaded when the Map tab is opened.

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
  (csv || '').split(',').map((t) => t.trim()).filter(Boolean)
const eventTags = (ev) => (ev.tags || []).map((t) => String(t).toLowerCase())
const hasCoords = (ev) => ev.place && ev.place.latitude && ev.place.longitude

function milesBetween(a, b) {
  const R = 3958.8
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Geocode an address/ZIP via Nominatim. Called only on submit (low volume).
async function geocode(q) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q=${encodeURIComponent(q)}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    const data = await res.json()
    if (!Array.isArray(data) || !data.length) return null
    const label = String(data[0].display_name || q).split(',').slice(0, 2).join(',')
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label }
  } catch {
    return null
  }
}

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
  return [now, null]
}

function applyFilters(events, { baseTags = [], activeTags = [], timeframe = 'all', center = null, radiusMi = 0 }) {
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
      if (center && radiusMi) {
        if (!hasCoords(ev)) return false
        if (milesBetween(center, { lat: ev.place.latitude, lng: ev.place.longitude }) > radiusMi) return false
      }
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

const MAP_TILES = {
  standard: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors' },
  light: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap, &copy; CARTO' },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap, &copy; CARTO' },
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

async function renderMap(panel, events, source, { style, center, radiusMi }) {
  const located = events.filter(hasCoords)
  if (!located.length && !center) {
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
  const tiles = MAP_TILES[style] || MAP_TILES.standard
  L.tileLayer(tiles.url, { attribution: tiles.attribution, maxZoom: 19 }).addTo(map)

  const bounds = []
  for (const ev of located) {
    L.marker([ev.place.latitude, ev.place.longitude])
      .addTo(map)
      .bindPopup(
        `<strong>${esc(ev.title)}</strong><br>${fmtDate(ev.start_datetime)} · ${fmtTime(ev.start_datetime)}<br>${esc(
          ev.place.name || ''
        )}<br><a href="${eventUrl(source, ev)}" target="_blank" rel="noopener">Details</a>`
      )
    bounds.push([ev.place.latitude, ev.place.longitude])
  }

  if (center) {
    L.circleMarker([center.lat, center.lng], {
      radius: 6,
      color: '#c1432b',
      fillColor: '#c1432b',
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup('Search area center')
    const circle = L.circle([center.lat, center.lng], {
      radius: radiusMi * 1609.34,
      color: '#c1432b',
      weight: 1,
      fillOpacity: 0.05,
    }).addTo(map)
    map.fitBounds(circle.getBounds(), { padding: [20, 20] })
  } else if (bounds.length) {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 })
  } else {
    map.setView([38.63, -90.23], 11)
  }
  setTimeout(() => map.invalidateSize(), 60)
}

// ----- control bar (tabs + filters, together) ------------------------------

const TAB_LABELS = { list: 'List', calendar: 'Calendar', map: 'Map' }
const TIMEFRAMES = [
  ['today', 'Today'],
  ['7', 'Next 7 days'],
  ['30', 'Next 30 days'],
  ['90', 'Next 3 months'],
  ['all', 'All upcoming'],
]
const RADII = [1, 3, 5, 10, 25]
const MAP_STYLES = [
  ['standard', 'Standard'],
  ['light', 'Light'],
  ['dark', 'Dark'],
]

function barHtml(enabled, state, presets, allTags, opts) {
  const tabBtns = enabled
    .map(
      (t) =>
        `<button role="tab" data-tab="${t}" class="tab ${t === state.tab ? 'tab-active' : ''}">${TAB_LABELS[t] || t}</button>`
    )
    .join('')

  if (!opts.showFilters)
    return `<div class="bg-base-200 mb-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl p-3">
      <div role="tablist" class="tabs tabs-boxed bg-base-300">${tabBtns}</div></div>`

  const chipTags = [...new Set([...presets, ...state.activeTags])]
  const chips = chipTags
    .map((t) => {
      const on = state.activeTags.has(t.toLowerCase())
      return `<button type="button" data-tag-chip="${esc(t)}" class="btn btn-xs ${on ? 'btn-primary' : 'btn-outline'}">${esc(t)}</button>`
    })
    .join('')
  const tfOptions = TIMEFRAMES.map(
    ([v, l]) => `<option value="${v}" ${v === state.timeframe ? 'selected' : ''}>${l}</option>`
  ).join('')

  let location = ''
  if (opts.showLocation) {
    if (state.center) {
      location = `<span class="badge badge-primary gap-1">Within ${state.radiusMi} mi of ${esc(state.locationLabel)}
        <button type="button" data-loc-clear aria-label="Clear location filter">✕</button></span>`
    } else {
      const radii = RADII.map((r) => `<option value="${r}" ${r === state.radiusMi ? 'selected' : ''}>${r} mi</option>`).join('')
      location = `<span class="flex items-center gap-1 text-sm">within
        <select data-radius class="select select-bordered select-xs">${radii}</select> of
        <input type="text" data-loc-input placeholder="address or ZIP" class="input input-bordered input-xs w-32" aria-label="Address or ZIP" />
        <button type="button" data-loc-go class="btn btn-xs">Go</button></span>`
    }
    if (state.locError) location += `<span class="text-error text-xs">${esc(state.locError)}</span>`
  }

  const styleSel =
    state.tab === 'map'
      ? `<select data-map-style class="select select-bordered select-xs" aria-label="Map style">${MAP_STYLES.map(
          ([v, l]) => `<option value="${v}" ${v === state.mapStyle ? 'selected' : ''}>${l}</option>`
        ).join('')}</select>`
      : ''

  const datalist = `<datalist id="gancio-all-tags">${[...new Set(allTags)]
    .map((t) => `<option value="${esc(t)}"></option>`)
    .join('')}</datalist>`

  return `
    <div class="bg-base-200 mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3">
      <div role="tablist" class="tabs tabs-boxed bg-base-300">${tabBtns}</div>
      <div class="flex flex-wrap items-center gap-2">
        ${chips}
        <input type="text" list="gancio-all-tags" data-tag-input placeholder="Add tag…"
               class="input input-bordered input-xs w-28" aria-label="Add a tag filter" />
        <select data-timeframe class="select select-bordered select-xs" aria-label="Timeframe">${tfOptions}</select>
        ${location}
        ${styleSel}
        ${datalist}
      </div>
    </div>`
}

// ----- widget --------------------------------------------------------------

async function initWidget(el) {
  const source = el.dataset.source
  const baseTags = parseTags(el.dataset.tags)
  const max = parseInt(el.dataset.max || '6', 10) || 6
  const all = await getEvents(source)

  const enabled = (el.dataset.tabs || 'list,calendar,map').split(',').map((s) => s.trim()).filter(Boolean)
  if (!enabled.length) enabled.push('list')
  const presets = parseTags(el.dataset.presetTags)
  const allTags = [...new Set(all.flatMap((ev) => ev.tags || []))]
  const opts = {
    showFilters: el.dataset.showFilters !== 'false',
    showLocation: el.dataset.showLocation !== 'false' && enabled.includes('map'),
  }

  const state = {
    activeTags: new Set(),
    timeframe: el.dataset.timeframe || '30',
    tab: enabled.includes(el.dataset.default) ? el.dataset.default : enabled[0],
    gy: new Date().getFullYear(),
    gm: new Date().getMonth(),
    center: null,
    radiusMi: 5,
    locationLabel: '',
    locError: '',
    mapStyle: el.dataset.mapStyle || 'standard',
  }

  el.innerHTML = `
    <div data-bar></div>
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

  const filtered = () =>
    applyFilters(all, {
      baseTags,
      activeTags: state.activeTags,
      timeframe: state.timeframe,
      center: state.center,
      radiusMi: state.radiusMi,
    })
  const drawBar = () => {
    bar.innerHTML = barHtml(enabled, state, presets, allTags, opts)
  }
  const drawView = (tab) => {
    const events = filtered()
    if (tab === 'list' && panels.list)
      panels.list.innerHTML = `<ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${listHtml(events, source, max)}</ul>`
    if (tab === 'calendar' && panels.calendar) panels.calendar.innerHTML = gridHtml(events, source, state.gy, state.gm)
    if (tab === 'map' && panels.map)
      renderMap(panels.map, events, source, { style: state.mapStyle, center: state.center, radiusMi: state.radiusMi })
  }
  const refresh = () => {
    drawBar()
    drawView(state.tab)
  }
  const showTab = (tab) => {
    state.tab = tab
    Object.entries(panels).forEach(([k, p]) => p && p.classList.toggle('hidden', k !== tab))
    drawBar()
    drawView(tab)
  }

  async function runGeocode(q) {
    if (!q.trim()) return
    state.locError = ''
    const r = await geocode(q.trim())
    if (r) {
      state.center = { lat: r.lat, lng: r.lng }
      state.locationLabel = r.label
    } else {
      state.center = null
      state.locError = "Couldn't find that place."
    }
    refresh()
  }

  el.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-tab]')
    if (tabBtn) return showTab(tabBtn.dataset.tab)
    const chip = e.target.closest('[data-tag-chip]')
    if (chip) {
      const t = chip.dataset.tagChip.toLowerCase()
      state.activeTags.has(t) ? state.activeTags.delete(t) : state.activeTags.add(t)
      return refresh()
    }
    if (e.target.closest('[data-loc-go]')) {
      return runGeocode(el.querySelector('[data-loc-input]')?.value || '')
    }
    if (e.target.closest('[data-loc-clear]')) {
      state.center = null
      state.locationLabel = ''
      return refresh()
    }
    const nav = e.target.closest('[data-cal-nav]')
    if (nav) {
      state.gm += parseInt(nav.dataset.calNav, 10)
      if (state.gm < 0) {
        state.gm = 11
        state.gy--
      } else if (state.gm > 11) {
        state.gm = 0
        state.gy++
      }
      drawView('calendar')
    }
  })
  el.addEventListener('change', (e) => {
    if (e.target.closest('[data-timeframe]')) {
      state.timeframe = e.target.value
      return refresh()
    }
    if (e.target.closest('[data-radius]')) {
      state.radiusMi = parseInt(e.target.value, 10) || 5
      if (state.center) refresh()
      return
    }
    if (e.target.closest('[data-map-style]')) {
      state.mapStyle = e.target.value
      if (state.tab === 'map') drawView('map')
    }
  })
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return
    const tagInput = e.target.closest('[data-tag-input]')
    if (tagInput && tagInput.value.trim()) {
      state.activeTags.add(tagInput.value.trim().toLowerCase())
      tagInput.value = ''
      return refresh()
    }
    const locInput = e.target.closest('[data-loc-input]')
    if (locInput) {
      e.preventDefault()
      runGeocode(locInput.value)
    }
  })

  showTab(state.tab)
}

function initCalendars() {
  document.querySelectorAll('[data-gancio]').forEach((el) => {
    if (el.dataset.gancioInit) return
    el.dataset.gancioInit = '1'
    initWidget(el)
  })
}

document.addEventListener('astro:page-load', initCalendars)
