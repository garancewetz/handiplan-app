import { describe, expect, it } from 'vitest'
import { mergePlaces, sortPlaces } from '~/features/places/utils/merge-places.utils'
import type { Place } from '~/types/place.types'

function place(fields: Partial<Place>): Place {
  return {
    id: 'node/1', type: 'cafe', state: 'check', name: 'Feria Café', label: 'Café',
    lat: 48.8566, lon: 2.3522, metres: 100, lines: [], sources: ['OpenStreetMap'],
    ...fields,
  }
}

// ≈ 11 m vers le nord / ≈ 110 m vers le nord
const CLOSE = 48.8567
const FAR = 48.8576

describe('fusionner', () => {
  it('garde un seul lieu, avec la description Acceslibre et le nom OSM', () => {
    const osm = place({ name: 'Feria Café' })
    const acceslibre = place({ id: 'acceslibre/9', name: 'FERIA CAFE', state: 'ok', lat: CLOSE, sources: ['Acceslibre'] })
    const result = mergePlaces([osm], [acceslibre])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 'node/1', name: 'Feria Café', state: 'ok', sources: ['OpenStreetMap', 'Acceslibre'] })
  })

  it('un lieu OSM ne s’apparie qu’une fois, au plus ressemblant', () => {
    const osm = place({ name: 'Le Petit Marcel' })
    const near = place({ id: 'acceslibre/1', name: 'Petit Marcel', lat: CLOSE, sources: ['Acceslibre'] })
    const other = place({ id: 'acceslibre/2', name: 'Marcel et fils', lat: CLOSE, sources: ['Acceslibre'] })
    const result = mergePlaces([osm], [other, near])
    expect(result.map(l => l.id)).toEqual(['node/1', 'acceslibre/2'])
  })

  it('un Acceslibre muet sur les toilettes n’efface pas des toilettes adaptées notées dans OSM', () => {
    const osm = place({
      state: 'check', access: { entrance: 'unknown', toilets: 'yes' },
      lines: [{ theme: 'Entrée', answer: 'warning', text: 'Entrée : on ne sait pas' }, { theme: 'Toilettes', answer: 'yes', text: 'Toilettes adaptées' }],
    })
    const acceslibre = place({
      id: 'acceslibre/9', name: 'FERIA CAFE', lat: CLOSE, sources: ['Acceslibre'], state: 'check',
      access: { entrance: 'ok', toilets: 'unknown' },
      lines: [{ theme: 'Entrée', answer: 'yes', text: 'Entrée sans marche' }, { theme: 'Toilettes', answer: 'warning', text: 'Toilettes : on ne sait pas' }],
    })
    const [merged] = mergePlaces([osm], [acceslibre])
    expect(merged.state).toBe('ok')
    expect(merged.lines.map(l => l.text)).toEqual(['Entrée sans marche', 'Toilettes adaptées'])
    expect(merged.advice).toBe('Toilettes pour les clients : demandez au comptoir.')
  })

  it('quand OSM et Acceslibre se contredisent, ni l’un ni l’autre : « Attention », et ce que dit chacun', () => {
    // Restaurant Bayan : OSM « marche haute », Acceslibre « entrée sans marche » (et toilettes adaptées)
    const osm = place({
      name: 'Restaurant Bayan', state: 'no', access: { entrance: 'no', toilets: 'unknown' },
      lines: [{ theme: 'Entrée', answer: 'no', text: 'Marche haute ou escalier à l’entrée' }],
    })
    const acceslibre = place({
      id: 'acceslibre/9', name: 'Bayan', lat: CLOSE, sources: ['Acceslibre'], state: 'ok', access: { entrance: 'ok', toilets: 'yes' },
      lines: [
        { theme: 'Entrée', answer: 'yes', text: 'Entrée sans marche' },
        { theme: 'Entrée', answer: 'yes', text: 'Porte de 90 cm' },
        { theme: 'Toilettes', answer: 'yes', text: 'Toilettes adaptées' },
      ],
    })
    const [merged] = mergePlaces([osm], [acceslibre])
    expect(merged.state).toBe('check')
    expect(merged.lines[0]).toEqual({
      theme: 'Entrée', answer: 'warning', text: 'Entrée : les infos ne sont pas d’accord',
      detail: 'OpenStreetMap : marche haute ou escalier à l’entrée · Acceslibre : entrée sans marche',
    })
    expect(merged.lines.map(l => l.text)).toEqual(['Entrée : les infos ne sont pas d’accord', 'Porte de 90 cm', 'Toilettes adaptées'])
    expect(merged.advice).toBe('Les infos ne sont pas d’accord : à vérifier sur place.')
  })

  it('un désaccord sur les toilettes n’est jamais « Facile »', () => {
    const osm = place({ access: { entrance: 'ok', toilets: 'no' }, lines: [{ theme: 'Toilettes', answer: 'no', text: 'Toilettes non adaptées' }] })
    const acceslibre = place({
      id: 'acceslibre/9', lat: CLOSE, sources: ['Acceslibre'], state: 'ok', access: { entrance: 'ok', toilets: 'yes' },
      lines: [{ theme: 'Entrée', answer: 'yes', text: 'Entrée sans marche' }, { theme: 'Toilettes', answer: 'yes', text: 'Toilettes adaptées' }],
    })
    const [merged] = mergePlaces([osm], [acceslibre])
    expect(merged.state).toBe('check')
    expect(merged.lines.find(l => l.theme === 'Toilettes')?.detail).toBe('OpenStreetMap : toilettes non adaptées · Acceslibre : toilettes adaptées')
  })

  it('« petite marche » contre « sans marche » : pas de désaccord, la réponse la plus prudente', () => {
    const osm = place({ access: { entrance: 'partial', toilets: 'unknown' }, lines: [{ theme: 'Entrée', answer: 'warning', text: 'Une petite marche à l’entrée' }] })
    const acceslibre = place({
      id: 'acceslibre/9', lat: CLOSE, sources: ['Acceslibre'], access: { entrance: 'ok', toilets: 'yes' },
      lines: [{ theme: 'Entrée', answer: 'yes', text: 'Entrée sans marche' }, { theme: 'Entrée', answer: 'yes', text: 'Sonnette pour appeler' }, { theme: 'Toilettes', answer: 'yes', text: 'Toilettes adaptées' }],
    })
    const [merged] = mergePlaces([osm], [acceslibre])
    expect(merged.state).toBe('check')
    expect(merged.lines.map(l => l.text)).toEqual(['Une petite marche à l’entrée', 'Sonnette pour appeler', 'Toilettes adaptées'])
    expect(merged.advice).toBeUndefined()
  })

  it('« petite marche » contre « marches » : les deux disent une marche, on reste « Difficile »', () => {
    const osm = place({ access: { entrance: 'partial', toilets: 'unknown' }, lines: [{ theme: 'Entrée', answer: 'warning', text: 'Une petite marche à l’entrée' }] })
    const acceslibre = place({
      id: 'acceslibre/9', lat: CLOSE, sources: ['Acceslibre'], access: { entrance: 'no', toilets: 'no' },
      lines: [{ theme: 'Entrée', answer: 'no', text: '2 marches à l’entrée' }, { theme: 'Toilettes', answer: 'no', text: 'Toilettes non adaptées' }],
    })
    const [merged] = mergePlaces([osm], [acceslibre])
    expect(merged.state).toBe('no')
    expect(merged.lines[0].text).toBe('2 marches à l’entrée')
  })

  it('le lieu réuni garde la position et le type d’OSM, plus précis', () => {
    const osm = place({ type: 'restaurant', label: 'Restaurant', lat: 48.8566, metres: 100 })
    const acceslibre = place({ id: 'acceslibre/9', type: 'cafe', label: 'Café', lat: CLOSE, metres: 111, sources: ['Acceslibre'] })
    expect(mergePlaces([osm], [acceslibre])[0]).toMatchObject({ type: 'restaurant', label: 'Restaurant', lat: 48.8566, metres: 100 })
  })

  it('deux fiches Acceslibre du même lieu : celle qui sait l’emporte, pas la plus longue', () => {
    // « BENOIT » ne dit rien de l’entrée, « Benoit Paris » dit « entrée sans marche »
    const silent = place({
      id: 'acceslibre/1', name: 'BENOIT', sources: ['Acceslibre'], access: { entrance: 'unknown', toilets: 'yes' },
      lines: [{ theme: 'Entrée', answer: 'warning', text: 'Entrée : on ne sait pas' }, { theme: 'Toilettes', answer: 'yes', text: 'Toilettes adaptées' }, { theme: 'Accueil', answer: 'yes', text: 'Personnel formé au handicap' }],
    })
    const knows = place({
      id: 'acceslibre/2', name: 'Benoit Paris', sources: ['Acceslibre'], access: { entrance: 'ok', toilets: 'unknown' },
      lines: [{ theme: 'Entrée', answer: 'yes', text: 'Entrée sans marche' }, { theme: 'Toilettes', answer: 'warning', text: 'Toilettes : on ne sait pas' }],
    })
    const [merged, ...rest] = mergePlaces([], [silent, knows])
    expect(rest).toHaveLength(0)
    expect(merged.state).toBe('ok')
    expect(merged.lines.map(l => l.text)).toEqual(['Entrée sans marche', 'Toilettes adaptées', 'Personnel formé au handicap'])
  })

  it('deux fiches Acceslibre qui se contredisent : on le dit', () => {
    const stepFree = place({ id: 'acceslibre/1', name: 'Le Bûcheron', sources: ['Acceslibre'], access: { entrance: 'ok', toilets: 'unknown' }, lines: [{ theme: 'Entrée', answer: 'yes', text: 'Entrée sans marche' }] })
    const stairs = place({ id: 'acceslibre/2', name: 'Le Bucheron', sources: ['Acceslibre'], access: { entrance: 'no', toilets: 'unknown' }, lines: [{ theme: 'Entrée', answer: 'no', text: '3 marches à l’entrée' }] })
    const [merged] = mergePlaces([], [stepFree, stairs])
    expect(merged.state).toBe('check')
    expect(merged.lines[0].detail).toMatch(/^Une fiche Acceslibre : .* · une autre : /)
  })

  it('le désaccord entre deux fiches Acceslibre reste dit après la fusion avec OSM', () => {
    const stepFree = place({ id: 'acceslibre/1', name: 'Le Bûcheron', sources: ['Acceslibre'], access: { entrance: 'ok', toilets: 'unknown' }, lines: [{ theme: 'Entrée', answer: 'yes', text: 'Entrée sans marche' }] })
    const stairs = place({ id: 'acceslibre/2', name: 'Le Bucheron', sources: ['Acceslibre'], access: { entrance: 'no', toilets: 'unknown' }, lines: [{ theme: 'Entrée', answer: 'no', text: '3 marches à l’entrée' }] })
    const osm = place({ name: 'Le Bûcheron', access: { entrance: 'ok', toilets: 'unknown' }, lines: [{ theme: 'Entrée', answer: 'yes', text: 'Entrée sans marche' }] })
    const [merged] = mergePlaces([osm], [stepFree, stairs])
    expect(merged.state).toBe('check')
    expect(merged.advice).toBe('Les infos ne sont pas d’accord : à vérifier sur place.')
  })

  it('deux fiches Acceslibre du même lieu n’en font qu’une, la plus complète', () => {
    const short = place({ id: 'acceslibre/1', name: 'Eataly', sources: ['Acceslibre'] })
    const complete = place({ id: 'acceslibre/2', name: 'EATALY PARIS MARAIS', sources: ['Acceslibre'], lines: [{ theme: 'Entrée', answer: 'yes', text: 'Entrée sans marche' }] })
    expect(mergePlaces([], [short, complete]).map(l => l.id)).toEqual(['acceslibre/2'])
  })

  it('ne réunit jamais une place handicapée avec un café qui s’appelle « La Place »', () => {
    const spot = place({ id: 'node/2', type: 'parking', name: 'Place handicapée', state: 'parking' })
    const cafe = place({ id: 'acceslibre/9', name: 'La Place Handicapée', lat: CLOSE, sources: ['Acceslibre'] })
    expect(mergePlaces([spot], [cafe]).map(l => l.id).sort()).toEqual(['acceslibre/9', 'node/2'])
  })

  it('ajoute les lieux qu’Acceslibre est seul à connaître', () => {
    const acceslibre = place({ id: 'acceslibre/9', name: 'Le Bistrot', type: 'restaurant', lat: FAR, sources: ['Acceslibre'] })
    expect(mergePlaces([place({})], [acceslibre])).toHaveLength(2)
  })
})

describe('trier', () => {
  it('met les plus faciles d’abord, puis les difficiles et les sans info mêlés, par distance', () => {
    const order = sortPlaces([
      place({ id: 'e', state: 'unknown', metres: 7 }),
      place({ id: 'd', state: 'no', metres: 5 }),
      place({ id: 'a', state: 'check', metres: 10 }),
      place({ id: 'b', state: 'ok', metres: 200 }),
      place({ id: 'c', state: 'parking', metres: 50 }),
    ]).map(l => l.id)
    expect(order).toEqual(['c', 'b', 'a', 'd', 'e'])
  })
})
