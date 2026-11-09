import { ETIQUETTES_OSM, decrireOsm, libelleOsm, typeOsm } from '~/features/lieux/utils/description-osm.utils'
import type { Lieu, Point } from '~/types/lieu.types'
import { MODE_DEMO } from '~/constants/demo.constants'
import { RAYON_RECHERCHE } from '~/constants/recherche.constants'
import { distanceMetres } from '~/utils/distance.utils'
import { chargerParQuartiers, type Rectangle } from '~/features/lieux/api/quartiers.api'
import { cleDeZone } from '~/features/lieux/utils/zones.utils'

// Serveurs Overpass publics : on passe au suivant si l'un est saturé. D'abord celui d'OpenStreetMap
// France : il couvre toute la France, et reste souvent debout quand les serveurs internationaux
// saturent (docs/decisions/donnees, D5).
const SERVEURS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]


type ElementOsm = {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags: Record<string, string>
}

function requete([sud, ouest, nord, est]: Rectangle) {
  const zone = `(${sud},${ouest},${nord},${est})`
  return `[out:json][timeout:25];(
    nwr["parking_space"="disabled"]${zone};
    nwr["amenity"="parking"]["capacity:disabled"]["capacity:disabled"!~"^(0|no)$"]${zone};
    nwr["amenity"="toilets"]${zone};
    nwr["amenity"~"^(cafe|restaurant|fast_food|bar|pub)$"]${zone};
  );out center tags;`
}

// Seules les étiquettes lues par l'appli sont gardées sur le téléphone : un quartier pèse alors
// quelques dizaines de Ko au lieu de quelques centaines.
const GARDEES = new Set<string>(ETIQUETTES_OSM)
const alleger = (e: ElementOsm): ElementOsm => ({
  type: e.type, id: e.id, lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon,
  tags: Object.fromEntries(Object.entries(e.tags).filter(([k]) => GARDEES.has(k))),
})


/** Vérifie la forme des données reçues plutôt que de forcer leur type : les étiquettes varient d'un lieu à l'autre. */
function versElementsOsm(json: unknown): ElementOsm[] {
  const elements = (json as { elements?: unknown }).elements
  if (!Array.isArray(elements)) throw new Error('Données OSM de démo invalides : « elements » manquant')
  return elements.filter((e): e is ElementOsm => typeof e === 'object' && e !== null && 'tags' in e && 'id' in e)
}

async function interrogerOverpass(rectangle: Rectangle): Promise<ElementOsm[]> {
  const corps = new URLSearchParams({ data: requete(rectangle) })
  let derniereErreur: unknown
  // Un essai par serveur, 20 s maximum chacun : saturé, un serveur ne répond souvent jamais ; un
  // quartier dense de Paris en demande parfois plus de 10.
  for (const serveur of SERVEURS) {
    try {
      const reponse = await fetch(serveur, { method: 'POST', body: corps, signal: AbortSignal.timeout(20000) })
      if (reponse.ok) return versElementsOsm(await reponse.json()).map(alleger)
      derniereErreur = new Error(`Overpass ${reponse.status}`)
    } catch (e) {
      derniereErreur = e
    }
  }
  throw derniereErreur
}

/**
 * Les quartiers gardés sur le téléphone, puis Overpass en direct pour les quartiers manquants
 * (docs/decisions/carte, D6). En mode démo : des données enregistrées du centre de Paris.
 */
async function chargerElements(centre: Point): Promise<ElementOsm[]> {
  if (MODE_DEMO) return versElementsOsm((await import('~/features/lieux/mocks/exemple-paris.mock.json')).default)

  return chargerParQuartiers({
    // q2 : avec l'adresse (addr:*), pour reconnaître le même lieu dans Acceslibre.
    jeu: 'osm-q2',
    centre,
    rayon: RAYON_RECHERCHE,
    charger: interrogerOverpass,
    position: e => (e.lat !== undefined && e.lon !== undefined ? { lat: e.lat, lon: e.lon } : null),
  })
}

// Une seule demande à la fois par zone (≈ 100 m), partagée si deux composants la font en même temps.
const enCours = new Map<string, Promise<ElementOsm[]>>()

function elementsAutour(centre: Point) {
  const cle = cleDeZone(centre)
  let promesse = enCours.get(cle)
  if (!promesse) {
    promesse = chargerElements(centre)
    promesse.catch(() => enCours.delete(cle))
    enCours.set(cle, promesse)
  }
  return promesse
}

export async function chargerLieux(centre: Point): Promise<Lieu[]> {
  const elements = await elementsAutour(centre)
  const lieux: Lieu[] = []
  for (const el of elements) {
    const type = typeOsm(el.tags)
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (!type || lat === undefined || lon === undefined) continue
    const metres = Math.round(distanceMetres(centre, { lat, lon }))
    // Les zones préparées font environ 2 km : on ne garde que le voisinage.
    if (metres > RAYON_RECHERCHE) continue
    const libelle = libelleOsm(type, el.tags)
    lieux.push({
      id: `${el.type}/${el.id}`,
      type, lat, lon, libelle,
      nom: el.tags.name ?? libelle,
      metres,
      ...decrireOsm(type, el.tags),
      sources: ['OpenStreetMap'],
      ...(el.tags['addr:housenumber'] && el.tags['addr:street'] ? { adresse: { numero: el.tags['addr:housenumber'], rue: el.tags['addr:street'] } } : {}),
    })
  }
  return lieux
}
