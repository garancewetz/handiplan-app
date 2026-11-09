import { couleur } from '~/features/lieux/utils/couleur.utils'
import type { Adresse, Lieu, Ligne } from '~/types/lieu.types'
import { distanceMetres } from '~/utils/distance.utils'

// Sans accents ni ponctuation, et sans lettres doublées : « L'As du Fallafel » et « As du Falafel » se
// ressemblent.
const simplifier = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/([a-z])\1+/g, '$1').trim()

// Les petits mots et les mots du métier ne disent pas quel lieu c'est : deux noms qui commencent par
// « Le » ou « Café » ne sont pas pour autant le même lieu (docs/decisions/donnees, D11).
const MOTS_VIDES = new Set([
  'le', 'la', 'les', 'l', 'de', 'du', 'des', 'd', 'au', 'aux', 'a', 'et', 'en', 'chez', 'the', 'and',
  // déjà simplifiés : « pizzeria » devient « pizeria »
  'cafe', 'bar', 'restaurant', 'resto', 'brasserie', 'pizeria', 'creperie', 'snack', 'salon', 'tabac', 'hotel',
])
const mots = (nom: string) => new Set(simplifier(nom).split(' ').filter(m => m && !MOTS_VIDES.has(m)))

/** À quel point deux noms se ressemblent, de 0 à 1 : la part de mots communs (1 si l'un contient l'autre). */
export function ressemblance(a: string, b: string): number {
  const ma = mots(a)
  const mb = mots(b)
  if (ma.size === 0 || mb.size === 0) return simplifier(a) === simplifier(b) ? 1 : 0
  const communs = [...ma].filter(m => mb.has(m)).length
  if (communs === Math.min(ma.size, mb.size)) return 1
  return communs / new Set([...ma, ...mb]).size
}

const memeAdresse = (a?: Adresse, b?: Adresse) =>
  !!a && !!b && simplifier(a.numero) === simplifier(b.numero) && simplifier(a.rue) === simplifier(b.rue)

// Deux noms qui se ressemblent assez, à moins de 40 m ; à la même adresse, un mot commun suffit ; le même
// nom exactement, jusqu'à 100 m (les points d'Acceslibre sont parfois placés au milieu de l'immeuble ou de
// la rue, et les deux bases ne notent pas toujours le même numéro).
const PROCHE_M = 40
const MEME_ADRESSE_M = 80
const MEME_NOM_M = 100

/** Ce qui fait croire que c'est le même lieu, ou 0 si ce n'en est pas un : plus c'est grand, plus c'est sûr. */
export function score(a: Lieu, b: Lieu): number {
  if (a.type === 'parking' || b.type === 'parking') return 0
  // Des toilettes publiques ne sont jamais le café d'à côté, même à la même adresse.
  if ((a.type === 'wc') !== (b.type === 'wc')) return 0
  const metres = distanceMetres(a, b)
  // Le plus souvent, les deux lieux sont loin : inutile de comparer les noms (des centaines de paires).
  if (metres > MEME_NOM_M) return 0
  const noms = ressemblance(a.nom, b.nom)
  const adresse = memeAdresse(a.adresse, b.adresse)
  const memeLieu = (metres <= PROCHE_M && noms >= 0.5)
    || (adresse && metres <= MEME_ADRESSE_M && noms > 0)
    || (simplifier(a.nom) === simplifier(b.nom) && mots(a.nom).size > 0)
  return memeLieu ? noms + (adresse ? 1 : 0) + (1 - metres / MEME_NOM_M) : 0
}

/** Même lieu dans les deux bases. */
export const memeLieu = (a: Lieu, b: Lieu) => score(a, b) > 0

const minuscule = (texte: string) => texte.charAt(0).toLowerCase() + texte.slice(1)

type Aspect = 'entree' | 'toilettes'
const THEME: Record<Aspect, 'Entrée' | 'Toilettes'> = { entree: 'Entrée', toilettes: 'Toilettes' }
const INCONNU: Record<Aspect, string> = { entree: 'inconnue', toilettes: 'inconnues' }
// Du plus facile au plus difficile, pour garder la réponse la plus prudente.
const PRUDENCE: Record<string, number> = { ok: 0, partielle: 1, non: 2 }

