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
  /** les noms des autres fiches du même lieu (voir `regrouper`) : chacun peut servir à le reconnaître */
  autresNoms?: string[]
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
// Le genre de lieu (café, bar, restaurant…) : interchangeable, « Café Leffe » est « Brasserie Leffe ».
const GENRES = [
  'café', 'bar', 'restaurant', 'resto', 'brasserie', 'bistrot', 'bistro', 'pub', 'snack', 'salon', 'tabac', 'hôtel',
  'toilettes', 'publiques', 'wc', 'sanisette',
].map(simplifier)
// La spécialité : elle ne prouve rien (« Bouillon Maurice » n'est pas « Bouillon de Lyon »), mais deux
// spécialités différentes sont deux lieux (« Boston Tavern » n'est pas « Boston Trattoria »).
const SPECIALITES = new Set([
  'bouillon', 'taverne', 'tavern', 'trattoria', 'estaminet', 'grill', 'coffee', 'pizzeria', 'crêperie', 'pizza',
  'pizzas', 'sushi', 'burger', 'burgers', 'tacos', 'kebab', 'ramen', 'poke', 'tapas', 'crêpe', 'crêpes',
].map(simplifier))
const MOTS_VIDES = new Set([...PETITS_MOTS, ...GENRES, ...SPECIALITES])

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

// Plusieurs points à moins de 50 m sont le même lieu (Acceslibre a souvent trois fiches pour un bar) :
// son nom ne doit compter qu'une fois.
const MEME_ENDROIT_M = 50

/**
 * Les mots que beaucoup de lieux d'un même endroit partagent (« marais », « beaubourg », « halles ») : ils
 * disent où est le lieu, pas lequel c'est. « Café du Marais » et « Kyo Marais » ne sont pas le même lieu.
 * Un mot compte une fois par endroit, pas une fois par fiche.
 */
export function motsCourants(lieux: Candidat[], seuil = 3): Set<string> {
  const endroits = new Map<string, Candidat[]>()
  for (const l of lieux) {
    for (const m of motsDe(l.nom)) {
      const vus = endroits.get(m) ?? []
      if (!vus.some(v => distanceMetres(v, l) <= MEME_ENDROIT_M)) vus.push(l)
      endroits.set(m, vus)
    }
  }
  return new Set([...endroits].filter(([, vus]) => vus.length >= seuil).map(([m]) => m))
}

