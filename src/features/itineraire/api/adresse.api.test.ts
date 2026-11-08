import { describe, expect, it } from 'vitest'
import { lieuxProches, type LieuPhoton } from '~/features/itineraire/api/adresse.api'

const marais = { lat: 48.857, lon: 2.358 }
const lieu = (name: string, lat: number, lon: number, osm_key = 'amenity', city = 'Paris'): LieuPhoton =>
  ({ geometry: { coordinates: [lon, lat] }, properties: { name, osm_key, city } })

describe('lieuxProches', () => {
  it('met le lieu du même nom le plus proche en premier, et écarte ceux d’autres villes', () => {
    const resultats = [
      lieu('King Falafel', 52.07, 4.30, 'amenity', 'La Haye'),
      lieu('King Falafel Palace Bis', 48.87, 2.36),
      lieu('King Falafel Palace', 48.8571, 2.3596),
    ]
    expect(lieuxProches(resultats, marais).map(s => s.titre)).toEqual(['King Falafel Palace', 'King Falafel Palace Bis'])
  })

  it('fait passer le nom tapé avant un nom approchant plus proche', () => {
    const resultats = [lieu('Amulette', 48.86, 2.36), lieu('L’Amourette', 48.853, 2.4235, 'amenity', 'Montreuil')]
    expect(lieuxProches(resultats, marais, 'amourette').map(s => s.titre)).toEqual(['L’Amourette', 'Amulette'])
  })

  it('ignore les rues et les villes du même nom', () => {
    expect(lieuxProches([lieu('Rue du Roi', 48.857, 2.358, 'highway')], marais)).toEqual([])
  })

  it('dit à quelle distance est le lieu', () => {
    expect(lieuxProches([lieu('King Falafel Palace', 48.8571, 2.3596)], marais)[0].detail).toMatch(/^à \d+ m · Paris$/)
  })
})