const sait = (l: Lieu, aspect: Aspect) => !!l.acces && l.acces[aspect] !== INCONNU[aspect]

/**
 * Qui croire, pour l'entrée ou les toilettes, entre deux descriptions du même lieu : celle qui sait ; si
 * les deux savent et disent presque la même chose (« petite marche » et « sans marche », « petite marche »
 * et « marche haute »), la plus prudente ; le désaccord seulement quand l'une dit « sans marche » (ou
 * « toilettes adaptées ») et l'autre le contraire (docs/decisions/donnees, D12).
 */
function choisir(aspect: Aspect, p: Lieu, s: Lieu): { de: Lieu; desaccord: boolean } {
  if (!sait(s, aspect)) return { de: sait(p, aspect) ? p : s, desaccord: false }
  if (!sait(p, aspect)) return { de: s, desaccord: false }
  const vp = p.acces![aspect]
  const vs = s.acces![aspect]
  if (vp === vs) return { de: s, desaccord: false }
  if (aspect === 'toilettes' || (vp !== 'partielle' && vs !== 'partielle')) return { de: s, desaccord: true }
  return { de: PRUDENCE[vp] > PRUDENCE[vs] ? p : s, desaccord: false }
}

const PAS_D_ACCORD = 'les infos ne sont pas d’accord'
const CONSEIL_DESACCORD = 'Les infos ne sont pas d’accord : à vérifier sur place.'

/**
 * Deux descriptions du même lieu réunies en une : `s` (la plus détaillée) pour tout, sauf l'entrée et les
 * toilettes, choisies une à une (voir `choisir`). Les détails de l'autre (largeur de porte, sonnette…)
 * restent, et un vrai désaccord est dit en clair, avec ce que dit chacune (`noms`).
 */
function combiner(p: Lieu, s: Lieu, noms: [string, string]): Pick<Lieu, 'lignes' | 'acces' | 'etat' | 'conseil'> {
  const choix = { entree: choisir('entree', p, s), toilettes: choisir('toilettes', p, s) }
  const dit = (l: Lieu, theme: string, nom: string) => {
    const ligne = l.lignes.find(x => x.theme === theme) ?? l.lignes[0]
    return ligne ? `${nom} : ${minuscule(ligne.texte)}` : null
  }
  const essentielles = (aspect: Aspect): Ligne[] => {
    const theme = THEME[aspect]
    const de = (l: Lieu) => l.lignes.filter(x => x.theme === theme)
    const { de: choisie, desaccord } = choix[aspect]
    const tete: Ligne[] = desaccord
      ? [{ theme, reponse: 'attention', texte: `${theme} : ${PAS_D_ACCORD}`, detail: [dit(p, theme, noms[0]), dit(s, theme, noms[1])].filter(Boolean).join(' · ') }]
      : de(choisie).slice(0, 1)
    // puis les détails des deux (sans leur réponse principale), une fois chacun
    const details = [...de(choisie).slice(1), ...de(choisie === s ? p : s).slice(1)]
    return [...tete, ...details.filter((l, i) => details.findIndex(x => x.texte === l.texte) === i)]
  }
  // Les autres thèmes : `s`, et `p` pour ceux que `s` ne renseigne pas (un étage, une précision…).
  const themesS = new Set(s.lignes.map(l => l.theme))
  const autres = (l: Ligne) => l.theme !== 'Entrée' && l.theme !== 'Toilettes'
  const lignes = [
    ...essentielles('entree'), ...essentielles('toilettes'),
    ...s.lignes.filter(autres), ...p.lignes.filter(l => autres(l) && !themesS.has(l.theme)),
  ]
  // Un vrai désaccord compte comme « en partie » pour l'entrée, « on ne sait pas » pour les toilettes :
  // orange, jamais vert.
  const acces = s.acces && p.acces
    ? {
      entree: choix.entree.desaccord ? 'partielle' as const : choix.entree.de.acces!.entree,
      toilettes: choix.toilettes.desaccord ? 'inconnues' as const : choix.toilettes.de.acces!.toilettes,
    }
    : s.acces ?? p.acces
  const etat = acces ? couleur(acces.entree, acces.toilettes) : s.etat
  // (un désaccord peut venir d'avant : deux fiches Acceslibre qui se contredisaient déjà)
  const conseil = lignes.some(l => l.texte.endsWith(PAS_D_ACCORD)) ? CONSEIL_DESACCORD
    : etat === 'ok' && (s.type === 'cafe' || s.type === 'resto') ? 'Toilettes pour les clients : demandez au comptoir.'
    : etat === 'inconnu' ? s.conseil ?? p.conseil : undefined
  return { lignes, acces, etat, conseil }
}

