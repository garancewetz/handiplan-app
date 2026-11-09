import { describe, expect, it } from 'vitest'
import { createNodeXml, changesetXml, modifyXml, type OsmElement } from '~/features/contribution/utils/osmchange.utils'

describe('changesetXml', () => {
  it('signe le groupe avec un commentaire clair, l’appli et #handiplan', () => {
    expect(changesetXml('Place ajoutée', false)).toBe(
      '<osm><changeset><tag k="comment" v="Place ajoutée"/><tag k="created_by" v="Handiplan 0.1"/><tag k="hashtags" v="#handiplan"/></changeset></osm>',
    )
  })

  it('dit « vu sur place » quand la personne répond à ce qu’elle voit', () => {
    expect(changesetXml('Accessibilité vérifiée', true)).toContain('<tag k="source" v="survey"/>')
  })
})

describe('modifyXml', () => {
  it('renvoie le point entier, avec sa version et ses nouvelles étiquettes', () => {
    const cafe: OsmElement = { type: 'node', id: 42, version: 7, lat: 48.85, lon: 2.35, tags: { name: 'Café & Co' } }
    expect(modifyXml(cafe, 99, { name: 'Café & Co', wheelchair: 'yes' })).toBe(
      '<osmChange version="0.6" generator="Handiplan 0.1"><modify>'
      + '<node id="42" version="7" changeset="99" lat="48.85" lon="2.35"><tag k="name" v="Café &amp; Co"/><tag k="wheelchair" v="yes"/></node>'
      + '</modify></osmChange>',
    )
  })

  it('garde les nœuds d’un bâtiment : seules les étiquettes changent', () => {
    const building: OsmElement = { type: 'way', id: 5, version: 2, nodes: [1, 2, 3, 1], tags: {} }
    expect(modifyXml(building, 99, { wheelchair: 'no' })).toContain('<way id="5" version="2" changeset="99"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="1"/><tag k="wheelchair" v="no"/></way>')
  })
})

describe('createNodeXml', () => {
  it('crée un point neuf, pour essayer sans toucher à la vraie carte', () => {
    expect(createNodeXml({ lat: 48.8, lon: 2.3 }, 7, { wheelchair: 'yes' })).toContain('<create><node id="-1" changeset="7" lat="48.8" lon="2.3"><tag k="wheelchair" v="yes"/></node></create>')
  })
})
