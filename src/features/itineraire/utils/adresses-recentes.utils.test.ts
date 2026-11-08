import { describe, expect, it } from 'vitest'
import { aProposer, avecRecente, type Destination } from '~/features/itineraire/utils/adresses-recentes.utils'

const adresse = (nom: string, lat: number, fois = 1): Destination => ({ adresse: nom, lat, lon: 2.35, fois })
const noms = (liste: Destination[]) => liste.map(d => d.adresse)

describe('avecRecente', () => {
  it('met la dernière destination en tête', () => {
    expect(noms(avecRecente([adresse('A', 48.80)], adresse('B', 48.85)))).toEqual(['B', 'A'])
  })

  it('ne garde pas deux fois la même destination, et compte les fois', () => {
    const liste = [adresse('A', 48.80), adresse('B', 48.85)]
    expect(avecRecente(liste, adresse('B', 48.85))).toEqual([adresse('B', 48.85, 2), adresse('A', 48.80)])
    // Même endroit, autre libellé : on garde le plus récent.
    expect(noms(avecRecente(liste, adresse('Mairie', 48.8501)))).toEqual(['Mairie', 'A'])
  })

  it('reconnaît un lieu à son identifiant, et garde de quoi l’afficher', () => {
    const lieu = { id: 'node/1', type: 'cafe' as const, libelle: 'Café' }
    const liste = avecRecente([], { ...adresse('Marlette', 48.85), lieu })
    expect(avecRecente(liste, { ...adresse('Marlette', 48.85), lieu })).toEqual([{ ...adresse('Marlette', 48.85, 2), lieu }])
  })

  it('oublie d’abord les anciennes, jamais celles demandées souvent', () => {
    const liste = [...Array.from({ length: 11 }, (_, i) => adresse(`A${i}`, 48 + i / 10)), adresse('Kiné', 47, 4)]
    const suite = avecRecente(liste, adresse('Nouvelle', 49))
    expect(suite).toHaveLength(12)
    expect(noms(suite)).toContain('Kiné')
    expect(noms(suite)).not.toContain('A10')
  })

  it('ne garde que l’adresse, le point et le compte', () => {
    expect(avecRecente([], { ...adresse('A', 48.8), titre: 'A', detail: 'Paris' } as Destination)).toEqual([adresse('A', 48.8)])
  })
})

describe('aProposer', () => {
  it('met les plus demandées en premier, puis les dernières, cinq en tout', () => {
    const liste = [adresse('Hier', 48.1), adresse('Kiné', 48.2, 9), adresse('Avant-hier', 48.3), adresse('Maison', 48.4, 5),
      adresse('A', 48.5), adresse('B', 48.6), adresse('C', 48.7)]
    const { souvent, recentes } = aProposer(liste)
    expect(noms(souvent)).toEqual(['Kiné', 'Maison'])
    expect(noms(recentes)).toEqual(['Hier', 'Avant-hier', 'A'])
  })
})
