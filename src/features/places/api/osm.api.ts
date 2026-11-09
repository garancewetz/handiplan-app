import { OSM_TAGS, describeOsm, osmLabel, osmType } from '~/features/places/utils/osm-description.utils'
import type { Place, Point } from '~/types/place.types'
import { DEMO_MODE } from '~/constants/demo.constants'
import { SEARCH_RADIUS } from '~/constants/search.constants'
import { distanceMetres } from '~/utils/distance.utils'
import { loadByArea, type Rectangle } from '~/features/places/api/areas.api'
import { zoneKey } from '~/features/places/utils/zones.utils'

// Serveurs Overpass publics : on passe au suivant si l'un est saturé. D'abord celui d'OpenStreetMap
// France : il couvre toute la France, et reste souvent debout quand les serveurs internationaux
// saturent (docs/decisions/donnees, D5).
const SERVERS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]


type OsmElement = {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags: Record<string, string>
}

function overpassQuery([south, west, north, east]: Rectangle) {
  const zone = `(${south},${west},${north},${east})`
  return `[out:json][timeout:25];(
    nwr["parking_space"="disabled"]${zone};
    nwr["amenity"="parking"]["capacity:disabled"]["capacity:disabled"!~"^(0|no)$"]${zone};
    nwr["amenity"="toilets"]${zone};
    nwr["amenity"~"^(cafe|restaurant|fast_food|bar|pub)$"]${zone};
  );out center tags;`
}

// Seules les étiquettes lues par l'appli sont gardées sur le téléphone : un quartier pèse alors
// quelques dizaines de Ko au lieu de quelques centaines.
const KEPT = new Set<string>(OSM_TAGS)
const slim = (e: OsmElement): OsmElement => ({
  type: e.type, id: e.id, lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon,
  tags: Object.fromEntries(Object.entries(e.tags).filter(([k]) => KEPT.has(k))),
})


/** Vérifie la forme des données reçues plutôt que de forcer leur type : les étiquettes varient d'un lieu à l'autre. */
function toOsmElements(json: unknown): OsmElement[] {
  const elements = (json as { elements?: unknown }).elements
  if (!Array.isArray(elements)) throw new Error('Données OSM de démo invalides : « elements » manquant')
  return elements.filter((e): e is OsmElement => typeof e === 'object' && e !== null && 'tags' in e && 'id' in e)
}

async function queryOverpass(rectangle: Rectangle): Promise<OsmElement[]> {
  const content = new URLSearchParams({ data: overpassQuery(rectangle) })
  let lastError: unknown
  // Un essai par serveur, 20 s maximum chacun : saturé, un serveur ne répond souvent jamais ; un
  // quartier dense de Paris en demande parfois plus de 10.
  for (const server of SERVERS) {
    try {
      const answer = await fetch(server, { method: 'POST', body: content, signal: AbortSignal.timeout(20000) })
      if (answer.ok) return toOsmElements(await answer.json()).map(slim)
      lastError = new Error(`Overpass ${answer.status}`)
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}

/**
 * Les quartiers gardés sur le téléphone, puis Overpass en direct pour les quartiers manquants
 * (docs/decisions/carte, D6). En mode démo : des données enregistrées du centre de Paris.
 */
async function loadElements(centre: Point): Promise<OsmElement[]> {
  if (DEMO_MODE) return toOsmElements((await import('~/features/places/mocks/paris-example.mock.json')).default)

  return loadByArea({
    // q3 : le champ gardé s'appelle « data » (avant : « donnees ») ; q2 : avec l'adresse (addr:*).
    dataset: 'osm-q3',
    centre,
    radius: SEARCH_RADIUS,
    load: queryOverpass,
    position: e => (e.lat !== undefined && e.lon !== undefined ? { lat: e.lat, lon: e.lon } : null),
  })
}

// Une seule demande à la fois par zone (≈ 100 m), partagée si deux composants la font en même temps.
const inFlight = new Map<string, Promise<OsmElement[]>>()

function elementsAround(centre: Point) {
  const key = zoneKey(centre)
  let promise = inFlight.get(key)
  if (!promise) {
    promise = loadElements(centre)
    promise.catch(() => inFlight.delete(key))
    inFlight.set(key, promise)
  }
  return promise
}

export async function loadPlaces(centre: Point): Promise<Place[]> {
  const elements = await elementsAround(centre)
  const places: Place[] = []
  for (const el of elements) {
    const type = osmType(el.tags)
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (!type || lat === undefined || lon === undefined) continue
    const metres = Math.round(distanceMetres(centre, { lat, lon }))
    // Les zones préparées font environ 2 km : on ne garde que le voisinage.
    if (metres > SEARCH_RADIUS) continue
    const label = osmLabel(type, el.tags)
    places.push({
      id: `${el.type}/${el.id}`,
      type, lat, lon, label,
      name: el.tags.name ?? label,
      metres,
      ...describeOsm(type, el.tags),
      sources: ['OpenStreetMap'],
      ...(el.tags['addr:housenumber'] && el.tags['addr:street'] ? { address: { numero: el.tags['addr:housenumber'], street: el.tags['addr:street'] } } : {}),
    })
  }
  return places
}
