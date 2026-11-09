import type { Entrance, State, Toilets } from '~/types/place.types'

export type { Entrance, Toilets }

/**
 * La règle des couleurs, unique pour toutes les sources :
 * vert = tout bon, orange = en partie, rouge = difficile, pointillé = on ne sait rien (D24).
 */
export function color(entrance: Entrance, toilets: Toilets): Exclude<State, 'parking'> {
  if (entrance === 'unknown' && toilets === 'unknown') return 'unknown'
  if (entrance === 'ok' && toilets === 'yes') return 'ok'
  if (entrance === 'no' && toilets !== 'yes') return 'no'
  return 'check'
}
