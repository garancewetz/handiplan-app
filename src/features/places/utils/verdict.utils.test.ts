import { describe, expect, it } from 'vitest'
import { verdict } from '~/features/places/utils/verdict.utils'
import type { Place } from '~/types/place.types'

const place = (state: Place['state'], lines: Place['lines'] = []): Place => ({
  id: 'node/1', type: 'restaurant', state, name: 'King Falafel Palace', label: 'Restauration rapide',
  lat: 48.85, lon: 2.35, metres: 540, lines, sources: ['Acceslibre'],
})

describe('verdict', () => {
  it('dit d’abord si l’on peut y aller, puis ce qui gêne', () => {
    expect(verdict(place('no', [
      { theme: 'Entrée', answer: 'no', text: 'Marche haute ou escalier à l’entrée' },
      { theme: 'Entrée', answer: 'yes', text: 'Porte de 78 cm' },
      { theme: 'Entrée', answer: 'warning', text: 'Porte à ouvrir soi-même' },
      { theme: 'Toilettes', answer: 'no', text: 'Toilettes non adaptées' },
    ]))).toEqual({ state: 'no', title: 'Difficile', detail: 'marche haute ou escalier à l’entrée, toilettes non adaptées' })
  })

  it('ne cite pas ce qui va bien ni les autres thèmes', () => {
    expect(verdict(place('check', [
      { theme: 'Entrée', answer: 'yes', text: 'Entrée sans marche' },
      { theme: 'Toilettes', answer: 'warning', text: 'Toilettes : on ne sait pas' },
      { theme: 'Accueil', answer: 'warning', text: 'Pas de personnel à l’accueil' },
    ])).detail).toBe('toilettes : on ne sait pas')
  })

  it('dit simplement quand tout est bon, ou quand on ne sait rien', () => {
    expect(verdict(place('ok'))).toEqual({ state: 'ok', title: 'Facile', detail: 'Sans marche, toilettes adaptées' })
    expect(verdict(place('unknown'))).toEqual({ state: 'unknown', title: 'Pas encore d’info' })
  })
})

