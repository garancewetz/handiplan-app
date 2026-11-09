import { describe, expect, it } from 'vitest'
import { osmAddLink, editLinks, osmEditLink } from '~/features/contribution/utils/edit-links.utils'
import type { Place } from '~/types/place.types'

const place: Place = {
  id: 'node/42', type: 'cafe', state: 'unknown', name: 'Le Train de Vie', label: 'Bar',
  lat: 48.88, lon: 2.43, meters: 50, lines: [], sources: ['OpenStreetMap'],
}

describe('osmEditLink', () => {
  it('ouvre l’éditeur sur l’objet OSM', () => {
    expect(osmEditLink(place)).toBe('https://www.openstreetmap.org/edit?editor=id&node=42#hashtags=handiplan')
    expect(osmEditLink({ ...place, id: 'way/7' })).toBe('https://www.openstreetmap.org/edit?editor=id&way=7#hashtags=handiplan')
  })

  it('ne propose rien pour un lieu qui n’est pas dans OSM', () => {
    expect(osmEditLink({ ...place, id: 'acceslibre/abc' })).toBeNull()
  })
})

describe('editLinks', () => {
  it('met Acceslibre en premier quand le lieu y est', () => {
    const link = 'https://acceslibre.beta.gouv.fr/app/x'
    expect(editLinks({ ...place, acceslibreLink: link }).map(item => item.url)).toEqual([link, 'https://www.openstreetmap.org/edit?editor=id&node=42#hashtags=handiplan'])
    expect(editLinks({ ...place, id: 'acceslibre/abc', acceslibreLink: link }).map(item => item.url)).toEqual([link])
  })

  it('propose d’ajouter sur Acceslibre un lieu qui n’y est pas', () => {
    expect(editLinks(place).map(link => link.text)).toEqual(['Ajouter sur Acceslibre', 'Modifier sur OpenStreetMap'])
  })

  it('n’envoie pas les places handicapées vers Acceslibre', () => {
    expect(editLinks({ ...place, type: 'parking', state: 'parking' }).map(link => link.text)).toEqual(['Modifier sur OpenStreetMap'])
  })
})

describe('osmAddLink', () => {
  it('ouvre l’éditeur au plus près du point', () => {
    expect(osmAddLink({ lat: 48.8885, lon: 2.4393 })).toBe('https://www.openstreetmap.org/edit?editor=id#map=20/48.888500/2.439300&hashtags=handiplan')
  })
})
