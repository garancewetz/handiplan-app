import { color } from '~/features/places/utils/color.utils'
import { pair, groupDuplicates, type Candidate } from '~/features/places/utils/matching.utils'
import type { Entrance, Line, Place, Toilets } from '~/types/place.types'

// Reconnaître le même lieu : matching.utils.ts (indépendant de l'affichage). Ici, réunir ce que
// disent les deux descriptions en une seule fiche.

const candidate = (p: Place): Candidate => ({ id: p.id, name: p.name, lat: p.lat, lon: p.lon, address: p.address, toilets: p.type === 'wc', otherNames: p.otherNames })

const lowercaseFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

type Aspect = 'entrance' | 'toilets'
const THEME: Record<Aspect, 'Entrée' | 'Toilettes'> = { entrance: 'Entrée', toilets: 'Toilettes' }
const UNKNOWN: Record<Aspect, Entrance | Toilets> = { entrance: 'unknown', toilets: 'unknown' }
// Du plus facile au plus difficile, pour garder la réponse la plus prudente.
const CAUTION: Record<string, number> = { ok: 0, partial: 1, no: 2 }

const knows = (p: Place, aspect: Aspect) => !!p.access && p.access[aspect] !== UNKNOWN[aspect]

/**
 * Qui croire, pour l'entrée ou les toilettes, entre deux descriptions du même lieu : celle qui sait ; si
 * les deux savent et disent presque la même chose (« petite marche » et « sans marche », « petite marche »
 * et « marche haute »), la plus prudente ; le désaccord seulement quand l'une dit « sans marche » (ou
 * « toilettes adaptées ») et l'autre le contraire (docs/decisions/donnees, D12).
 */
function choose(aspect: Aspect, p: Place, s: Place): { from: Place; disagreement: boolean } {
  if (!knows(s, aspect)) return { from: knows(p, aspect) ? p : s, disagreement: false }
  if (!knows(p, aspect)) return { from: s, disagreement: false }
  const pAnswer = p.access![aspect]
  const sAnswer = s.access![aspect]
  if (pAnswer === sAnswer) return { from: s, disagreement: false }
  if (aspect === 'toilets' || (pAnswer !== 'partial' && sAnswer !== 'partial')) return { from: s, disagreement: true }
  return { from: CAUTION[pAnswer] > CAUTION[sAnswer] ? p : s, disagreement: false }
}

const DISAGREEMENT_ADVICE = 'Les infos ne sont pas d’accord : à vérifier sur place.'

/**
 * Deux descriptions du même lieu réunies en une : `s` (la plus détaillée) pour tout, sauf l'entrée et les
 * toilettes, choisies une à une (voir `choose`). Les détails de l'autre (largeur de porte, sonnette…)
 * restent, et un vrai désaccord est dit en clair, avec ce que dit chacune (`names`).
 */
function combine(p: Place, s: Place, names: [string, string]): Pick<Place, 'lines' | 'access' | 'state' | 'advice' | 'disagreement'> {
  const choice = { entrance: choose('entrance', p, s), toilets: choose('toilets', p, s) }
  const says = (place: Place, theme: string, name: string) => {
    const line = place.lines.find(x => x.theme === theme) ?? place.lines[0]
    return line ? `${name} : ${lowercaseFirst(line.text)}` : null
  }
  const essentials = (aspect: Aspect): Line[] => {
    const theme = THEME[aspect]
    const from = (place: Place) => place.lines.filter(x => x.theme === theme)
    const { from: chosen, disagreement } = choice[aspect]
    const head: Line[] = disagreement
      ? [{ theme, answer: 'warning', text: `${theme} : les infos ne sont pas d’accord`, detail: [says(p, theme, names[0]), says(s, theme, names[1])].filter(Boolean).join(' · ') }]
      : from(chosen).slice(0, 1)
    // puis les détails des deux (sans leur réponse principale), une fois chacun
    const details = [...from(chosen).slice(1), ...from(chosen === s ? p : s).slice(1)]
    return [...head, ...details.filter((line, i) => details.findIndex(x => x.text === line.text) === i)]
  }
  // Les autres thèmes : `s`, et `p` pour ceux que `s` ne renseigne pas (un étage, une précision…).
  const themesS = new Set(s.lines.map(line => line.theme))
  const others = (line: Line) => line.theme !== 'Entrée' && line.theme !== 'Toilettes'
  const lines = [
    ...essentials('entrance'), ...essentials('toilets'),
    ...s.lines.filter(others), ...p.lines.filter(line => others(line) && !themesS.has(line.theme)),
  ]
  // Un vrai désaccord compte comme « en partie » pour l'entrée, « on ne sait pas » pour les toilettes :
  // orange, jamais vert.
  const access = s.access && p.access
    ? {
      entrance: choice.entrance.disagreement ? 'partial' as const : choice.entrance.from.access!.entrance,
      toilets: choice.toilets.disagreement ? 'unknown' as const : choice.toilets.from.access!.toilets,
    }
    : s.access ?? p.access
  const state = access ? color(access.entrance, access.toilets) : s.state
  // (un désaccord peut venir d'avant : deux fiches Acceslibre qui se contredisaient déjà)
  const disagreement = choice.entrance.disagreement || choice.toilets.disagreement || !!p.disagreement || !!s.disagreement
  const advice = disagreement ? DISAGREEMENT_ADVICE
    : state === 'ok' && (s.type === 'cafe' || s.type === 'restaurant') ? 'Toilettes pour les clients : demandez au comptoir.'
    : state === 'unknown' ? s.advice ?? p.advice : undefined
  return { lines, access, state, advice, ...(disagreement ? { disagreement } : {}) }
}

