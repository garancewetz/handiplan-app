import { describe, expect, it } from 'vitest'
import { farEnough, inArea, tooZoomedOut, keepNeighbors, measureFrom } from '~/features/places/utils/nearby.utils'
import type { Place, Point } from '~/types/place.types'

const CENTER: Point = { lat: 48.86, lon: 2.36 }
// Environ 111 m par millième de degré de latitude.
const northward = (meters: number): Point => ({ lat: CENTER.lat + meters / 111320, lon: CENTER.lon })

const place = (id: string, point: Point, state: Place['state'] = 'ok'): Place => ({
  id, ...point, state, type: 'cafe', name: id, label: 'Café', lines: [], meters: 0, sources: ['OpenStreetMap'],
})

describe('farEnough', () => {
  it('ignore un petit glissement, recharge après un vrai déplacement', () => {
    expect(farEnough(CENTER, northward(50))).toBe(false)
    expect(farEnough(CENTER, northward(400))).toBe(true)
  })
})

describe('tooZoomedOut', () => {
  it('charge au zoom du quartier, pas au zoom de la ville', () => {
    expect(tooZoomedOut(17)).toBe(false)
    expect(tooZoomedOut(15)).toBe(false)
    expect(tooZoomedOut(13)).toBe(true)
  })
})

describe('keepNeighbours', () => {
  const near = place('proche', northward(200))
  const neighbor = place('voisin', northward(1000))
  const distant = place('lointain', northward(3000))

  it('garde tous les voisins tant que la nouvelle zone n’a rien donné', () => {
    expect(keepNeighbors([near, neighbor, distant], [], CENTER).map(p => p.id)).toEqual(['proche', 'voisin'])
  })

  it('laisse la nouvelle zone faire foi dans son rayon, et garde les voisins autour', () => {
    const fresh = place('nouveau', northward(100))
    expect(keepNeighbors([near, neighbor, distant], [fresh], CENTER).map(p => p.id)).toEqual(['nouveau', 'voisin'])
  })

  it('préfère la version la plus récente d’un même lieu', () => {
    const recent = { ...neighbor, name: 'Nouveau nom' }
    expect(keepNeighbors([neighbor], [recent], CENTER)).toEqual([recent])
  })
})

describe('measureFrom', () => {
  it('mesure depuis le point de référence et trie, les lieux tout bons en premier', () => {
    const [a, b, c] = measureFrom(
      [place('loin', northward(800)), place('gris', northward(10), 'no'), place('pres', northward(300))],
      CENTER,
    )
    expect([a.id, b.id, c.id]).toEqual(['pres', 'loin', 'gris'])
    expect(a.meters).toBe(300)
  })
})

describe('inArea', () => {
  it('ne garde que les lieux du rayon de recherche autour du centre', () => {
    expect(inArea([place('dedans', northward(500)), place('dehors', northward(900))], CENTER).map(p => p.id)).toEqual(['dedans'])
  })
})
