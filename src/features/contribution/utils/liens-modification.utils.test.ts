import { describe, expect, it } from 'vitest'
import { lienAjouterOsm, liensModification, lienModifierOsm } from '~/features/contribution/utils/liens-modification.utils'
import type { Lieu } from '~/types/lieu.types'

const lieu: Lieu = {
  id: 'node/42', type: 'cafe', etat: 'inconnu', nom: 'Le Train de Vie', libelle: 'Bar',
  lat: 48.88, lon: 2.43, metres: 50, lignes: [], sources: ['OpenStreetMap'],
}

describe('lienModifierOsm', () => {
  it('ouvre l’éditeur sur l’objet OSM', () => {
    expect(lienModifierOsm(lieu)).toBe('https://www.openstreetmap.org/edit?editor=id&node=42#hashtags=handiplan')
    expect(lienModifierOsm({ ...lieu, id: 'way/7' })).toBe('https://www.openstreetmap.org/edit?editor=id&way=7#hashtags=handiplan')
  })

  it('ne propose rien pour un lieu qui n’est pas dans OSM', () => {
    expect(lienModifierOsm({ ...lieu, id: 'acceslibre/abc' })).toBeNull()
  })
})

describe('liensModification', () => {
  it('met Acceslibre en premier quand le lieu y est', () => {
    const lien = 'https://acceslibre.beta.gouv.fr/app/x'
    expect(liensModification({ ...lieu, lienAcceslibre: lien }).map(l => l.url)).toEqual([lien, 'https://www.openstreetmap.org/edit?editor=id&node=42#hashtags=handiplan'])
    expect(liensModification({ ...lieu, id: 'acceslibre/abc', lienAcceslibre: lien }).map(l => l.url)).toEqual([lien])
  })

  it('propose d’ajouter sur Acceslibre un lieu qui n’y est pas', () => {
    expect(liensModification(lieu).map(l => l.texte)).toEqual(['Ajouter sur Acceslibre', 'Modifier sur OpenStreetMap'])
  })

  it('n’envoie pas les places handicapées vers Acceslibre', () => {
    expect(liensModification({ ...lieu, type: 'parking', etat: 'parking' }).map(l => l.texte)).toEqual(['Modifier sur OpenStreetMap'])
  })
})

describe('lienAjouterOsm', () => {
  it('ouvre l’éditeur au plus près du point', () => {
    expect(lienAjouterOsm({ lat: 48.8885, lon: 2.4393 })).toBe('https://www.openstreetmap.org/edit?editor=id#map=20/48.888500/2.439300&hashtags=handiplan')
  })
})
