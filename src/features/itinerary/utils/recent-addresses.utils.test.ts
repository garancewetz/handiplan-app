import { describe, expect, it } from 'vitest'
import { toSuggest, withRecent, type Destination, fromStored } from '~/features/itinerary/utils/recent-addresses.utils'

const address = (name: string, lat: number, count = 1): Destination => ({ address: name, lat, lon: 2.35, count })
const names = (list: Destination[]) => list.map(d => d.address)

describe('avecRecente', () => {
  it('met la dernière destination en tête', () => {
    expect(names(withRecent([address('A', 48.80)], address('B', 48.85)))).toEqual(['B', 'A'])
  })

  it('ne garde pas deux fois la même destination, et compte les fois', () => {
    const list = [address('A', 48.80), address('B', 48.85)]
    expect(withRecent(list, address('B', 48.85))).toEqual([address('B', 48.85, 2), address('A', 48.80)])
    // Même endroit, autre libellé : on garde le plus récent.
    expect(names(withRecent(list, address('Mairie', 48.8501)))).toEqual(['Mairie', 'A'])
  })

  it('reconnaît un lieu à son identifiant, et garde de quoi l’afficher', () => {
    const place = { id: 'node/1', type: 'cafe' as const, label: 'Café' }
    const list = withRecent([], { ...address('Marlette', 48.85), place })
    expect(withRecent(list, { ...address('Marlette', 48.85), place })).toEqual([{ ...address('Marlette', 48.85, 2), place }])
  })

  it('oublie d’abord les anciennes, jamais celles demandées souvent', () => {
    const list = [...Array.from({ length: 11 }, (_, i) => address(`A${i}`, 48 + i / 10)), address('Kiné', 47, 4)]
    const remaining = withRecent(list, address('Nouvelle', 49))
    expect(remaining).toHaveLength(12)
    expect(names(remaining)).toContain('Kiné')
    expect(names(remaining)).not.toContain('A10')
  })

  it('ne garde que l’adresse, le point et le compte', () => {
    expect(withRecent([], { ...address('A', 48.8), title: 'A', detail: 'Paris' } as Destination)).toEqual([address('A', 48.8)])
  })
})

describe('aProposer', () => {
  it('met les plus demandées en premier, puis les dernières, cinq en tout', () => {
    const list = [address('Hier', 48.1), address('Kiné', 48.2, 9), address('Avant-hier', 48.3), address('Maison', 48.4, 5),
      address('A', 48.5), address('B', 48.6), address('C', 48.7)]
    const { often, recentOnes } = toSuggest(list)
    expect(names(often)).toEqual(['Kiné', 'Maison'])
    expect(names(recentOnes)).toEqual(['Hier', 'Avant-hier', 'A'])
  })
})

describe('fromStored', () => {
  it('relit une destination gardée sous l’ancienne forme, en français', () => {
    const ancienne = { lat: 48.85, lon: 2.35, adresse: '20 Rue des Rosiers 75004 Paris', fois: 3, lieu: { id: 'node/1', type: 'resto', libelle: 'Restaurant' } }
    expect(fromStored(ancienne)).toEqual({
      lat: 48.85, lon: 2.35, address: '20 Rue des Rosiers 75004 Paris', count: 3,
      place: { id: 'node/1', type: 'restaurant', label: 'Restaurant' },
    })
  })

  it('relit la nouvelle forme telle quelle, et compte une fois sans compteur', () => {
    expect(fromStored({ lat: 1, lon: 2, address: 'Mairie' })).toEqual({ lat: 1, lon: 2, address: 'Mairie', count: 1 })
  })

  it('écarte ce qui n’est pas une destination', () => {
    expect(fromStored({ lat: 1, lon: 2 })).toBeNull()
    expect(fromStored('x')).toBeNull()
  })
})

