import { distanceMeters } from '~/utils/distance.utils'

// Reconnaître le même lieu dans OpenStreetMap et dans Acceslibre, à partir des données brutes : un
// élément OSM, une fiche Acceslibre. Rien ici ne dépend de l'affichage de Handiplan, pour que d'autres
// applis puissent le reprendre (docs/decisions/donnees, D13).

/** Ce qu'il faut savoir d'un lieu pour le reconnaître. */
export type Candidate = {
  id: string
  name: string
  lat: number
  lon: number
  address?: { number: string; street: string }
  /** des toilettes publiques : jamais le même lieu qu'un café ou un restaurant */
  toilets?: boolean
  /** les noms des autres fiches du même lieu (voir `regrouper`) : chacun peut servir à le reconnaître */
  otherNames?: string[]
}

// Sans accents ni ponctuation, et sans lettres doublées : « L'As du Fallafel » et « As du Falafel » se
// ressemblent. « œ » devient « oe » (« Cœur » et « Coeur »).
const simplify = (s: string) =>
  s.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').replace(/([a-z])\1+/g, '$1').trim()

// Les petits mots et les mots du métier ne disent pas quel lieu c'est : deux noms qui commencent par
// « Le » ou « Café » ne sont pas pour autant le même lieu.
// Simplifiés comme les noms (« brasserie » devient « braserie ») : sinon ils ne seraient jamais reconnus.
const SMALL_WORDS = new Set(['le', 'la', 'les', 'l', 'de', 'du', 'des', 'd', 'au', 'aux', 'a', 'et', 'en', 'chez', 'the', 'and'])
// Le genre de lieu (café, bar, restaurant…) : interchangeable, « Café Leffe » est « Brasserie Leffe ».
const KINDS = [
  'café', 'bar', 'restaurant', 'resto', 'brasserie', 'bistrot', 'bistro', 'pub', 'snack', 'salon', 'tabac', 'hôtel',
  'toilettes', 'publiques', 'wc', 'sanisette',
].map(simplify)
// La spécialité : elle ne prouve rien (« Bouillon Maurice » n'est pas « Bouillon de Lyon »), mais deux
// spécialités différentes sont deux lieux (« Boston Tavern » n'est pas « Boston Trattoria »).
const SPECIALTIES = new Set([
  'bouillon', 'taverne', 'tavern', 'trattoria', 'estaminet', 'grill', 'coffee', 'pizzeria', 'crêperie', 'pizza',
  'pizzas', 'sushi', 'burger', 'burgers', 'tacos', 'kebab', 'ramen', 'poke', 'tapas', 'crêpe', 'crêpes',
].map(simplify))
const STOP_WORDS = new Set([...SMALL_WORDS, ...KINDS, ...SPECIALTIES])

// Les abréviations courantes : « St » et « Saint », « Bd » et « Boulevard » sont le même mot.
const SAME_WORDS: Record<string, string> = { st: 'saint', ste: 'sainte', bd: 'boulevard', av: 'avenue', pl: 'place' }
// Chaque nom est comparé des milliers de fois dans un quartier dense : on ne le découpe qu'une fois.
const splitCache = new Map<string, string[]>()
function wordsOf(name: string): string[] {
  let result = splitCache.get(name)
  if (!result) {
    result = [...new Set(simplify(name).split(' ').map(m => SAME_WORDS[m] ?? m).filter(m => m && !STOP_WORDS.has(m)))]
    splitCache.set(name, result)
  }
  return result
}

const NONE = new Set<string>()

// Plusieurs points à moins de 50 m sont le même lieu (Acceslibre a souvent trois fiches pour un bar) :
// son nom ne doit compter qu'une fois.
const SAME_SPOT_M = 50

/**
 * Les mots que beaucoup de lieux d'un même endroit partagent (« marais », « beaubourg », « halles ») : ils
 * disent où est le lieu, pas lequel c'est. « Café du Marais » et « Kyo Marais » ne sont pas le même lieu.
 * Un mot compte une fois par endroit, pas une fois par fiche.
 */