/** Les mots des rues de l'endroit (« Canebière », « Confort », « Mercière ») : ils aussi disent où. */
export function motsDesRues(lieux: Candidat[]): Set<string> {
  return new Set(lieux.flatMap(l => (l.adresse ? motsDe(l.adresse.rue) : [])))
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

/** Les mots communs de deux noms, sans les mots courants de l'endroit, et la taille du plus court. */
function communs(a: string, b: string, courants: Set<string>) {
  const ma = motsDe(a).filter(m => !courants.has(m))
  const mb = motsDe(b).filter(m => !courants.has(m))
  const n = ma.filter(m => mb.some(x => memeMot(m, x))).length
  return { n, ma: ma.length, mb: mb.length }
}

/**
 * À quel point deux noms se ressemblent, de 0 à 1 : la part de mots communs (1 si les mots de l'un sont
 * tous dans l'autre), sans les mots courants de l'endroit. Un nom sans mot propre (« Restaurant », « Café »)
 * ne ressemble à rien : il ne dit pas quel lieu c'est.
 */
export function ressemblance(a: string, b: string, courants = AUCUN): number {
  const c = communs(a, b, courants)
  if (c.n === 0) return 0
  if (c.n >= Math.min(c.ma, c.mb)) return 1
  return c.n / (c.ma + c.mb - c.n)
}

// Une même spécialité écrite autrement : au singulier (« Crêpes » et « Crêpe »), et « pizzeria » est
// « pizza », « taverne » est « tavern ».
const MEME_SPECIALITE: Record<string, string> = Object.fromEntries(
  [['pizzeria', 'pizza'], ['crêperie', 'crêpe'], ['taverne', 'tavern']].map(([a, b]) => [simplifier(a), simplifier(b)]),
)
const specialites = (nom: string) =>
  simplifier(nom).split(' ').filter(m => SPECIALITES.has(m)).map(m => (MEME_SPECIALITE[m] ?? m).replace(/s$/, ''))
/** Deux spécialités différentes : deux lieux. Sans spécialité d'un côté, rien ne s'oppose. */
function specialitesCompatibles(a: string, b: string) {
  const sa = specialites(a)
  const sb = specialites(b)
  return sa.every(m => sb.includes(m)) || sb.every(m => sa.includes(m))
}

// Les mêmes mots dans le même ordre, à une faute de frappe près (voir `memeMot`) : « Paris Kebab » et
// « Paris Kebap ». Mot à mot et pas sur le nom collé : collés, « Bar de la Plaine » et « Beer de la Plaine »
// n'auraient qu'une lettre d'écart.
function presqueMemesMots(a: string, b: string) {
  const wa = simplifier(a).split(' ').filter(m => m && !PETITS_MOTS.has(m))
  const wb = simplifier(b).split(' ').filter(m => m && !PETITS_MOTS.has(m))
  return wa.length > 0 && wa.length === wb.length && wa.every((m, i) => memeMot(m, wb[i]))
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

// Un nom fait seulement de petits mots et de genres de lieu (« Le Café ») ne dit pas quel lieu c'est.
const sansNom = (nom: string) => simplifier(nom).split(' ').every(m => !m || PETITS_MOTS.has(m) || GENRES.includes(m))

/**
 * Le même nom : les mêmes lettres une fois collées (« Eat Day » et « EatDay », « Grill Burger »), les mêmes
 * mots à une faute près (« Paris Kebab » et « Paris Kebap »), ou les mêmes mots qui comptent (« Filippo » et « Restaurant Filippo »). Si ces mots ne sont que
 * des mots de l'endroit (« Bistrot Beaubourg », « Café Beaubourg »), il faut être tout près.
 */
function memeNom(a: string, b: string, courants: Set<string>, metres: number) {
  if (sansNom(a) || sansNom(b)) return false
  if (colle(a) === colle(b) || presqueMemesMots(a, b)) return true
  const egaux = (x: string[], y: string[]) => x.length > 0 && x.length === y.length && x.every(m => y.includes(m))
  // « Funky Monky » et « Funky Monky Lyon » : les mêmes mots, une fois retirés ceux de l'endroit
  const propres = (m: string[]) => m.filter(x => !courants.has(x))
  if (egaux(propres(motsDe(a)), propres(motsDe(b)))) return true
  return egaux(motsDe(a), motsDe(b)) && metres <= TOUT_PRES_M
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
// nom, jusqu'à 100 m (les points d'Acceslibre sont parfois placés au milieu de l'immeuble ou de la rue, et
// les deux bases ne notent pas toujours le même numéro). Un seul mot commun, quand chacun a d'autres mots
// (« Little Boston » et « Boston », « Café du Marais » et « Kyo Marais »), est une preuve faible : à 15 m au
// plus, ou à la même adresse.
export const TOUT_PRES_M = 15
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
  const adresse = memeAdresse(a.adresse, b.adresse)
  const nomsDe = (c: Candidat) => [c.nom, ...(c.autresNoms ?? [])]
  return Math.max(...nomsDe(a).flatMap(na => nomsDe(b).map(nb => scoreNoms(na, nb, metres, adresse, courants))))
}

function scoreNoms(a: string, b: string, metres: number, adresse: boolean, courants: Set<string>): number {
  if (!specialitesCompatibles(a, b)) return 0
  const noms = ressemblance(a, b, courants)
  const nom = memeNom(a, b, courants, metres)
  // À la même adresse, un mot commun suffit, même un mot courant : « Le Renard » et « Le Renard Bistrot »,
  // rue du Renard.
  const auMemeNumero = adresse && metres <= MEME_ADRESSE_M && ressemblance(a, b) > 0
  const c = communs(a, b, courants)
  const faible = c.n === 1 && c.ma > 1 && c.mb > 1
  const proche = metres <= (faible ? TOUT_PRES_M : PROCHE_M)
  const reconnu = (proche && noms >= 0.5) || auMemeNumero || nom
  return reconnu ? Math.max(noms, nom ? 1 : 0) + (adresse ? 1 : 0) + (1 - metres / MEME_NOM_M) : 0
}

export const memeLieu = (a: Candidat, b: Candidat, courants = AUCUN) => score(a, b, courants) > 0

// Un mot est courant s'il l'est dans l'une des deux listes (compter les deux ensemble compterait deux fois
// chaque lieu présent des deux côtés), ou s'il est dans le nom d'une rue.
const courantsDe = (...listes: Candidat[][]) =>
  new Set(listes.flatMap(l => [...motsCourants(l), ...motsDesRues(l)]))

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

/** Une fiche par lieu : la première de chaque groupe (voir `regrouper`), avec les noms des autres. */
export function uneFicheParLieu<T extends Candidat>(lieux: T[]): T[] {
  return regrouper(lieux).map(([premier, ...autres]) =>
    autres.length === 0 ? lieux[premier] : { ...lieux[premier], autresNoms: autres.map(i => lieux[i].nom) })
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
