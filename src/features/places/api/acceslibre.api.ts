import { ACTIVITIES, ACCESLIBRE_COLUMNS, describeAcceslibre, cleanName, acceslibreType, type AcceslibreRow } from '~/features/places/utils/acceslibre-description.utils'
import type { Place, Point } from '~/types/place.types'
import { SEARCH_RADIUS } from '~/constants/search.constants'
import { distanceMeters } from '~/utils/distance.utils'
import { loadByArea, type Rectangle } from '~/features/places/api/areas.api'

// Fichier national Acceslibre (data.gouv.fr, Licence Ouverte), interrogé via l'API tabulaire : sans clé.
const RESOURCE = '93ae96a7-1db7-4cb4-a9f1-6d778370b640'
const API = `https://tabular-api.data.gouv.fr/api/resources/${RESOURCE}/data/`

const slim = (row: AcceslibreRow) => Object.fromEntries(ACCESLIBRE_COLUMNS.map(c => [c, row[c as keyof AcceslibreRow] ?? null])) as AcceslibreRow

// Tous les cafés, restaurants et toilettes publiques, filtrés par le serveur. Avant, seulement ceux qui
// ont des toilettes adaptées ou des marches : on perdait près de la moitié des « entrée sans marche »
// (docs/decisions/donnees, D11). Les noms contiennent des virgules : entre guillemets.
const FILTER = { activite__in: Object.keys(ACTIVITIES).map(a => `"${a}"`).join(',') }
// 200 lignes par page au plus : quelques pages suffisent pour un quartier, même dense.
const PAGE_SIZE = 200
const MAX_PAGES = 5

async function page(zone: Record<string, string>, pageNumber: number) {
  const url = `${API}?${new URLSearchParams({ ...zone, ...FILTER, page_size: String(PAGE_SIZE), page: String(pageNumber) })}`
  // data.gouv répond d'habitude en 3 s, mais parfois en 20 s ou plus : on lui laisse le temps.
  const answer = await fetch(url, { signal: AbortSignal.timeout(40000) })
  if (!answer.ok) throw new Error(`Acceslibre ${answer.status}`)
  return answer.json() as Promise<{ data: AcceslibreRow[]; meta?: { total?: number } }>
}

/** Les lignes Acceslibre d'un rectangle : la première page dit combien il y en a, les suivantes arrivent ensemble. */
async function query([south, west, north, east]: Rectangle): Promise<AcceslibreRow[]> {
  const zone = { latitude__greater: String(south), latitude__less: String(north), longitude__greater: String(west), longitude__less: String(east) }
  const firstPage = await page(zone, 1)
  const pages = Math.min(MAX_PAGES, Math.ceil((firstPage.meta?.total ?? 0) / PAGE_SIZE))
  const following = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, i) => page(zone, i + 2)))
  // Seules les colonnes lues par l'appli sont gardées : une ligne en compte plus de 100.
  const lines = [firstPage, ...following].flatMap(p => p.data.map(slim))
  return [...new Map(lines.map(row => [row.id, row])).values()]
}

async function rowsAround(center: Point): Promise<AcceslibreRow[]> {
  // Les quartiers gardés sur le téléphone, puis le direct pour les manquants (docs/decisions/carte, D6).
  return loadByArea({
    // q3 : le champ gardé s'appelle « data » (avant : « donnees ») ; q2 : toutes les activités et l'adresse.
    dataset: 'acceslibre-q3',
    center,
    radius: SEARCH_RADIUS,
    load: query,
    position: row => (row.latitude !== null && row.longitude !== null ? { lat: row.latitude, lon: row.longitude } : null),
  })
}

/** Les cafés, restaurants et toilettes publiques d'Acceslibre autour d'un point. */
export async function loadAcceslibre(center: Point): Promise<Place[]> {
  const lines = await rowsAround(center)

  const places: Place[] = []
  for (const r of lines) {
    const type = acceslibreType(r.activite)
    if (!type || r.latitude === null || r.longitude === null) continue
    const point = { lat: r.latitude, lon: r.longitude }
    const meters = Math.round(distanceMeters(center, point))
    if (meters > SEARCH_RADIUS) continue
    const { state, lines: description, access } = describeAcceslibre(r)
    const label = r.activite!.split(',')[0]
    places.push({
      id: `acceslibre/${r.id}`,
      type, state, label, meters, ...point,
      name: cleanName(r.name) ?? label,
      lines: description,
      // Seulement si les toilettes sont adaptées : sinon, le conseil enverrait vers des toilettes inutilisables.
      advice: state === 'ok' && (type === 'cafe' || type === 'restaurant') ? 'Toilettes pour les clients : demandez au comptoir.' : undefined,
      sources: ['Acceslibre'],
      acceslibreLink: r.web_url ?? undefined,
      access,
      ...(r.numero && r.voie ? { address: { number: r.numero, street: r.voie } } : {}),
    })
  }
  return places
}