export function frequentWords(places: Candidate[], threshold = 3): Set<string> {
  const spots = new Map<string, Candidate[]>()
  for (const c of places) {
    for (const m of wordsOf(c.name)) {
      const nearby = spots.get(m) ?? []
      if (!nearby.some(v => distanceMeters(v, c) <= SAME_SPOT_M)) nearby.push(c)
      spots.set(m, nearby)
    }
  }
  return new Set([...spots].filter(([, nearby]) => nearby.length >= threshold).map(([m]) => m))
}

/** Les mots des rues de l'endroit (« Canebière », « Confort », « Mercière ») : ils aussi disent où. */
export function streetWords(places: Candidate[]): Set<string> {
  return new Set(places.flatMap(c => (c.address ? wordsOf(c.address.street) : [])))
}

// Une faute de frappe par mot : « Coupe » et « Coup », « Kebab » et « Kebap ». Pas sur les mots de moins
// de 4 lettres : « Dong » n'est pas « Dog ».
function sameWord(a: string, b: string) {
  if (a === b) return true
  if (a[0] !== b[0] || Math.min(a.length, b.length) < 4 || Math.abs(a.length - b.length) > 1) return false
  let i = 0
  while (a[i] === b[i]) i++
  return a.slice(i + 1) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i) || a.slice(i) === b.slice(i + 1)
}

/** Les mots communs de deux noms, sans les mots courants de l'endroit, et la taille du plus court. */
function sharedWords(a: string, b: string, frequent: Set<string>) {
  const ma = wordsOf(a).filter(m => !frequent.has(m))
  const mb = wordsOf(b).filter(m => !frequent.has(m))
  const n = ma.filter(m => mb.some(x => sameWord(m, x))).length
  return { n, ma: ma.length, mb: mb.length }
}

/**
 * À quel point deux noms se ressemblent, de 0 à 1 : la part de mots communs (1 si les mots de l'un sont
 * tous dans l'autre), sans les mots courants de l'endroit. Un nom sans mot propre (« Restaurant », « Café »)
 * ne ressemble à rien : il ne dit pas quel lieu c'est.
 */
export function similarity(a: string, b: string, frequent = NONE): number {
  const c = sharedWords(a, b, frequent)
  if (c.n === 0) return 0
  if (c.n >= Math.min(c.ma, c.mb)) return 1
  return c.n / (c.ma + c.mb - c.n)
}

// Une même spécialité écrite autrement : au singulier (« Crêpes » et « Crêpe »), et « pizzeria » est
// « pizza », « taverne » est « tavern ».
const SAME_SPECIALTY: Record<string, string> = Object.fromEntries(
  [['pizzeria', 'pizza'], ['crêperie', 'crêpe'], ['taverne', 'tavern']].map(([a, b]) => [simplify(a), simplify(b)]),
)
const specialtiesOf = (name: string) =>
  simplify(name).split(' ').filter(m => SPECIALTIES.has(m)).map(m => (SAME_SPECIALTY[m] ?? m).replace(/s$/, ''))
/** Deux spécialités différentes : deux lieux. Sans spécialité d'un côté, rien ne s'oppose. */
function compatibleSpecialties(a: string, b: string) {
  const sa = specialtiesOf(a)
  const sb = specialtiesOf(b)
  return sa.every(m => sb.includes(m)) || sb.every(m => sa.includes(m))
}

// Les mêmes mots dans le même ordre, à une faute de frappe près (voir `memeMot`) : « Paris Kebab » et
// « Paris Kebap ». Mot à mot et pas sur le nom collé : collés, « Bar de la Plaine » et « Beer de la Plaine »
// n'auraient qu'une lettre d'écart.
function nearlySameWords(a: string, b: string) {
  const wa = simplify(a).split(' ').filter(m => m && !SMALL_WORDS.has(m))
  const wb = simplify(b).split(' ').filter(m => m && !SMALL_WORDS.has(m))
  return wa.length > 0 && wa.length === wb.length && wa.every((m, i) => sameWord(m, wb[i]))
}

const gluedCache = new Map<string, string>()
function glued(name: string): string {
  let result = gluedCache.get(name)
  if (result === undefined) {
    result = simplify(name).split(' ').filter(m => !SMALL_WORDS.has(m)).join('')
    gluedCache.set(name, result)
  }
  return result
}

