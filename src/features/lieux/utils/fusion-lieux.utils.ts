import type { Lieu } from '~/types/lieu.types'
import { distanceMetres } from '~/utils/distance.utils'

const simplifier = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

/** Même lieu dans les deux bases : à moins de 40 m, avec un nom qui se ressemble. */
export function memeLieu(a: Lieu, b: Lieu) {
  if (a.type === 'parking' || b.type === 'parking') return false
  if (distanceMetres(a, b) > 40) return false
  const na = simplifier(a.nom)
  const nb = simplifier(b.nom)
  return na.includes(nb) || nb.includes(na) || na.split(' ')[0] === nb.split(' ')[0]
}

/**
 * Un lieu présent des deux côtés n'apparaît qu'une fois, avec la description d'Acceslibre
 * (plus détaillée sur l'entrée et les toilettes) et le nom d'OpenStreetMap (plus soigné).
 * OpenStreetMap complète les thèmes qu'Acceslibre ne renseigne pas (un étage, une précision…).
 */
export function fusionner(osm: Lieu[], acceslibre: Lieu[]): Lieu[] {
  const lieux = [...osm]
  for (const a of acceslibre) {
    const i = lieux.findIndex(o => o.sources.includes('OpenStreetMap') && memeLieu(o, a))
    if (i === -1) {
      lieux.push(a)
    } else {
      const o = lieux[i]
      const themes = new Set(a.lignes.map(l => l.theme))
      const enPlus = o.lignes.filter(l => !themes.has(l.theme))
      lieux[i] = { ...a, id: o.id, nom: o.nom, lignes: [...a.lignes, ...enPlus], sources: ['OpenStreetMap', 'Acceslibre'] }
    }
  }
  return lieux
}

/**
 * Les plus faciles d'abord (facile et places, puis attention), puis les difficiles et les lieux sans
 * info ensemble, du plus proche au plus loin ; chaque groupe par distance (docs/decisions/interface, D25).
 */
export function trier(lieux: Lieu[]): Lieu[] {
  const rang = (l: Lieu) => ({ ok: 0, parking: 0, verifier: 1, inconnu: 2, non: 2 })[l.etat]
  return [...lieux].sort((a, b) => rang(a) - rang(b) || a.metres - b.metres)
}