/**
 * Le lieu des deux bases réunies : d'OpenStreetMap, le nom, le type et la position (plus précis) ;
 * d'Acceslibre, le détail. Pour l'entrée et les toilettes, voir `choisir`.
 */
function reunir(o: Lieu, a: Lieu): Lieu {
  return {
    ...a,
    ...combiner(o, a, ['OpenStreetMap', 'Acceslibre']),
    id: o.id, nom: o.nom, type: o.type, libelle: o.libelle, lat: o.lat, lon: o.lon, metres: o.metres,
    adresse: o.adresse ?? a.adresse,
    sources: ['OpenStreetMap', 'Acceslibre'],
  }
}

/**
 * Acceslibre a souvent deux fiches pour le même lieu, au même endroit (« Eataly » en Restaurant,
 * « EATALY PARIS MARAIS » en Restauration rapide) : on les réunit comme OSM et Acceslibre, la fiche qui
 * sait l'emportant sur celle qui ne sait pas. On part de celle qui en sait le plus.
 */
export function unParLieu(lieux: Lieu[]): Lieu[] {
  const savoir = (l: Lieu) => (sait(l, 'entree') ? 1 : 0) + (sait(l, 'toilettes') ? 1 : 0)
  const gardes: Lieu[] = []
  for (const l of [...lieux].sort((x, y) => savoir(y) - savoir(x) || y.lignes.length - x.lignes.length)) {
    const i = gardes.findIndex(g => memeLieu(g, l))
    if (i === -1) gardes.push(l)
    else gardes[i] = { ...gardes[i], ...combiner(l, gardes[i], ['Une fiche Acceslibre', 'une autre']) }
  }
  return gardes
}

/**
 * Un lieu présent des deux côtés n'apparaît qu'une fois. Chaque lieu n'est apparié qu'une fois, au plus
 * ressemblant : deux fiches Acceslibre proches ne se disputent plus le même lieu OSM.
 */
export function fusionner(osm: Lieu[], fiches: Lieu[]): Lieu[] {
  const acceslibre = unParLieu(fiches)
  const paires = acceslibre.flatMap((a, j) => osm.map((o, i) => ({ i, j, s: score(o, a) }))).filter(p => p.s > 0)
  paires.sort((x, y) => y.s - x.s)
  const lieux = [...osm]
  const prisOsm = new Set<number>()
  const prisAcceslibre = new Set<number>()
  for (const { i, j } of paires) {
    if (prisOsm.has(i) || prisAcceslibre.has(j)) continue
    prisOsm.add(i)
    prisAcceslibre.add(j)
    lieux[i] = reunir(osm[i], acceslibre[j])
  }
  return [...lieux, ...acceslibre.filter((_, j) => !prisAcceslibre.has(j))]
}

/**
 * Les plus faciles d'abord (facile et places, puis attention), puis les difficiles et les lieux sans
 * info ensemble, du plus proche au plus loin ; chaque groupe par distance (docs/decisions/interface, D25).
 */
export function trier(lieux: Lieu[]): Lieu[] {
  const rang = (l: Lieu) => ({ ok: 0, parking: 0, verifier: 1, inconnu: 2, non: 2 })[l.etat]
  return [...lieux].sort((a, b) => rang(a) - rang(b) || a.metres - b.metres)
}