// Un nom fait seulement de petits mots et de genres de lieu (« Le Café ») ne dit pas quel lieu c'est.
const nameless = (name: string) => simplify(name).split(' ').every(m => !m || SMALL_WORDS.has(m) || KINDS.includes(m))

/**
 * Le même nom : les mêmes lettres une fois collées (« Eat Day » et « EatDay », « Grill Burger »), les mêmes
 * mots à une faute près (« Paris Kebab » et « Paris Kebap »), ou les mêmes mots qui comptent (« Filippo » et « Restaurant Filippo »). Si ces mots ne sont que
 * des mots de l'endroit (« Bistrot Beaubourg », « Café Beaubourg »), il faut être tout près.
 */
function sameName(a: string, b: string, frequent: Set<string>, meters: number) {
  if (nameless(a) || nameless(b)) return false
  if (glued(a) === glued(b) || nearlySameWords(a, b)) return true
  const equalWords = (x: string[], y: string[]) => x.length > 0 && x.length === y.length && x.every(m => y.includes(m))
  // « Funky Monky » et « Funky Monky Lyon » : les mêmes mots, une fois retirés ceux de l'endroit
  const ownWords = (m: string[]) => m.filter(x => !frequent.has(x))
  if (equalWords(ownWords(wordsOf(a)), ownWords(wordsOf(b)))) return true
  return equalWords(wordsOf(a), wordsOf(b)) && meters <= VERY_NEAR_M
}

// « 11 bis » et « 11B » sont le même numéro ; « 31-35 » contient « 35 » ; OSM note parfois plusieurs
// numéros (« 35;39bis »).
function numbers(houseNumber: string): string[] {
  return houseNumber.toLowerCase().replace(/\s+/g, '').split(/[;,]/).flatMap(n => {
    const range = n.match(/^(\d+)-(\d+)$/)
    return range ? [range[1], range[2]] : [n.replace(/(bis|ter|quater)$/, m => m[0])]
  })
}
const street = (r: string) => wordsOf(r).join(' ')

/** Le même numéro (ou une plage qui le contient) dans la même rue. */
export function sameAddress(a?: Candidate['address'], b?: Candidate['address']): boolean {
  if (!a || !b || street(a.street) !== street(b.street)) return false
  const na = numbers(a.number)
  return numbers(b.number).some(n => na.includes(n))
}

// Des noms qui se ressemblent assez, à moins de 40 m ; à la même adresse, un mot commun suffit ; le même
// nom, jusqu'à 100 m (les points d'Acceslibre sont parfois placés au milieu de l'immeuble ou de la rue, et
// les deux bases ne notent pas toujours le même numéro). Un seul mot commun, quand chacun a d'autres mots
// (« Little Boston » et « Boston », « Café du Marais » et « Kyo Marais »), est une preuve faible : à 15 m au
// plus, ou à la même adresse.
const VERY_NEAR_M = 15
const NEAR_M = 40
const SAME_ADDRESS_M = 80
const SAME_NAME_M = 100

/**
 * Ce qui fait croire que c'est le même lieu, ou 0 si ce n'en est pas un : plus c'est grand, plus c'est sûr.
 * `courants` : les mots courants de l'endroit (voir `motsCourants`) ; `apparier` et `regrouper` les
 * trouvent seuls.
 */
export function score(a: Candidate, b: Candidate, frequent = NONE): number {
  if (!!a.toilets !== !!b.toilets) return 0
  const meters = distanceMeters(a, b)
  // Le plus souvent, les deux lieux sont loin : inutile de comparer les noms (des centaines de paires).
  if (meters > SAME_NAME_M) return 0
  const address = sameAddress(a.address, b.address)
  const namesOf = (c: Candidate) => [c.name, ...(c.otherNames ?? [])]
  return Math.max(...namesOf(a).flatMap(na => namesOf(b).map(nb => scoreNames(na, nb, meters, address, frequent))))
}

