// Renders the live Gancio events widget into any [data-gancio] container.
// One fetch per source (cached). A small `state` (active tag filters, timeframe,
// an optional "within X miles of <place>" location filter, current tab, and map
// style) drives everything: changing a control re-runs applyFilters() and
// redraws the visible view, so List / Calendar / Map stay in sync. Tabs and
// filters share one control bar; tags are a checkbox dropdown with the chosen
// ones shown as removable pills. Geocoding uses Nominatim (OpenStreetMap), only
// when the visitor submits an address/ZIP — we never request browser location.
// Map tiles use Leaflet, lazy-loaded when the Map tab is opened.

const cache = new Map()

// Events come through the site's own /api/events proxy, whose edge cache keeps
// serving the last good copy when Gancio is unreachable. If the proxy itself
// is unavailable (e.g. a static preview build), fall back to asking Gancio
// directly. Resolves to null when both fail, so the widget can tell "couldn't
// load" apart from "zero upcoming events".
function getEvents(source) {
  if (!cache.has(source)) {
    const start = Math.floor(Date.now() / 1000 / 3600) * 3600
    cache.set(
      source,
      fetch(`/api/events?source=${encodeURIComponent(source)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`proxy ${r.status}`))))
        .catch(() => fetch(`${source}/api/events?start=${start}&max=200`).then((r) => r.json()))
        .then((e) => (Array.isArray(e) ? e : []))
        .catch(() => null)
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

// Tag sets keep the original casing for display; matching is case-insensitive.
const tagKey = (t) => String(t).toLowerCase()
const hasTag = (set, t) => [...set].some((x) => tagKey(x) === tagKey(t))
function removeTag(set, t) {
  const x = [...set].find((v) => tagKey(v) === tagKey(t))
  if (x !== undefined) set.delete(x)
}
function toggleTag(set, t) {
  hasTag(set, t) ? removeTag(set, t) : set.add(t)
}

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
  const base = baseTags.map(tagKey)
  const active = [...activeTags].map(tagKey)
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
    L.circleMarker([center.lat, center.lng], { radius: 6, color: '#c1432b', fillColor: '#c1432b', fillOpacity: 1 })
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

function pillsHtml(activeTags) {
  return [...activeTags]
    .map(
      (t) =>
        `<span class="badge badge-primary gap-1">${esc(t)}<button type="button" data-tag-remove="${esc(t)}" class="ml-0.5 font-bold" aria-label="Remove ${esc(t)} filter">✕</button></span>`
    )
    .join('')
}

function barHtml(enabled, state, presets, allTags, opts) {
  const tabBtns = enabled
    .map(
      (t) =>
        `<button role="tab" data-tab="${t}" class="tab ${t === state.tab ? 'tab-active' : ''}">${TAB_LABELS[t] || t}</button>`
    )
    .join('')
  const tabs = `<div role="tablist" class="tabs tabs-box">${tabBtns}</div>`

  if (!opts.showFilters) return `<div class="mb-8 flex justify-center">${tabs}</div>`

  // Menu lists the preset tags plus any active tag that isn't a preset.
  const menuTags = [...presets]
  state.activeTags.forEach((t) => {
    if (!presets.some((p) => tagKey(p) === tagKey(t))) menuTags.push(t)
  })
  const menuItems = menuTags
    .map(
      (t) =>
        `<li><label class="flex cursor-pointer items-center gap-2 px-2 py-1">
          <input type="checkbox" data-tag-check="${esc(t)}" class="checkbox checkbox-sm" ${hasTag(state.activeTags, t) ? 'checked' : ''} />
          <span>${esc(t)}</span></label></li>`
    )
    .join('')
  const datalist = `<datalist id="gancio-all-tags">${[...new Set(allTags)]
    .map((t) => `<option value="${esc(t)}"></option>`)
    .join('')}</datalist>`
  const tagsControl = `
    <div class="dropdown">
      <div tabindex="0" role="button" class="btn btn-sm">Tags ▾</div>
      <div tabindex="0" class="dropdown-content bg-base-100 rounded-box z-10 mt-2 w-56 p-2 shadow">
        <ul class="menu menu-sm w-full p-0">${menuItems || '<li class="text-base-content/50 px-2 py-1 text-sm">No preset tags</li>'}</ul>
        <div class="border-base-300 mt-1 border-t pt-2">
          <input type="text" list="gancio-all-tags" data-tag-input placeholder="+ add tag"
                 class="input input-sm w-full" aria-label="Add a tag filter" />
        </div>
      </div>
    </div>
    <span data-tag-pills class="flex flex-wrap items-center gap-1">${pillsHtml(state.activeTags)}</span>`

  const tfOptions = TIMEFRAMES.map(
    ([v, l]) => `<option value="${v}" ${v === state.timeframe ? 'selected' : ''}>${l}</option>`
  ).join('')

  let location = ''
  if (opts.showLocation) {
    if (state.center) {
      location = `<span class="badge badge-primary badge-lg gap-1">Within ${state.radiusMi} mi of ${esc(state.locationLabel)}
        <button type="button" data-loc-clear class="ml-1 font-bold" aria-label="Clear location filter">✕</button></span>`
    } else {
      const radii = RADII.map((r) => `<option value="${r}" ${r === state.radiusMi ? 'selected' : ''}>${r} mi</option>`).join('')
      location = `<div class="join">
        <select data-radius class="select select-sm join-item">${radii}</select>
        <input type="text" data-loc-input placeholder="address or ZIP" class="input input-sm join-item w-40" aria-label="Address or ZIP" />
        <button type="button" data-loc-go class="btn btn-sm btn-primary join-item">Go</button></div>`
    }
    if (state.locError) location += `<span class="text-error text-sm">${esc(state.locError)}</span>`
  }

  const styleSel =
    state.tab === 'map'
      ? `<select data-map-style class="select select-sm" aria-label="Map style">${MAP_STYLES.map(
          ([v, l]) => `<option value="${v}" ${v === state.mapStyle ? 'selected' : ''}>${l}</option>`
        ).join('')}</select>`
      : ''

  return `
    <div class="bg-base-200 mb-8 space-y-4 rounded-2xl p-4">
      <div class="flex justify-center">${tabs}</div>
      <div class="flex flex-wrap items-center justify-center gap-2">
        ${tagsControl}
        <select data-timeframe class="select select-sm" aria-label="Timeframe">${tfOptions}</select>
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
  if (all === null) {
    el.innerHTML = `<div class="text-base-content/50 py-10 text-center">The calendar isn't loading right now — please try again later, or open the full calendar below.</div>`
    return
  }

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
  const updatePills = () => {
    const c = el.querySelector('[data-tag-pills]')
    if (c) c.innerHTML = pillsHtml(state.activeTags)
  }
  // Tag changes update pills + views in place, keeping the dropdown open.
  const tagsChanged = () => {
    updatePills()
    drawView(state.tab)
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
    const rm = e.target.closest('[data-tag-remove]')
    if (rm) {
      const t = rm.dataset.tagRemove
      removeTag(state.activeTags, t)
      el.querySelectorAll('[data-tag-check]').forEach((cb) => {
        if (tagKey(cb.dataset.tagCheck) === tagKey(t)) cb.checked = false
      })
      return tagsChanged()
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
    const check = e.target.closest('[data-tag-check]')
    if (check) {
      toggleTag(state.activeTags, check.dataset.tagCheck)
      return tagsChanged()
    }
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
      e.preventDefault()
      if (!hasTag(state.activeTags, tagInput.value.trim())) state.activeTags.add(tagInput.value.trim())
      tagInput.value = ''
      return tagsChanged()
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
