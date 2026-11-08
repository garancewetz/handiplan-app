import { describe, expect, it } from 'vitest'
import { COLONNES_ACCESLIBRE } from '../../src/features/lieux/utils/description-acceslibre.utils'
import { ETIQUETTES_OSM } from '../../src/features/lieux/utils/description-osm.utils'
import { KEPT_TAGS, REQUIRED_COLUMNS, acceslibrePlace, centerOf, csvRows, featureToElement, keepOsm } from './prepare.mjs'

describe('kept fields', () => {
  it('match what the app reads', () => {
    expect([...KEPT_TAGS].sort()).toEqual([...ETIQUETTES_OSM].sort())
    expect([...REQUIRED_COLUMNS].sort()).toEqual([...COLONNES_ACCESLIBRE].sort())
  })
})

describe('keepOsm', () => {
  it('keeps parking spaces, toilets and food places, even without accessibility info', () => {
    expect(keepOsm({ amenity: 'parking_space', parking_space: 'disabled' })).toBe(true)
    expect(keepOsm({ amenity: 'parking', 'capacity:disabled': '2' })).toBe(true)
    expect(keepOsm({ amenity: 'toilets' })).toBe(true)
    expect(keepOsm({ amenity: 'bar' })).toBe(true)
  })

  it('drops parkings without disabled spaces, and shops', () => {
    expect(keepOsm({ amenity: 'parking', 'capacity:disabled': 'no' })).toBe(false)
    expect(keepOsm({ amenity: 'parking' })).toBe(false)
    expect(keepOsm({ shop: 'bakery', wheelchair: 'yes' })).toBe(false)
  })
})

describe('centerOf', () => {
  it('handles points, lines and polygons', () => {
    expect(centerOf({ type: 'Point', coordinates: [2, 48] })).toEqual([2, 48])
    expect(centerOf({ type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] })).toEqual([1, 1])
    expect(centerOf({ type: 'Polygon', coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]] })).toEqual([1, 1])
    expect(centerOf({ type: 'GeometryCollection' })).toBeNull()
  })
})

describe('featureToElement', () => {
  it('turns an osmium feature into the element shape the app reads, keeping only useful tags', () => {
    const element = featureToElement({
      id: 'w42',
      geometry: { type: 'Polygon', coordinates: [[[2, 48], [2.002, 48], [2.002, 48.002], [2, 48.002], [2, 48]]] },
      properties: { amenity: 'cafe', name: 'Le Zinc', wheelchair: 'yes', opening_hours: '8-20' },
    })
    expect(element).toMatchObject({ type: 'way', id: 42, tags: { name: 'Le Zinc', amenity: 'cafe', wheelchair: 'yes' } })
    expect(element.lat).toBeCloseTo(48.001)
    expect(element.lon).toBeCloseTo(2.001)
  })

  it('ignores unwanted features and unknown ids', () => {
    expect(featureToElement({ id: 'n1', geometry: { type: 'Point', coordinates: [2, 48] }, properties: { shop: 'bakery' } })).toBeNull()
    expect(featureToElement({ id: 'x1', geometry: { type: 'Point', coordinates: [2, 48] }, properties: { amenity: 'bar' } })).toBeNull()
  })
})

describe('acceslibrePlace', () => {
  const row = { id: 'a', web_url: '', name: 'Musée', activite: 'Musée', latitude: '48.8', longitude: '2.3',
    entree_plain_pied: 'True', entree_marches: '', entree_marches_rampe: '', entree_ascenseur: '',
    accueil_cheminement_plain_pied: '', accueil_cheminement_ascenseur: '', sanitaires_adaptes: 'True' }

  it('keeps places with accessible toilets, converting types', () => {
    expect(acceslibrePlace(row)).toMatchObject({ latitude: 48.8, entree_plain_pied: true, sanitaires_adaptes: true, web_url: null })
  })

  it('converts the detail columns, and leaves missing ones empty', () => {
    expect(acceslibrePlace({ ...row, entree_largeur_mini: '90', accueil_personnels: 'formés', stationnement_pmr: 'False' }))
      .toMatchObject({ entree_largeur_mini: 90, accueil_personnels: 'formés', stationnement_pmr: false, labels: null })
  })

  it('keeps places with steps at the entrance, and drops the rest', () => {
    expect(acceslibrePlace({ ...row, sanitaires_adaptes: '', entree_plain_pied: 'False', entree_marches: '2' })).toMatchObject({ entree_marches: 2 })
    expect(acceslibrePlace({ ...row, sanitaires_adaptes: '', entree_plain_pied: 'True' })).toBeNull()
  })
})

describe('csvRows', () => {
  it('reads quotes, doubled quotes and line breaks inside quotes, across chunks', async () => {
    const rows = []
    for await (const r of csvRows(['a,"b,c","say ""hi""\nthere"\n1,', '2,3\n'])) rows.push(r)
    expect(rows).toEqual([['a', 'b,c', 'say "hi"\nthere'], ['1', '2', '3']])
  })
})
