import { describe, expect, it } from 'vitest'
import { lieuxPourCarte, type Cadre } from '~/features/carte/utils/selection.utils'
import type { Etat, Lieu } from '~/types/lieu.types'

const ici = { lat: 48.8531, lon: 2.4235 }

// Chaque pas de 0.0001° vers le nord éloigne d'environ 11 m.
const lieu = (id: string, etat: Etat, pas: number): Lieu => ({
  id, etat, type: etat === 'parking' ? 'parking' : 'resto', nom: id, libelle: 'Restaurant',
  lat: ici.lat + pas * 0.0001, lon: ici.lon, metres: 0, lignes: [], sources: ['OpenStreetMap'],
})

// Un cadre d'environ 1,1 km de haut, centré sur « ici ».
const cadre: Cadre = { centre: ici, sud: ici.lat - 0.005, nord: ici.lat + 0.005, ouest: ici.lon - 0.005, est: ici.lon + 0.005 }

describe('lieuxPourCarte', () => {
  it('montre tout ce qui est dans le cadre, quelle que soit la couleur', () => {
    const lieux = [lieu('facile', 'ok', 1), lieu('difficile', 'non', 2), lieu('sans-info', 'inconnu', 3), lieu('place', 'parking', 4)]
    expect(lieuxPourCarte(lieux, cadre).map(l => l.id)).toEqual(['facile', 'difficile', 'sans-info', 'place'])
  })

  it('ne montre pas ce qui est hors du cadre', () => {
    expect(lieuxPourCarte([lieu('loin', 'ok', 100)], cadre)).toEqual([])
  })

  it('au-delà de 40, garde les plus proches du centre de la carte, sans quota par couleur', () => {
    const lieux = Array.from({ length: 45 }, (_, i) => lieu(`l${i}`, i % 2 ? 'inconnu' : 'ok', 45 - i))
    const ids = lieuxPourCarte(lieux, cadre).map(l => l.id)
    expect(ids).toHaveLength(40)
    expect(ids).toContain('l44') // le plus proche
    expect(ids).not.toContain('l0') // le plus loin
  })

  it('ne montre rien tant que la carte n’a pas de cadre', () => {
    expect(lieuxPourCarte([lieu('facile', 'ok', 1)], null)).toEqual([])
  })
})
