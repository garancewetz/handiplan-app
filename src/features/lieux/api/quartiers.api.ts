import type { Point } from '~/types/lieu.types'
import { stockageNavigateur, type Garde, type Stockage } from '~/features/lieux/api/stockage-quartiers.api'
import { rectangleZones, repartir, zonesAutour } from '~/features/lieux/utils/zones.utils'

// Au-delà d'un jour, un quartier gardé s'affiche quand même, puis se met à jour sans attendre.
const RAFRAICHIR_APRES = 24 * 3600 * 1000

export type Rectangle = [number, number, number, number]

type Options<T> = {
  /** préfixe des clés gardées : `osm-q1`, `acceslibre-q1`… (le changer oublie l'ancienne forme) */
  jeu: string
  centre: Point
  rayon: number
  /** interroge le serveur sur ce rectangle [sud, ouest, nord, est] */
  charger: (rectangle: Rectangle) => Promise<T[]>
  /** où se trouve un élément, pour le ranger dans son quartier */
  position: (element: T) => Point | null
  /** où garder les quartiers (la base du navigateur, sauf dans les tests) */
  stockage?: Stockage | null
}

const enRafraichissement = new Set<string>()

// Les anciennes formes, gardées dans localStorage : elles ne servent plus, on libère la place.
const ANCIENNES_FORMES = ['osm-v4:', 'acceslibre-v2:', 'osm-z1:', 'acceslibre-z1:']
let menageFait = false
function faireLeMenage() {
  if (menageFait) return
  menageFait = true
  try {
    const cles = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
    cles.filter(c => c && ANCIENNES_FORMES.some(f => c.startsWith(f))).forEach(c => localStorage.removeItem(c!))
  } catch { /* stockage indisponible : rien à libérer */ }
}

async function chargerEtGarder<T>({ jeu, charger, position, stockage }: Options<T>, cles: string[]) {
  const parZone = repartir(await charger(rectangleZones(cles)), cles, position)
  const date = Date.now()
  const entrees = [...parZone].map(([cle, liste]): [string, Garde] => [`${jeu}:${cle}`, { date, donnees: liste }])
  // Garder est un plus : si la base refuse (pleine, indisponible), on a quand même les lieux.
  await stockage?.ecrire(entrees).catch(() => {})
  // Seulement les quartiers demandés : le rectangle peut couvrir un quartier déjà gardé, dont les
  // lieux sont déjà dans la liste (ils apparaissaient en double).
  return [...parZone.values()].flat()
}

/**
 * Les éléments autour d'un point, quartier par quartier (≈ 280 m) : les quartiers gardés sur le
 * téléphone s'affichent tout de suite, les autres sont chargés en une seule demande, à peine plus
 * large que le voisinage. Un quartier gardé depuis plus d'un jour est remis à jour en arrière-plan
 * (docs/decisions/carte, D6).
 */
export async function chargerParQuartiers<T>({ stockage = stockageNavigateur, ...reste }: Options<T>): Promise<T[]> {
  faireLeMenage()
  const options = { ...reste, stockage }
  const cles = zonesAutour(options.centre, options.rayon)
  const gardes = (await stockage?.lire(cles.map(c => `${options.jeu}:${c}`)).catch(() => null)) ?? new Map<string, Garde>()
  const trouves: T[] = []
  const manquants: string[] = []
  const anciens: string[] = []
  for (const cle of cles) {
    const garde = gardes.get(`${options.jeu}:${cle}`)
    if (!garde) { manquants.push(cle); continue }
    trouves.push(...(garde.donnees as T[]))
    if (Date.now() - garde.date > RAFRAICHIR_APRES && !enRafraichissement.has(`${options.jeu}:${cle}`)) anciens.push(cle)
  }

  if (anciens.length > 0) {
    anciens.forEach(c => enRafraichissement.add(`${options.jeu}:${c}`))
    // Sans attendre : la mise à jour servira à la prochaine ouverture.
    chargerEtGarder(options, anciens).catch(() => {}).finally(() => anciens.forEach(c => enRafraichissement.delete(`${options.jeu}:${c}`)))
  }
  if (manquants.length === 0) return trouves
  return [...trouves, ...(await chargerEtGarder(options, manquants))]
}
