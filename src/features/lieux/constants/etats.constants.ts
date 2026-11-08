import type { Etat } from '~/types/lieu.types'

// Un état se dit toujours avec les mêmes mots et le même symbole : légende, carte, liste, fiche
// (docs/decisions/interface, D18 et D24).
export const MOT_ETAT: Record<Etat, string> = {
  ok: 'Facile',
  verifier: 'Attention',
  non: 'Difficile',
  inconnu: 'Pas d’info',
  parking: 'Place handicapée',
}

export const SYMBOLE_ETAT: Record<Etat, string> = { ok: '✓', verifier: '!', non: '✕', inconnu: '?', parking: 'P' }
