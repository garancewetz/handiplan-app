import { describe, expect, it } from 'vitest'
import { placesForMap, type Bounds } from '~/features/map/utils/selection.utils'
import type { State, Place } from '~/types/place.types'

const here = { lat: 48.8531, lon: 2.4235 }

// Chaque pas de 0.0001° vers le nord éloigne d'environ 11 m.
const place = (id: string, state: State, notThere: number): Place => ({
  id, state, type: state === 'parking' ? 'parking' : 'restaurant', name: id, label: 'Restaurant',
  lat: here.lat + notThere * 0.0001, lon: here.lon, meters: 0, lines: [], sources: ['OpenStreetMap'],
})

// Un cadre d'environ 1,1 km de haut, centré sur « ici ».
const bounds: Bounds = { center: here, south: here.lat - 0.005, north: here.lat + 0.005, west: here.lon - 0.005, east: here.lon + 0.005 }

describe('placesForMap', () => {
  it('montre tout ce qui est dans le cadre, quelle que soit la couleur', () => {
    const places = [place('facile', 'ok', 1), place('difficile', 'no', 2), place('sans-info', 'unknown', 3), place('place', 'parking', 4)]
    expect(placesForMap(places, bounds).map(p => p.id)).toEqual(['facile', 'difficile', 'sans-info', 'place'])
  })

  it('ne montre pas ce qui est hors du cadre', () => {
    expect(placesForMap([place('loin', 'ok', 100)], bounds)).toEqual([])
  })

  it('au-delà de 40, garde les plus proches du centre de la carte, sans quota par couleur', () => {
    const places = Array.from({ length: 45 }, (_, i) => place(`l${i}`, i % 2 ? 'unknown' : 'ok', 45 - i))
    const ids = placesForMap(places, bounds).map(p => p.id)
    expect(ids).toHaveLength(40)
    expect(ids).toContain('l44') // le plus proche
    expect(ids).not.toContain('l0') // le plus loin
  })

  it('ne montre rien tant que la carte n’a pas de cadre', () => {
    expect(placesForMap([place('facile', 'ok', 1)], null)).toEqual([])
  })
})