/**
 * Le lieu des deux bases réunies : d'OpenStreetMap, le nom, le type et la position (plus précis) ;
 * d'Acceslibre, le détail. Pour l'entrée et les toilettes, voir `choisir`.
 */
function merge(o: Place, a: Place): Place {
  return {
    ...a,
    ...combine(o, a, ['OpenStreetMap', 'Acceslibre']),
    id: o.id, name: o.name, type: o.type, label: o.label, lat: o.lat, lon: o.lon, meters: o.meters,
    address: o.address ?? a.address,
    sources: ['OpenStreetMap', 'Acceslibre'],
  }
}

/**
 * Acceslibre a souvent deux fiches pour le même lieu, au même endroit (« Eataly » en Restaurant,
 * « EATALY PARIS MARAIS » en Restauration rapide) : on les réunit comme OSM et Acceslibre, la fiche qui
 * sait l'emportant sur celle qui ne sait pas. On part de celle qui en sait le plus.
 */
function onePerPlace(places: Place[]): Place[] {
  const knowledge = (p: Place) => (knows(p, 'entrance') ? 1 : 0) + (knows(p, 'toilets') ? 1 : 0)
  const sorted = [...places].sort((x, y) => knowledge(y) - knowledge(x) || y.lines.length - x.lines.length)
  return groupDuplicates(sorted.map(candidate)).map(([first, ...others]) =>
    others.reduce((g, i) => ({
      ...g, ...combine(sorted[i], g, ['Une fiche Acceslibre', 'une autre']),
      otherNames: [...(g.otherNames ?? []), sorted[i].name],
    }), sorted[first]))
}

/**
 * Un lieu présent des deux côtés n'apparaît qu'une fois. Les places handicapées ne sont jamais réunies :
 * deux places voisines sont bien deux places.
 */
export function mergePlaces(osm: Place[], records: Place[]): Place[] {
  const acceslibre = onePerPlace(records)
  const places = osm.filter(p => p.type !== 'parking')
  const pairs = pair(places.map(candidate), acceslibre.map(candidate))
  const mergedOnes = new Map(pairs.map(([i, j]) => [i, merge(places[i], acceslibre[j])]))
  const taken = new Set(pairs.map(([, j]) => j))
  return [
    ...places.map((p, i) => mergedOnes.get(i) ?? p),
    ...osm.filter(p => p.type === 'parking'),
    ...acceslibre.filter((_, j) => !taken.has(j)),
  ]
}

/**
 * Les plus faciles d'abord (facile et places, puis attention), puis les difficiles et les lieux sans
 * info ensemble, du plus proche au plus loin ; chaque groupe par distance (docs/decisions/interface, D25).
 */
export function sortPlaces(places: Place[]): Place[] {
  const rank = (p: Place) => ({ ok: 0, parking: 0, check: 1, unknown: 2, no: 2 })[p.state]
  return [...places].sort((a, b) => rank(a) - rank(b) || a.meters - b.meters)
}
