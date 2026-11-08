import { describe, expect, it } from 'vitest'
import { fusionner, memeLieu, trier } from '~/features/lieux/utils/fusion-lieux.utils'
import type { Lieu } from '~/types/lieu.types'

function lieu(champs: Partial<Lieu>): Lieu {
  return {
    id: 'node/1', type: 'cafe', etat: 'verifier', nom: 'Feria Café', libelle: 'Café',
    lat: 48.8566, lon: 2.3522, metres: 100, lignes: [], sources: ['OpenStreetMap'],
    ...champs,
  }
}

// ≈ 11 m vers le nord / ≈ 110 m vers le nord
const PROCHE = 48.8567
const LOIN = 48.8576

describe('memeLieu', () => {
  it('reconnaît le même lieu proche avec un nom ressemblant', () => {
    expect(memeLieu(lieu({}), lieu({ nom: 'FERIA CAFE', lat: PROCHE }))).toBe(true)
  })

  it('ne confond pas deux lieux éloignés', () => {
    expect(memeLieu(lieu({}), lieu({ lat: LOIN }))).toBe(false)
  })

  it('ne fusionne jamais les places handicapées', () => {
    expect(memeLieu(lieu({ type: 'parking' }), lieu({ type: 'parking' }))).toBe(false)
  })
})

describe('fusionner', () => {
  it('garde un seul lieu, avec la description Acceslibre et le nom OSM', () => {
    const osm = lieu({ nom: 'Feria Café' })
    const acceslibre = lieu({ id: 'acceslibre/9', nom: 'FERIA CAFE', etat: 'ok', lat: PROCHE, sources: ['Acceslibre'] })
    const resultat = fusionner([osm], [acceslibre])
    expect(resultat).toHaveLength(1)
    expect(resultat[0]).toMatchObject({ id: 'node/1', nom: 'Feria Café', etat: 'ok', sources: ['OpenStreetMap', 'Acceslibre'] })
  })

  it('ajoute les lieux qu’Acceslibre est seul à connaître', () => {
    const acceslibre = lieu({ id: 'acceslibre/9', nom: 'Le Bistrot', type: 'resto', lat: LOIN, sources: ['Acceslibre'] })
    expect(fusionner([lieu({})], [acceslibre])).toHaveLength(2)
  })
})

describe('trier', () => {
  it('met les plus faciles d’abord, puis les difficiles et les sans info mêlés, par distance', () => {
    const ordre = trier([
      lieu({ id: 'e', etat: 'inconnu', metres: 7 }),
      lieu({ id: 'd', etat: 'non', metres: 5 }),
      lieu({ id: 'a', etat: 'verifier', metres: 10 }),
      lieu({ id: 'b', etat: 'ok', metres: 200 }),
      lieu({ id: 'c', etat: 'parking', metres: 50 }),
    ]).map(l => l.id)
    expect(ordre).toEqual(['c', 'b', 'a', 'd', 'e'])
  })
})
