// Prepares accessible places and disabled parking spaces for all of France, split into zones.
// CURRENTLY UNUSED: the app no longer reads prepared data (the hosting site was removed); it queries
// Overpass and data.gouv live and keeps visited neighbourhoods on the phone. Kept so that the
// weekly preparation can be switched back on if the public servers become too unreliable
// (docs/decisions/donnees, D6). Run by hand from GitHub Actions (.github/workflows/data.yml).
//
//   node scripts/prepare-data.mjs --osm france.geojsonseq[,guadeloupe.geojsonseq…] [--out data-out] [--bbox s,w,n,e]
//
// --osm: GeoJSON sequences exported by osmium from the Geofabrik extracts (see data.yml for the
//        exact commands). Locally: `brew install osmium-tool` and a regional extract.
// --bbox: limits the output to one area, for local testing.
// No npm dependencies: Node 20+ is enough.

import { createReadStream } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { GRID, REQUIRED_COLUMNS, acceslibrePlace, csvRows, featureToElement, zoneKey } from './lib/prepare.mjs'

const ACCESLIBRE_CSV = 'https://www.data.gouv.fr/api/1/datasets/r/93ae96a7-1db7-4cb4-a9f1-6d778370b640'

const LICENCES = {
  osm: '© OpenStreetMap contributors, Open Database License (ODbL) 1.0 — https://www.openstreetmap.org/copyright',
  acceslibre: 'Acceslibre (data.gouv.fr), Licence Ouverte / Open Licence 2.0 — https://www.data.gouv.fr/fr/datasets/acceslibre/',
}
const README = `Handiplan — prepared data
Accessible places and disabled parking spaces in France, split into zones, for the Handiplan app.

osm/        ${LICENCES.osm}
            This is a derivative database of OpenStreetMap, made available under the same licence.
acceslibre/ ${LICENCES.acceslibre}

Generated on ${new Date().toISOString().slice(0, 10)} by scripts/prepare-data.mjs.
`

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, a, i, all) => (a.startsWith('--') ? [...pairs, [a.slice(2), all[i + 1]]] : pairs), []),
)
if (!args.osm) throw new Error('Missing --osm: GeoJSON sequence file(s) exported by osmium')
const OUT_DIR = args.out ?? 'data-out'
const BBOX = args.bbox?.split(',').map(Number)
const insideBbox = (lat, lon) =>
  !BBOX || (lat >= BBOX[0] && lon >= BBOX[1] && lat <= BBOX[2] && lon <= BBOX[3])

function addTo(zones, lat, lon, item) {
  const key = zoneKey(lat, lon)
  if (!zones.has(key)) zones.set(key, [])
  zones.get(key).push(item)
}

async function prepareOsm(files) {
  const zones = new Map()
  for (const file of files) {
    console.log(`OSM: reading ${file}`)
    for await (const line of createInterface({ input: createReadStream(file), crlfDelay: Infinity })) {
      // Strips the RFC 8142 record separator in case osmium was run without disabling it.
      const json = line.replace(/^\x1e/, '').trim()
      if (!json) continue
      const element = featureToElement(JSON.parse(json))
      if (element && insideBbox(element.lat, element.lon)) addTo(zones, element.lat, element.lon, element)
    }
  }
  return zones
}

async function prepareAcceslibre() {
  console.log('Acceslibre: downloading the national file…')
  const r = await fetch(ACCESLIBRE_CSV, { redirect: 'follow' })
  if (!r.ok) throw new Error(`Acceslibre ${r.status}`)
  const zones = new Map()
  let header
  for await (const cells of csvRows(r.body)) {
    if (!header) {
      header = cells
      const missing = REQUIRED_COLUMNS.filter(c => !header.includes(c))
      if (missing.length) throw new Error(`The Acceslibre file format changed, missing: ${missing.join(', ')}`)
      continue
    }
    const place = acceslibrePlace(Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ''])))
    if (place && insideBbox(place.latitude, place.longitude)) addTo(zones, place.latitude, place.longitude, place)
  }
  return zones
}

async function writeZones(folder, zones) {
  await mkdir(join(OUT_DIR, folder), { recursive: true })
  for (const [key, content] of zones) {
    await writeFile(join(OUT_DIR, folder, `${key}.json`), JSON.stringify(content))
  }
}

const [osm, acceslibre] = await Promise.all([prepareOsm(args.osm.split(',')), prepareAcceslibre()])
await writeZones('osm', osm)
await writeZones('acceslibre', acceslibre)

const count = zones => [...zones.values()].reduce((n, list) => n + list.length, 0)
// The app reads `osm.zones` and `acceslibre.zones` to know which zone files exist.
await writeFile(join(OUT_DIR, 'index.json'), JSON.stringify({
  date: new Date().toISOString(),
  grid: GRID,
  // Area covered by these files; the app goes back to live servers outside it.
  bbox: BBOX ?? null,
  osm: { zones: [...osm.keys()], total: count(osm) },
  acceslibre: { zones: [...acceslibre.keys()], total: count(acceslibre) },
  licences: LICENCES,
}))
// These files are a public derivative of OpenStreetMap: the ODbL requires saying so, with credit.
await writeFile(join(OUT_DIR, 'README.txt'), README)
// The app runs on another domain: allow cross-origin reads (CORS) and caching.
await writeFile(join(OUT_DIR, '_headers'), '/*\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=86400\n')
console.log(`Done: ${count(osm)} OSM elements in ${osm.size} zones, ${count(acceslibre)} Acceslibre places in ${acceslibre.size} zones`)
