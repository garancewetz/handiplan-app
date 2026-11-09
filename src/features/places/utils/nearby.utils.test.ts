import { describe, expect, it } from 'vitest'
import { farEnough, inArea, tooZoomedOut, keepNeighbours, measureFrom } from '~/features/places/utils/nearby.utils'
import type { Place, Point } from '~/types/place.types'

const CENTRE: Point = { lat: 48.86, lon: 2.36 }
// Environ 111 m par millième de degré de latitude.
const northward = (metres: number): Point => ({ lat: CENTRE.lat + metres / 111320, lon: CENTRE.lon })

const place = (id: string, point: Point, state: Place['state'] = 'ok'): Place => ({
  id, ...point, state, type: 'cafe', name: id, label: 'Café', lines: [], metres: 0, sources: ['OpenStreetMap'],
})

describe('assezLoin', () => {
  it('ignore un petit glissement, recharge après un vrai déplacement', () => {
    expect(farEnough(CENTRE, northward(50))).toBe(false)
    expect(farEnough(CENTRE, northward(400))).toBe(true)
  })
})

describe('tropDezoome', () => {
  it('charge au zoom du quartier, pas au zoom de la ville', () => {
    expect(tooZoomedOut(17)).toBe(false)
    expect(tooZoomedOut(15)).toBe(false)
    expect(tooZoomedOut(13)).toBe(true)
  })
})

describe('garderVoisins', () => {
  const near = place('proche', northward(200))
  const neighbour = place('voisin', northward(1000))
  const distant = place('lointain', northward(3000))

  it('garde tous les voisins tant que la nouvelle zone n’a rien donné', () => {
    expect(keepNeighbours([near, neighbour, distant], [], CENTRE).map(l => l.id)).toEqual(['proche', 'voisin'])
  })

  it('laisse la nouvelle zone faire foi dans son rayon, et garde les voisins autour', () => {
    const newOne = place('nouveau', northward(100))
    expect(keepNeighbours([near, neighbour, distant], [newOne], CENTRE).map(l => l.id)).toEqual(['nouveau', 'voisin'])
  })

  it('préfère la version la plus récente d’un même lieu', () => {
    const recent = { ...neighbour, name: 'Nouveau nom' }
    expect(keepNeighbours([neighbour], [recent], CENTRE)).toEqual([recent])
  })
})

describe('mesurerDepuis', () => {
  it('mesure depuis le point de référence et trie, les lieux tout bons en premier', () => {
    const [a, b, c] = measureFrom(
      [place('loin', northward(800)), place('gris', northward(10), 'no'), place('pres', northward(300))],
      CENTRE,
    )
    expect([a.id, b.id, c.id]).toEqual(['pres', 'loin', 'gris'])
    expect(a.metres).toBe(300)
  })
})

describe('dansLaZone', () => {
  it('ne garde que les lieux du rayon de recherche autour du centre', () => {
    expect(inArea([place('dedans', northward(500)), place('dehors', northward(900))], CENTRE).map(l => l.id)).toEqual(['dedans'])
  })
})
