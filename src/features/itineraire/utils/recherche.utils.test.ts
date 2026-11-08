import { describe, expect, it } from 'vitest'
import { decouper, lieuxCorrespondants } from '~/features/itineraire/utils/recherche.utils'
import type { Lieu } from '~/types/lieu.types'

const lieu = (nom: string, libelle = 'Café'): Lieu => ({
  id: nom, type: 'cafe', etat: 'ok', nom, libelle, lat: 48.85, lon: 2.35, metres: 100, lignes: [], sources: ['OpenStreetMap'],
})

describe('decouper', () => {
  it('met la rue en titre et la ville dessous', () => {
    expect(decouper('12 Rue Carnot 93230 Romainville')).toEqual({ titre: '12 Rue Carnot', detail: '93230 Romainville' })
  })

  it('garde tout en titre sans code postal', () => {
    expect(decouper('Mairie de Romainville')).toEqual({ titre: 'Mairie de Romainville' })
  })
})

describe('lieuxCorrespondants', () => {
  it('trouve un lieu sans tenir compte des accents ni des majuscules', () => {
    expect(lieuxCorrespondants([lieu('Café Élo'), lieu('Marlette')], 'elo').map(l => l.nom)).toEqual(['Café Élo'])
  })

  it('attend trois lettres, et ignore les lieux sans vrai nom', () => {
    expect(lieuxCorrespondants([lieu('Marlette')], 'ma')).toEqual([])
    expect(lieuxCorrespondants([lieu('Café', 'Café')], 'caf')).toEqual([])
  })

  it('en propose trois au plus', () => {
    expect(lieuxCorrespondants([lieu('Bar 1'), lieu('Bar 2'), lieu('Bar 3'), lieu('Bar 4')], 'bar')).toHaveLength(3)
  })
})