function scoreNames(a: string, b: string, meters: number, address: boolean, frequent: Set<string>): number {
  if (!compatibleSpecialties(a, b)) return 0
  const names = similarity(a, b, frequent)
  const name = sameName(a, b, frequent, meters)
  // À la même adresse, un mot commun suffit, même un mot courant : « Le Renard » et « Le Renard Bistrot »,
  // rue du Renard.
  const sameNumber = address && meters <= SAME_ADDRESS_M && similarity(a, b) > 0
  const c = sharedWords(a, b, frequent)
  const weak = c.n === 1 && c.ma > 1 && c.mb > 1
  const near = meters <= (weak ? VERY_NEAR_M : NEAR_M)
  const matched = (near && names >= 0.5) || sameNumber || name
  return matched ? Math.max(names, name ? 1 : 0) + (address ? 1 : 0) + (1 - meters / SAME_NAME_M) : 0
}

export const samePlace = (a: Candidate, b: Candidate, frequent = NONE) => score(a, b, frequent) > 0

// Un mot est courant s'il l'est dans l'une des deux listes (compter les deux ensemble compterait deux fois
// chaque lieu présent des deux côtés), ou s'il est dans le nom d'une rue.
const frequentOf = (...lists: Candidate[][]) =>
  new Set(lists.flatMap(list => [...frequentWords(list), ...streetWords(list)]))

/**
 * Les paires [i, j] du même lieu entre deux listes : chaque lieu n'est apparié qu'une fois, au plus
 * ressemblant (deux fiches proches ne se disputent pas le même lieu).
 */
export function pair(a: Candidate[], b: Candidate[]): [number, number][] {
  const frequent = frequentOf(a, b)
  const pairs = b.flatMap((y, j) => a.map((x, i) => ({ i, j, s: score(x, y, frequent) }))).filter(p => p.s > 0)
  pairs.sort((p, q) => q.s - p.s)
  const takenA = new Set<number>()
  const takenB = new Set<number>()
  const result: [number, number][] = []
  for (const { i, j } of pairs) {
    if (takenA.has(i) || takenB.has(j)) continue
    takenA.add(i)
    takenB.add(j)
    result.push([i, j])
  }
  return result
}

/**
 * Les groupes d'une même liste qui décrivent le même lieu (Acceslibre a souvent deux fiches pour un lieu) :
 * des listes d'indices, le premier de chaque groupe étant le premier venu dans l'ordre donné.
 */
export function groupDuplicates(places: Candidate[]): number[][] {
  const frequent = frequentOf(places)
  const groups: number[][] = []
  places.forEach((c, i) => {
    const group = groups.find(g => samePlace(places[g[0]], c, frequent))
    if (group) group.push(i)
    else groups.push([i])
  })
  return groups
}

/** Une fiche par lieu : la première de chaque groupe (voir `regrouper`), avec les noms des autres. */
export function oneRecordPerPlace<T extends Candidate>(places: T[]): T[] {
  return groupDuplicates(places).map(([first, ...others]) =>
    others.length === 0 ? places[first] : { ...places[first], otherNames: others.map(i => places[i].name) })
}

// ——— Depuis les données brutes ———

type OsmElement = {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags: Record<string, string | undefined>
}

/** Un élément OSM (réponse d'Overpass, `out center tags`). Sans nom ni position : pas reconnaissable. */
export function fromOsm(e: OsmElement): Candidate | null {
  const lat = e.lat ?? e.center?.lat
  const lon = e.lon ?? e.center?.lon
  const name = e.tags.name
  if (lat === undefined || lon === undefined || !name) return null
  const number = e.tags['addr:housenumber']
  const street = e.tags['addr:street']
  return {
    id: `${e.type}/${e.id}`, name, lat, lon,
    ...(number && street ? { address: { number, street } } : {}),
    ...(e.tags.amenity === 'toilets' ? { toilets: true } : {}),
  }
}

type AcceslibreRecord = {
  id: string
  name: string | null
  activite: string | null
  latitude: number | null
  longitude: number | null
  numero?: string | null
  voie?: string | null
}

/** Une fiche du fichier national Acceslibre (data.gouv.fr). */
export function fromAcceslibre(f: AcceslibreRecord): Candidate | null {
  if (f.latitude === null || f.longitude === null || !f.name) return null
  return {
    id: `acceslibre/${f.id}`, name: f.name, lat: f.latitude, lon: f.longitude,
    ...(f.numero && f.voie ? { address: { number: f.numero, street: f.voie } } : {}),
    ...(f.activite === 'Toilettes publiques' ? { toilets: true } : {}),
  }
}
