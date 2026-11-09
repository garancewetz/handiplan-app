import type { State } from '~/types/place.types'

// Un état se dit toujours avec les mêmes mots et le même symbole : légende, carte, liste, fiche
// (docs/decisions/interface, D18 et D24).
export const STATE_WORD: Record<State, string> = {
  ok: 'Facile',
  check: 'Attention',
  no: 'Difficile',
  unknown: 'Pas d’info',
  parking: 'Place handicapée',
}

export const STATE_SYMBOL: Record<State, string> = { ok: '✓', check: '!', no: '✕', unknown: '?', parking: 'P' }
