import { distanceMetres } from '~/utils/distance.utils'

// Reconnaître le même lieu dans OpenStreetMap et dans Acceslibre, à partir des données brutes : un
// élément OSM, une fiche Acceslibre. Rien ici ne dépend de l'affichage de Handiplan, pour que d'autres
// applis puissent le reprendre (docs/decisions/donnees, D13).

/** Ce qu'il faut savoir d'un lieu pour le reconnaître. */
export type Candidat = {
  id: string
  nom: string
  lat: number
  lon: number
  adresse?: { numero: string; rue: string }
  /** des toilettes publiques : jamais le même lieu qu'un café ou un restaurant */
  toilettes?: boolean
}

// Sans accents ni ponctuation, et sans lettres doublées : « L'As du Fallafel » et « As du Falafel » se
// ressemblent. « œ » devient « oe » (« Cœur » et « Coeur »).
const simplifier = (s: string) =>
  s.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').replace(/([a-z])\1+/g, '$1').trim()

// Les petits mots et les mots du métier ne disent pas quel lieu c'est : deux noms qui commencent par
// « Le » ou « Café » ne sont pas pour autant le même lieu.
// Simplifiés comme les noms (« brasserie » devient « braserie ») : sinon ils ne seraient jamais reconnus.
const PETITS_MOTS = new Set(['le', 'la', 'les', 'l', 'de', 'du', 'des', 'd', 'au', 'aux', 'a', 'et', 'en', 'chez', 'the', 'and'])
const MOTS_VIDES = new Set([
  ...PETITS_MOTS,
  'café', 'bar', 'restaurant', 'resto', 'brasserie', 'bistrot', 'bistro', 'pub', 'pizzeria', 'crêperie', 'snack',
  'salon', 'tabac', 'hôtel',
  'toilettes', 'publiques', 'wc', 'sanisette',
].map(simplifier))
// Les abréviations courantes : « St » et « Saint », « Bd » et « Boulevard » sont le même mot.
const MEMES_MOTS: Record<string, string> = { st: 'saint', ste: 'sainte', bd: 'boulevard', av: 'avenue', pl: 'place' }
// Chaque nom est comparé des milliers de fois dans un quartier dense : on ne le découpe qu'une fois.
const decoupes = new Map<string, string[]>()
function motsDe(nom: string): string[] {
  let resultat = decoupes.get(nom)
  if (!resultat) {
    resultat = [...new Set(simplifier(nom).split(' ').map(m => MEMES_MOTS[m] ?? m).filter(m => m && !MOTS_VIDES.has(m)))]
    decoupes.set(nom, resultat)
  }
  return resultat
}

const AUCUN = new Set<string>()

/**
 * Les mots que beaucoup de lieux d'un même endroit partagent (« marais », « beaubourg », « halles ») : ils
 * disent où est le lieu, pas lequel c'est. « Café du Marais » et « Kyo Marais » ne sont pas le même lieu.
 */
export function motsCourants(noms: string[], seuil = 3): Set<string> {
  const compte = new Map<string, number>()
  for (const nom of noms) for (const m of motsDe(nom)) compte.set(m, (compte.get(m) ?? 0) + 1)
  return new Set([...compte].filter(([, n]) => n >= seuil).map(([m]) => m))
}

// Une faute de frappe par mot : « Coupe » et « Coup », « Kebab » et « Kebap ». Pas sur les mots de moins
// de 4 lettres : « Dong » n'est pas « Dog ».
function memeMot(a: string, b: string) {
  if (a === b) return true
  if (a[0] !== b[0] || Math.min(a.length, b.length) < 4 || Math.abs(a.length - b.length) > 1) return false
  let i = 0
  while (a[i] === b[i]) i++
  return a.slice(i + 1) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i) || a.slice(i) === b.slice(i + 1)
}

