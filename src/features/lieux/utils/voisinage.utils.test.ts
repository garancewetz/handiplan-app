import { describe, expect, it } from 'vitest'
import { assezLoin, dansLaZone, tropDezoome, garderVoisins, mesurerDepuis } from '~/features/lieux/utils/voisinage.utils'
import type { Lieu, Point } from '~/types/lieu.types'

const CENTRE: Point = { lat: 48.86, lon: 2.36 }
// Environ 111 m par millième de degré de latitude.
const auNord = (metres: number): Point => ({ lat: CENTRE.lat + metres / 111320, lon: CENTRE.lon })

const lieu = (id: string, point: Point, etat: Lieu['etat'] = 'ok'): Lieu => ({
  id, ...point, etat, type: 'cafe', nom: id, libelle: 'Café', lignes: [], metres: 0, sources: ['OpenStreetMap'],
})

describe('assezLoin', () => {
  it('ignore un petit glissement, recharge après un vrai déplacement', () => {
    expect(assezLoin(CENTRE, auNord(50))).toBe(false)
    expect(assezLoin(CENTRE, auNord(400))).toBe(true)
  })
})

describe('tropDezoome', () => {
  it('charge au zoom du quartier, pas au zoom de la ville', () => {
    expect(tropDezoome(17)).toBe(false)
    expect(tropDezoome(15)).toBe(false)
    expect(tropDezoome(13)).toBe(true)
  })
})

describe('garderVoisins', () => {
  const proche = lieu('proche', auNord(200))
  const voisin = lieu('voisin', auNord(1000))
  const lointain = lieu('lointain', auNord(3000))

  it('garde tous les voisins tant que la nouvelle zone n’a rien donné', () => {
    expect(garderVoisins([proche, voisin, lointain], [], CENTRE).map(l => l.id)).toEqual(['proche', 'voisin'])
  })

  it('laisse la nouvelle zone faire foi dans son rayon, et garde les voisins autour', () => {
    const nouveau = lieu('nouveau', auNord(100))
    expect(garderVoisins([proche, voisin, lointain], [nouveau], CENTRE).map(l => l.id)).toEqual(['nouveau', 'voisin'])
  })

  it('préfère la version la plus récente d’un même lieu', () => {
    const recent = { ...voisin, nom: 'Nouveau nom' }
    expect(garderVoisins([voisin], [recent], CENTRE)).toEqual([recent])
  })
})

describe('mesurerDepuis', () => {
  it('mesure depuis le point de référence et trie, les lieux tout bons en premier', () => {
    const [a, b, c] = mesurerDepuis(
      [lieu('loin', auNord(800)), lieu('gris', auNord(10), 'non'), lieu('pres', auNord(300))],
      CENTRE,
    )
    expect([a.id, b.id, c.id]).toEqual(['pres', 'loin', 'gris'])
    expect(a.metres).toBe(300)
  })
})

describe('dansLaZone', () => {
  it('ne garde que les lieux du rayon de recherche autour du centre', () => {
    expect(dansLaZone([lieu('dedans', auNord(500)), lieu('dehors', auNord(900))], CENTRE).map(l => l.id)).toEqual(['dedans'])
  })
})
