import { describe, expect, it } from 'vitest'
import { cleZone, rectangleZones, repartir, zonesAutour } from '~/features/lieux/utils/zones.utils'

describe('zonesAutour', () => {
  it('ajoute les quartiers voisins près d’un coin', () => {
    // 48,8575 et 2,3575 tombent pile sur un coin de la grille (0,0025°).
    const zones = zonesAutour({ lat: 48.85751, lon: 2.35751 }, 50)
    expect(zones).toContain(cleZone(48.858, 2.358))
    expect(zones).toContain(cleZone(48.857, 2.357))
    expect(zones).toHaveLength(4)
  })
})

describe('zonesAutour, au milieu d’un quartier', () => {
  it('prend les petits quartiers (≈ 280 m) qui touchent le cercle', () => {
    const milieu = { lat: 48.85625, lon: 2.35625 }
    expect(zonesAutour(milieu, 50)).toEqual([cleZone(milieu.lat, milieu.lon)])
    // 600 m de rayon : environ 6 quartiers sur 8, à peine plus large que le cercle.
    expect(zonesAutour(milieu, 600).length).toBeLessThanOrEqual(70)
  })
})

const position = (p: { lat: number; lon: number }) => p

describe('rectangleZones', () => {
  it('couvre exactement les quartiers demandés', () => {
    expect(rectangleZones([cleZone(48.851, 2.351)])).toEqual([48.85, 2.35, 48.8525, 2.3525])
  })
})

describe('repartir', () => {
  it('range chaque élément dans son quartier, et garde les quartiers vides', () => {
    const ici = cleZone(48.851, 2.351)
    const vide = cleZone(48.86, 2.36)
    const parZone = repartir([{ lat: 48.851, lon: 2.351 }, { lat: 49, lon: 3 }], [ici, vide], position)
    expect(parZone.get(ici)).toHaveLength(1)
    expect(parZone.get(vide)).toEqual([])
  })
})
