import type { Arrival, Point } from '~/types/place.types'
import { distanceMeters } from '~/utils/distance.utils'
import { formatDistance } from '~/utils/format.utils'

// Géocodeur officiel français (Base Adresse Nationale et lieux de l'IGN, via la Géoplateforme).
const GEOCODER = 'https://data.geopf.fr/geocodage/search'
const REVERSE_GEOCODER = 'https://data.geopf.fr/geocodage/reverse'
// L'IGN ne connaît pas les cafés ni les restaurants. Photon cherche par nom dans OpenStreetMap,
// les plus proches d'abord.
const PHOTON_URL = 'https://photon.komoot.io/api/'
// Au-delà, un lieu du même nom est sans doute dans une autre ville.
const PLACES_RADIUS_M = 20000
// Tous les lieux où l'on peut aller : cafés et magasins, mais aussi hôpital, centre de santé, mairie
// (amenity, healthcare), gare et métro (railway, public_transport), musée, stade, bureau… Pas les rues
// ni les villes, que le géocodeur de l'IGN donne déjà.
const PLACE_KINDS = new Set([
  'amenity', 'shop', 'tourism', 'leisure', 'healthcare', 'office', 'railway', 'public_transport',
  'aeroway', 'historic', 'building', 'club', 'craft', 'emergency', 'sport',
])
// Des points qui portent le nom d'un lieu sans en être un : « Hôpital Saint-Antoine » est aussi une
// station de taxi, « Mairie du 11e » une bouche de métro et une station de vélos.
const NOT_A_DESTINATION = new Set([
  'taxi', 'bicycle_rental', 'bicycle_parking', 'motorcycle_parking', 'parking_entrance', 'subway_entrance',
  'stop', 'stop_position', 'platform',
])

export type Suggestion = Arrival & {
  /** ligne principale, en gros */
  title: string
  /** ligne secondaire : ville, type de lieu… */
  detail?: string
}

