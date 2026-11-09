import { describe, expect, it } from 'vitest'
import { split, matchingPlaces } from '~/features/itinerary/utils/search.utils'
import type { Place } from '~/types/place.types'

const place = (name: string, label = 'Café'): Place => ({
  id: name, type: 'cafe', state: 'ok', name, label, lat: 48.85, lon: 2.35, meters: 100, lines: [], sources: ['OpenStreetMap'],
})

describe('split', () => {
  it('met la rue en titre et la ville dessous', () => {
    expect(split('12 Rue Carnot 93230 Romainville')).toEqual({ title: '12 Rue Carnot', detail: '93230 Romainville' })
  })

  it('garde tout en titre sans code postal', () => {
    expect(split('Mairie de Romainville')).toEqual({ title: 'Mairie de Romainville' })
  })
})

describe('matchingPlaces', () => {
  it('trouve un lieu sans tenir compte des accents ni des majuscules', () => {
    expect(matchingPlaces([place('Café Élo'), place('Marlette')], 'elo').map(p => p.name)).toEqual(['Café Élo'])
  })

  it('attend trois lettres, et ignore les lieux sans vrai nom', () => {
    expect(matchingPlaces([place('Marlette')], 'ma')).toEqual([])
    expect(matchingPlaces([place('Café', 'Café')], 'caf')).toEqual([])
  })

  it('en propose trois au plus', () => {
    expect(matchingPlaces([place('Bar 1'), place('Bar 2'), place('Bar 3'), place('Bar 4')], 'bar')).toHaveLength(3)
  })
})
