import { describe, expect, it } from 'vitest'
import { htmlPastille, nomPastille } from '~/features/carte/utils/pastille.utils'
import type { Lieu } from '~/types/lieu.types'

const lieu = (nom: string, etat: Lieu['etat'], type: Lieu['type'] = 'cafe'): Lieu => ({
  id: nom, type, etat, nom, libelle: 'Café', lat: 48.85, lon: 2.35, metres: 100, lignes: [], sources: ['OpenStreetMap'],
})

describe('nomPastille', () => {
  it('donne le nom puis l’état, pour un lecteur d’écran', () => {
    expect(nomPastille(lieu('Marlette', 'verifier'))).toBe('Marlette, attention')
  })

  it('ne répète pas « Place handicapée »', () => {
    expect(nomPastille(lieu('Place handicapée', 'parking', 'parking'))).toBe('Place handicapée')
  })
})

describe('htmlPastille', () => {
  it('met le symbole de l’état dans un coin, sauf pour une place', () => {
    expect(htmlPastille(lieu('Marlette', 'non'), false)).toContain('<span class="etat">✕</span>')
    expect(htmlPastille(lieu('Place handicapée', 'parking', 'parking'), false)).not.toContain('class="etat"')
  })
})

describe('htmlPastille, pour un lecteur d’écran', () => {
  it('cache le dessin et le symbole : la pastille garde son nom (« Marlette, attention »)', () => {
    expect(htmlPastille(lieu('Marlette', 'verifier'), false)).toMatch(/^<div class="marqueur verifier" aria-hidden="true">/)
  })
})
