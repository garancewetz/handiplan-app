// Pure helpers for prepare-data.mjs, kept apart so they can be unit-tested (prepare.test.mjs).

// Zone size in degrees (≈ 2 km): in Paris, a 5 km zone weighed about 800 KB.
export const GRID = 0.02

export const zoneKey = (lat, lon) => `${Math.floor(lat / GRID)}_${Math.floor(lon / GRID)}`

// ---------- OpenStreetMap ----------

// OSM tags the app reads; everything else is dropped. Must match OSM_TAGS in
// osm-description.utils.ts (checked by a test in the app).
export const KEPT_TAGS = [
  'name', 'amenity', 'parking_space', 'capacity:disabled', 'wheelchair', 'toilets:wheelchair',
  'wheelchair:description', 'wheelchair:description:fr', 'step_count', 'ramp:wheelchair', 'automatic_door',
  'door:width', 'level', 'hearing_loop', 'addr:housenumber', 'addr:street',
]
const FOOD_AND_DRINK = new Set(['cafe', 'restaurant', 'fast_food', 'bar', 'pub'])

/**
 * Same criteria as the app's live Overpass query (osm.api.ts): disabled parking spaces, toilets,
 * and food and drink places, even without accessibility info.
 */
export function keepOsm(tags) {
  if (tags.parking_space === 'disabled') return true
  if (tags.amenity === 'parking') return tags['capacity:disabled'] !== undefined && !['0', 'no'].includes(tags['capacity:disabled'])
  return tags.amenity === 'toilets' || FOOD_AND_DRINK.has(tags.amenity)
}

/** A representative point: the point itself, the middle of a line, or the average of an outer ring. */
export function centerOf(geometry) {
  const average = ring => {
    // A closed ring repeats its first point at the end: count it once.
    const points = ring.length > 1 ? ring.slice(0, -1) : ring
    const sum = points.reduce(([x, y], [px, py]) => [x + px, y + py], [0, 0])
    return [sum[0] / points.length, sum[1] / points.length]
  }
  switch (geometry?.type) {
    case 'Point': return geometry.coordinates
    case 'LineString': return geometry.coordinates[Math.floor(geometry.coordinates.length / 2)]
    case 'Polygon': return average(geometry.coordinates[0])
    case 'MultiPolygon': return average(geometry.coordinates[0][0])
    default: return null
  }
}

const OSM_TYPES = { n: 'node', w: 'way', r: 'relation' }

/**
 * Converts one feature from `osmium export --add-unique-id=type_id` (id like "n123", tags as properties) into
 * the element shape the app reads, or null when it is not wanted.
 */
export function featureToElement(feature) {
  const tags = feature.properties ?? {}
  if (!keepOsm(tags)) return null
  const match = /^([nwr])(\d+)$/.exec(String(feature.id ?? ''))
  const center = centerOf(feature.geometry)
  if (!match || !center) return null
  const [lon, lat] = center
  return {
    type: OSM_TYPES[match[1]],
    id: Number(match[2]),
    lat,
    lon,
    tags: Object.fromEntries(KEPT_TAGS.filter(k => tags[k] !== undefined).map(k => [k, String(tags[k])])),
  }
}

// ---------- Acceslibre ----------

/** Acceslibre columns the app reads. Must match ACCESLIBRE_COLUMNS in acceslibre-description.utils.ts. */
export const REQUIRED_COLUMNS = [
  'id', 'web_url', 'name', 'activite', 'latitude', 'longitude', 'numero', 'voie',
  'entree_plain_pied', 'entree_marches', 'entree_marches_rampe', 'entree_ascenseur',
  'accueil_cheminement_plain_pied', 'accueil_cheminement_ascenseur', 'sanitaires_adaptes',
  'stationnement_pmr', 'stationnement_ext_pmr',
  'cheminement_ext_presence', 'cheminement_ext_terrain_stable', 'cheminement_ext_plain_pied',
  'cheminement_ext_ascenseur', 'cheminement_ext_nombre_marches', 'cheminement_ext_rampe',
  'cheminement_ext_pente_presence', 'cheminement_ext_pente_degre_difficulte', 'cheminement_ext_devers',
  'cheminement_ext_retrecissement', 'cheminement_ext_main_courante',
  'entree_ascenseur_pmr', 'entree_marches_main_courante', 'entree_largeur_mini', 'entree_pmr', 'entree_porte_type', 'entree_porte_manoeuvre',
  'entree_dispositif_appel', 'entree_aide_humaine', 'entree_balise_sonore',
  'accueil_cheminement_nombre_marches', 'accueil_cheminement_rampe', 'accueil_ascenseur_etage',
  'accueil_retrecissement', 'accueil_cheminement_main_courante', 'accueil_personnels', 'accueil_equipements_malentendants_presence',
  'accueil_audiodescription_presence', 'sanitaires_presence', 'labels',
]

const NUMBER_COLUMNS = new Set([
  'entree_marches', 'entree_largeur_mini', 'cheminement_ext_nombre_marches', 'accueil_cheminement_nombre_marches',
])
// Yes/no columns are the ones that are neither numbers nor free text.
const TEXT_COLUMNS = new Set([
  'id', 'web_url', 'name', 'activite', 'numero', 'voie', 'entree_marches_rampe', 'cheminement_ext_rampe',
  'cheminement_ext_pente_degre_difficulte', 'cheminement_ext_devers', 'entree_porte_type', 'entree_porte_manoeuvre',
  'accueil_cheminement_rampe', 'accueil_personnels', 'labels',
])

const toBoolean = v => (v === 'True' ? true : v === 'False' ? false : null)
const toNumber = v => (v === '' || v === undefined ? null : Number(v))
const toText = v => (v === '' || v === undefined ? null : v)

/**
 * Keeps places with accessible toilets, and places whose entrance has steps (shown as not
 * accessible). Field names match LigneAcceslibre in the app, so they stay as in the source file.
 */
export function acceslibrePlace(v) {
  if (v.sanitaires_adaptes !== 'True' && v.entree_plain_pied !== 'False') return null
  const lat = Number(v.latitude)
  const lon = Number(v.longitude)
  if (!lat || !lon) return null
  const place = {}
  for (const column of REQUIRED_COLUMNS) {
    const convert = NUMBER_COLUMNS.has(column) ? toNumber : TEXT_COLUMNS.has(column) ? toText : toBoolean
    place[column] = convert(v[column])
  }
  return { ...place, latitude: lat, longitude: lon }
}

/** Streaming CSV reader (RFC 4180: quotes, doubled quotes, line breaks inside quotes). */
export async function* csvRows(chunks) {
  const decoder = new TextDecoder()
  let field = ''
  let row = []
  let inQuotes = false
  let previous = ''
  for await (const chunk of chunks) {
    const text = typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true })
    for (const c of text) {
      if (inQuotes) {
        if (c === '"') inQuotes = false
        else field += c
      } else if (c === '"') {
        if (previous === '"') field += '"'
        inQuotes = true
      } else if (c === ',') {
        row.push(field); field = ''
      } else if (c === '\n') {
        row.push(field.replace(/\r$/, '')); yield row; row = []; field = ''
      } else {
        field += c
      }
      previous = c
    }
  }
  if (field || row.length) { row.push(field); yield row }
}
