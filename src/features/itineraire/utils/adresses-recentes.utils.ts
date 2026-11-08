import type { Arrivee, TypeLieu } from '~/types/lieu.types'
import { distanceMetres } from '~/utils/distance.utils'

/** Une adresse ou un lieu déjà choisi, et combien de fois : ce qu'on demande souvent revient en premier. */
export type Destination = Arrivee & { fois: number; lieu?: { id: string; type: TypeLieu; libelle: string } }

// Comme Waze : les dernières destinations reviennent en un toucher. Elles restent sur le téléphone.
const CLE = 'adresses-recentes'
const GARDEES = 12
const PROPOSEES = 5
// À partir de trois fois, une destination est « souvent » demandée : on la garde et on la met en tête.
const SOUVENT = 3
// Deux adresses à moins de 30 m sont la même destination (« 12 rue Carnot » et « Mairie »).
const MEME_ENDROIT_M = 30

const memeDestination = (a: Destination, b: Omit<Destination, 'fois'>) =>
  a.lieu && b.lieu ? a.lieu.id === b.lieu.id : a.adresse === b.adresse || distanceMetres(a, b) <= MEME_ENDROIT_M

/** La nouvelle destination en tête, comptée une fois de plus, sans doublon. */
export function avecRecente(liste: Destination[], nouvelle: Omit<Destination, 'fois'>): Destination[] {
  const deja = liste.find(d => memeDestination(d, nouvelle))
  const tete: Destination = { lat: nouvelle.lat, lon: nouvelle.lon, adresse: nouvelle.adresse, fois: (deja?.fois ?? 0) + 1 }
  if (nouvelle.lieu) tete.lieu = nouvelle.lieu
  const suite = [tete, ...liste.filter(d => d !== deja)]
  // Trop longue : on oublie d'abord la plus ancienne de celles qui ne servent pas souvent.
  while (suite.length > GARDEES) {
    const rares = suite.filter(d => d.fois < SOUVENT)
    suite.splice(suite.indexOf(rares[rares.length - 1] ?? suite[suite.length - 1]), 1)
  }
  return suite
}

/** Ce que le panneau propose, champ vide : les plus demandées, puis les dernières, cinq en tout. */
export function aProposer(liste: Destination[]): { souvent: Destination[]; recentes: Destination[] } {
  const souvent = liste.filter(d => d.fois >= SOUVENT).sort((a, b) => b.fois - a.fois).slice(0, 3)
  const recentes = liste.filter(d => !souvent.includes(d)).slice(0, PROPOSEES - souvent.length)
  return { souvent, recentes }
}

export function lireRecentes(): Destination[] {
  try {
    const brut: unknown = JSON.parse(localStorage.getItem(CLE) ?? '[]')
    if (!Array.isArray(brut)) return []
    return brut
      .filter(d => typeof d?.adresse === 'string' && typeof d?.lat === 'number' && typeof d?.lon === 'number')
      // Les adresses gardées avant le compte valent une fois.
      .map(d => ({ ...d, fois: typeof d.fois === 'number' ? d.fois : 1 }) as Destination)
  } catch {
    return []
  }
}

export function memoriserRecente(nouvelle: Omit<Destination, 'fois'>): Destination[] {
  const liste = avecRecente(lireRecentes(), nouvelle)
  try {
    localStorage.setItem(CLE, JSON.stringify(liste))
  } catch { /* stockage indisponible : la liste repartira de zéro */ }
  return liste
}
