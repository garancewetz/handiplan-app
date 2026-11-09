import { couleur } from '~/features/lieux/utils/couleur.utils'
import { apparier, regrouper, type Candidat } from '~/features/lieux/utils/rapprochement.utils'
import type { Lieu, Ligne } from '~/types/lieu.types'

// Reconnaître le même lieu : rapprochement.utils.ts (indépendant de l'affichage). Ici, réunir ce que
// disent les deux descriptions en une seule fiche.

const candidat = (l: Lieu): Candidat => ({ id: l.id, nom: l.nom, lat: l.lat, lon: l.lon, adresse: l.adresse, toilettes: l.type === 'wc', autresNoms: l.autresNoms })

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

const CONSEIL_DESACCORD = 'Les infos ne sont pas d’accord : à vérifier sur place.'

/**
 * Deux descriptions du même lieu réunies en une : `s` (la plus détaillée) pour tout, sauf l'entrée et les
 * toilettes, choisies une à une (voir `choisir`). Les détails de l'autre (largeur de porte, sonnette…)
 * restent, et un vrai désaccord est dit en clair, avec ce que dit chacune (`noms`).
 */
function combiner(p: Lieu, s: Lieu, noms: [string, string]): Pick<Lieu, 'lignes' | 'acces' | 'etat' | 'conseil' | 'desaccord'> {
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
      ? [{ theme, reponse: 'attention', texte: `${theme} : les infos ne sont pas d’accord`, detail: [dit(p, theme, noms[0]), dit(s, theme, noms[1])].filter(Boolean).join(' · ') }]
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
  const desaccord = choix.entree.desaccord || choix.toilettes.desaccord || !!p.desaccord || !!s.desaccord
  const conseil = desaccord ? CONSEIL_DESACCORD
    : etat === 'ok' && (s.type === 'cafe' || s.type === 'resto') ? 'Toilettes pour les clients : demandez au comptoir.'
    : etat === 'inconnu' ? s.conseil ?? p.conseil : undefined
  return { lignes, acces, etat, conseil, ...(desaccord ? { desaccord } : {}) }
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
  const tries = [...lieux].sort((x, y) => savoir(y) - savoir(x) || y.lignes.length - x.lignes.length)
  return regrouper(tries.map(candidat)).map(([premier, ...autres]) =>
    autres.reduce((g, i) => ({
      ...g, ...combiner(tries[i], g, ['Une fiche Acceslibre', 'une autre']),
      autresNoms: [...(g.autresNoms ?? []), tries[i].nom],
    }), tries[premier]))
}

/**
 * Un lieu présent des deux côtés n'apparaît qu'une fois. Les places handicapées ne sont jamais réunies :
 * deux places voisines sont bien deux places.
 */
export function fusionner(osm: Lieu[], fiches: Lieu[]): Lieu[] {
  const acceslibre = unParLieu(fiches)
  const lieux = osm.filter(l => l.type !== 'parking')
  const paires = apparier(lieux.map(candidat), acceslibre.map(candidat))
  const reunis = new Map(paires.map(([i, j]) => [i, reunir(lieux[i], acceslibre[j])]))
  const pris = new Set(paires.map(([, j]) => j))
  return [
    ...lieux.map((l, i) => reunis.get(i) ?? l),
    ...osm.filter(l => l.type === 'parking'),
    ...acceslibre.filter((_, j) => !pris.has(j)),
  ]
}

/**
 * Les plus faciles d'abord (facile et places, puis attention), puis les difficiles et les lieux sans
 * info ensemble, du plus proche au plus loin ; chaque groupe par distance (docs/decisions/interface, D25).
 */
export function trier(lieux: Lieu[]): Lieu[] {
  const rang = (l: Lieu) => ({ ok: 0, parking: 0, verifier: 1, inconnu: 2, non: 2 })[l.etat]
  return [...lieux].sort((a, b) => rang(a) - rang(b) || a.metres - b.metres)
}