type Result = {
  geometry: { coordinates: [number, number] }
  properties: {
    _type: 'address' | 'poi'
    label?: string
    name?: string | string[]
    city?: string | string[]
    postcode?: string | string[]
    category?: string[]
  }
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

function toSuggestion({ geometry, properties: p }: Result): Suggestion {
  const [lon, lat] = geometry.coordinates
  if (p._type === 'address') {
    // « 12 Rue Carnot 93230 Romainville » : la rue en gros, la ville dessous.
    const label = p.label ?? ''
    const cut = label.search(/ \d{5} /)
    return cut > 0
      ? { lat, lon, address: label, title: label.slice(0, cut), detail: label.slice(cut + 1) }
      : { lat, lon, address: label, title: label }
  }
  const name = first(p.name) ?? ''
  const town = first(p.city)
  return {
    lat, lon,
    address: town ? `${name}, ${town}` : name,
    title: name,
    detail: [town, p.category?.[0]].filter(Boolean).join(' · ') || undefined,
  }
}

async function query(text: string, index: 'address' | 'poi', maxResults: number, near: Point | null, signal?: AbortSignal) {
  const params = new URLSearchParams({ q: text, index, limit: String(maxResults), autocomplete: '1' })
  // Les résultats proches passent en premier : « rue Carnot » donne d'abord celle du quartier.
  if (near) { params.set('lat', String(near.lat)); params.set('lon', String(near.lon)) }
  const answer = await fetch(`${GEOCODER}?${params}`, { signal })
  if (!answer.ok) throw new Error(`Géocodeur ${answer.status}`)
  const results: Result[] = (await answer.json()).features ?? []
  return results.map(toSuggestion)
}

export type PhotonPlace = {
  geometry: { coordinates: [number, number] }
  properties: { name?: string; osm_key?: string; osm_value?: string; city?: string; street?: string }
}

/** Cafés, restaurants, magasins… d'OpenStreetMap dont le nom correspond, du plus proche au plus loin. */
async function placesByName(text: string, near: Point | null, signal?: AbortSignal): Promise<Suggestion[]> {
  // Sans filtre, les rues et les villes du même nom prennent toute la place : on ne demande que des lieux.
  const params = new URLSearchParams({ q: text, limit: '15', lang: 'fr' })
  for (const kind of PLACE_KINDS) params.append('osm_tag', kind)
  if (near) { params.set('lat', String(near.lat)); params.set('lon', String(near.lon)) }
  const answer = await fetch(`${PHOTON_URL}?${params}`, { signal })
  if (!answer.ok) throw new Error(`Photon ${answer.status}`)
  return nearbyPlaces((await answer.json()).features ?? [], near, text)
}

// Sans accents ni ponctuation : « hopital saint antoine » correspond à « Hôpital Saint-Antoine ».
const simplify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

/**
 * Garde les vrais lieux (pas les rues ni les villes), un seul par nom, à moins de 20 km. D'abord ceux dont le nom
 * contient ce qu'on a tapé, puis les noms approchants (Photon tolère les fautes) ; chaque groupe du
 * plus proche au plus loin.
 */
export function nearbyPlaces(results: PhotonPlace[], near: Point | null, text = ''): Suggestion[] {
  const typed = simplify(text.trim())
  // D'abord le nom tapé tel quel, puis un nom qui le contient (« CeGIDD - Hôpital Saint-Antoine »).
  const exact = (name: string) => (!typed ? 1 : simplify(name) === typed ? 0 : simplify(name).includes(typed) ? 1 : 2)
  return results
    .filter(r => r.properties.name && PLACE_KINDS.has(r.properties.osm_key ?? '') && !NOT_A_DESTINATION.has(r.properties.osm_value ?? ''))
    .map(r => {
      const [lon, lat] = r.geometry.coordinates
      return { r, lat, lon, meters: near ? distanceMeters(near, { lat, lon }) : null }
    })
    .filter(({ meters }) => meters === null || meters <= PLACES_RADIUS_M)
    .sort((a, b) => exact(a.r.properties.name!) - exact(b.r.properties.name!) || (a.meters ?? 0) - (b.meters ?? 0))
    // Une gare est souvent plusieurs objets du même nom (bâtiment, station) : on n'en garde qu'un.
    .filter(({ r }, i, all) => all.findIndex(({ r: other }) => other.properties.name === r.properties.name && other.properties.city === r.properties.city) === i)
    .slice(0, 3)
    .map(({ r, lat, lon, meters }) => {
      const name = r.properties.name!
      const town = r.properties.city
      return {
        lat, lon,
        address: town ? `${name}, ${town}` : name,
        title: name,
        detail: [meters !== null ? `à ${formatDistance(meters)}` : null, r.properties.street, town].filter(Boolean).join(' · ') || undefined,
      }
    })
}

/** Les lieux du même nom tout proches, puis les adresses, puis les lieux connus de l'IGN (gares, mairies…). */
export async function suggest(text: string, near: Point | null, signal?: AbortSignal): Promise<Suggestion[]> {
  const [osmPlaces, addresses, places] = await Promise.all([
    placesByName(text, near, signal).catch(() => []),
    query(text, 'address', 4, near, signal),
    query(text, 'poi', 3, near, signal).catch(() => []),
  ])
  const notTooFar = (s: Suggestion) => !near || distanceMeters(near, s) <= PLACES_RADIUS_M
  const seen = new Set<string>()
  // Des lieux trouvés par leur nom : les lieux publics de l'IGN ne seraient que du bruit
  // (« king falafel » donnait « Résidence Universitaire Martin Luther King »).
  const publicPlaces = osmPlaces.length > 0 ? [] : places.filter(notTooFar)
  // De même, « gare de lyon » trouvée tout près : « Rue de la Gare, Lyon » n'est que du bruit.
  const streets = osmPlaces.length > 0 ? addresses.filter(notTooFar) : addresses
  return [...osmPlaces, ...streets, ...publicPlaces].filter(s => !seen.has(s.address) && seen.add(s.address))
}

export async function searchAddress(text: string, near: Point | null = null): Promise<Arrival | null> {
  return (await suggest(text, near))[0] ?? null
}

/** L'adresse la plus proche d'un point (« 1 Rue de la République 93100 Montreuil »), pour vérifier où l'on est. */
export async function nearestAddress(point: Point, signal?: AbortSignal): Promise<string | null> {
  const params = new URLSearchParams({ lat: String(point.lat), lon: String(point.lon), index: 'address', limit: '1' })
  const answer = await fetch(`${REVERSE_GEOCODER}?${params}`, { signal })
  if (!answer.ok) throw new Error(`Géocodeur ${answer.status}`)
  const [result]: Result[] = (await answer.json()).features ?? []
  return result?.properties.label ?? null
}