/**
 * À quel point deux noms se ressemblent, de 0 à 1 : la part de mots communs (1 si les mots de l'un sont
 * tous dans l'autre), sans les mots courants de l'endroit. Un nom sans mot propre (« Restaurant »,
 * « Café ») ne ressemble à rien : il ne dit pas quel lieu c'est.
 */
export function ressemblance(a: string, b: string, courants = AUCUN): number {
  const ma = motsDe(a).filter(m => !courants.has(m))
  const mb = motsDe(b).filter(m => !courants.has(m))
  if (ma.length === 0 || mb.length === 0) return 0
  const communs = ma.filter(m => mb.some(n => memeMot(m, n))).length
  if (communs >= Math.min(ma.length, mb.length)) return 1
  return communs / (ma.length + mb.length - communs)
}

const colles = new Map<string, string>()
function colle(nom: string): string {
  let resultat = colles.get(nom)
  if (resultat === undefined) {
    resultat = simplifier(nom).split(' ').filter(m => !PETITS_MOTS.has(m)).join('')
    colles.set(nom, resultat)
  }
  return resultat
}

/**
 * Le même nom : les mêmes mots qui comptent (« Filippo » et « Restaurant Filippo »), ou les mêmes lettres
 * une fois collées (« Eat Day » et « EatDay »). Un nom fait seulement de mots courants de l'endroit ne
 * compte que s'il est identique.
 */
function memeNom(a: string, b: string, courants: Set<string>) {
  const ma = motsDe(a)
  const mb = motsDe(b)
  if (ma.length === 0 || mb.length === 0) return false
  // les lettres collées, mots de métier compris : sinon « Bistrot Beaubourg » serait « Café Beaubourg »
  if (colle(a) === colle(b)) return true
  const propres = (m: string[]) => m.filter(x => !courants.has(x)).sort().join(' ')
  return propres(ma) !== '' && propres(ma) === propres(mb)
}

// « 11 bis » et « 11B » sont le même numéro ; « 31-35 » contient « 35 » ; OSM note parfois plusieurs
// numéros (« 35;39bis »).
function numeros(numero: string): string[] {
  return numero.toLowerCase().replace(/\s+/g, '').split(/[;,]/).flatMap(n => {
    const plage = n.match(/^(\d+)-(\d+)$/)
    return plage ? [plage[1], plage[2]] : [n.replace(/(bis|ter|quater)$/, m => m[0])]
  })
}
const rue = (r: string) => motsDe(r).join(' ')

/** Le même numéro (ou une plage qui le contient) dans la même rue. */
export function memeAdresse(a?: Candidat['adresse'], b?: Candidat['adresse']): boolean {
  if (!a || !b || rue(a.rue) !== rue(b.rue)) return false
  const na = numeros(a.numero)
  return numeros(b.numero).some(n => na.includes(n))
}

// Des noms qui se ressemblent assez, à moins de 40 m ; à la même adresse, un mot commun suffit ; le même
// nom exactement, jusqu'à 100 m (les points d'Acceslibre sont parfois placés au milieu de l'immeuble ou de
// la rue, et les deux bases ne notent pas toujours le même numéro).
export const PROCHE_M = 40
export const MEME_ADRESSE_M = 80
export const MEME_NOM_M = 100

/**
 * Ce qui fait croire que c'est le même lieu, ou 0 si ce n'en est pas un : plus c'est grand, plus c'est sûr.
 * `courants` : les mots courants de l'endroit (voir `motsCourants`) ; `apparier` et `regrouper` les
 * trouvent seuls.
 */
