import { describe, expect, it } from 'vitest'
import { xmlNouveauPoint, xmlGroupe, xmlModification, type ElementOsm } from '~/features/contribution/utils/osmchange.utils'

describe('xmlGroupe', () => {
  it('signe le groupe avec un commentaire clair, l’appli et #handiplan', () => {
    expect(xmlGroupe('Place ajoutée', false)).toBe(
      '<osm><changeset><tag k="comment" v="Place ajoutée"/><tag k="created_by" v="Handiplan"/><tag k="hashtags" v="#handiplan"/></changeset></osm>',
    )
  })

  it('dit « vu sur place » quand la personne répond à ce qu’elle voit', () => {
    expect(xmlGroupe('Accessibilité vérifiée', true)).toContain('<tag k="source" v="survey"/>')
  })
})

describe('xmlModification', () => {
  it('renvoie le point entier, avec sa version et ses nouvelles étiquettes', () => {
    const cafe: ElementOsm = { type: 'node', id: 42, version: 7, lat: 48.85, lon: 2.35, tags: { name: 'Café & Co' } }
    expect(xmlModification(cafe, 99, { name: 'Café & Co', wheelchair: 'yes' })).toBe(
      '<osmChange version="0.6" generator="Handiplan"><modify>'
      + '<node id="42" version="7" changeset="99" lat="48.85" lon="2.35"><tag k="name" v="Café &amp; Co"/><tag k="wheelchair" v="yes"/></node>'
      + '</modify></osmChange>',
    )
  })

  it('garde les nœuds d’un bâtiment : seules les étiquettes changent', () => {
    const batiment: ElementOsm = { type: 'way', id: 5, version: 2, nodes: [1, 2, 3, 1], tags: {} }
    expect(xmlModification(batiment, 99, { wheelchair: 'no' })).toContain('<way id="5" version="2" changeset="99"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="1"/><tag k="wheelchair" v="no"/></way>')
  })
})

describe('xmlNouveauPoint', () => {
  it('crée un point neuf, pour essayer sans toucher à la vraie carte', () => {
    expect(xmlNouveauPoint({ lat: 48.8, lon: 2.3 }, 7, { wheelchair: 'yes' })).toContain('<create><node id="-1" changeset="7" lat="48.8" lon="2.3"><tag k="wheelchair" v="yes"/></node></create>')
  })
})
