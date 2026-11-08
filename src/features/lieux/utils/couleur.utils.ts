import type { Etat } from '~/types/lieu.types'

export type Entree = 'ok' | 'partielle' | 'non' | 'inconnue'
export type Toilettes = 'oui' | 'non' | 'inconnues'

/**
 * La règle des couleurs, unique pour toutes les sources :
 * vert = tout bon, orange = en partie, rouge = difficile, pointillé = on ne sait rien (D24).
 */
export function couleur(entree: Entree, toilettes: Toilettes): Exclude<Etat, 'parking'> {
  if (entree === 'inconnue' && toilettes === 'inconnues') return 'inconnu'
  if (entree === 'ok' && toilettes === 'oui') return 'ok'
  if (entree === 'non' && toilettes !== 'oui') return 'non'
  return 'verifier'
}