export function score(a: Candidat, b: Candidat, courants = AUCUN): number {
  if (!!a.toilettes !== !!b.toilettes) return 0
  const metres = distanceMetres(a, b)
  // Le plus souvent, les deux lieux sont loin : inutile de comparer les noms (des centaines de paires).
  if (metres > MEME_NOM_M) return 0
  const noms = ressemblance(a.nom, b.nom, courants)
  const nom = memeNom(a.nom, b.nom, courants)
  if (noms === 0 && !nom) return 0
  const adresse = memeAdresse(a.adresse, b.adresse)
  const reconnu = (metres <= PROCHE_M && noms >= 0.5) || (adresse && metres <= MEME_ADRESSE_M && noms > 0) || nom
  return reconnu ? Math.max(noms, nom ? 1 : 0) + (adresse ? 1 : 0) + (1 - metres / MEME_NOM_M) : 0
}

export const memeLieu = (a: Candidat, b: Candidat, courants = AUCUN) => score(a, b, courants) > 0

// Un mot est courant s'il l'est dans l'une des deux listes : compter les deux ensemble compterait deux fois
// chaque lieu présent des deux côtés.
const courantsDe = (...listes: Candidat[][]) =>
  new Set(listes.flatMap(l => [...motsCourants(l.map(c => c.nom))]))

/**
 * Les paires [i, j] du même lieu entre deux listes : chaque lieu n'est apparié qu'une fois, au plus
 * ressemblant (deux fiches proches ne se disputent pas le même lieu).
 */
export function apparier(a: Candidat[], b: Candidat[]): [number, number][] {
  const courants = courantsDe(a, b)
  const paires = b.flatMap((y, j) => a.map((x, i) => ({ i, j, s: score(x, y, courants) }))).filter(p => p.s > 0)
  paires.sort((p, q) => q.s - p.s)
  const prisA = new Set<number>()
  const prisB = new Set<number>()
  const resultat: [number, number][] = []
  for (const { i, j } of paires) {
    if (prisA.has(i) || prisB.has(j)) continue
    prisA.add(i)
    prisB.add(j)
    resultat.push([i, j])
  }
  return resultat
}

/**
 * Les groupes d'une même liste qui décrivent le même lieu (Acceslibre a souvent deux fiches pour un lieu) :
 * des listes d'indices, le premier de chaque groupe étant le premier venu dans l'ordre donné.
 */
export function regrouper(lieux: Candidat[]): number[][] {
  const courants = courantsDe(lieux)
  const groupes: number[][] = []
  lieux.forEach((l, i) => {
    const groupe = groupes.find(g => memeLieu(lieux[g[0]], l, courants))
    if (groupe) groupe.push(i)
    else groupes.push([i])
  })
  return groupes
}

// ——— Depuis les données brutes ———

type ElementOsm = {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags: Record<string, string | undefined>
}

/** Un élément OSM (réponse d'Overpass, `out center tags`). Sans nom ni position : pas reconnaissable. */
export function depuisOsm(e: ElementOsm): Candidat | null {
  const lat = e.lat ?? e.center?.lat
  const lon = e.lon ?? e.center?.lon
  const nom = e.tags.name
  if (lat === undefined || lon === undefined || !nom) return null
  const numero = e.tags['addr:housenumber']
  const voie = e.tags['addr:street']
  return {
    id: `${e.type}/${e.id}`, nom, lat, lon,
    ...(numero && voie ? { adresse: { numero, rue: voie } } : {}),
    ...(e.tags.amenity === 'toilets' ? { toilettes: true } : {}),
  }
}

type FicheAcceslibre = {
  id: string
  name: string | null
  activite: string | null
  latitude: number | null
  longitude: number | null
  numero?: string | null
  voie?: string | null
}

/** Une fiche du fichier national Acceslibre (data.gouv.fr). */
export function depuisAcceslibre(f: FicheAcceslibre): Candidat | null {
  if (f.latitude === null || f.longitude === null || !f.name) return null
  return {
    id: `acceslibre/${f.id}`, nom: f.name, lat: f.latitude, lon: f.longitude,
    ...(f.numero && f.voie ? { adresse: { numero: f.numero, rue: f.voie } } : {}),
    ...(f.activite === 'Toilettes publiques' ? { toilettes: true } : {}),
  }
}
