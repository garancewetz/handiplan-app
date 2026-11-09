import { describe, expect, it } from 'vitest'
import { nearbyPlaces, type PhotonPlace } from '~/features/itinerary/api/address.api'

const marais = { lat: 48.857, lon: 2.358 }
const place = (name: string, lat: number, lon: number, osm_key = 'amenity', city = 'Paris', osm_value?: string): PhotonPlace =>
  ({ geometry: { coordinates: [lon, lat] }, properties: { name, osm_key, osm_value, city } })

describe('lieuxProches', () => {
  it('met le lieu du même nom le plus proche en premier, et écarte ceux d’autres villes', () => {
    const results = [
      place('King Falafel', 52.07, 4.30, 'amenity', 'La Haye'),
      place('King Falafel Palace Bis', 48.87, 2.36),
      place('King Falafel Palace', 48.8571, 2.3596),
    ]
    expect(nearbyPlaces(results, marais).map(s => s.title)).toEqual(['King Falafel Palace', 'King Falafel Palace Bis'])
  })

  it('fait passer le nom tapé avant un nom approchant plus proche', () => {
    const results = [place('Amulette', 48.86, 2.36), place('L’Amourette', 48.853, 2.4235, 'amenity', 'Montreuil')]
    expect(nearbyPlaces(results, marais, 'amourette').map(s => s.title)).toEqual(['L’Amourette', 'Amulette'])
  })

  it('trouve tous les lieux où l’on va : gare, hôpital, centre de santé, mairie', () => {
    const results = [
      place('Gare de Lyon', 48.8443, 2.3744, 'railway'),
      place('Hôpital Saint-Antoine', 48.849, 2.384, 'amenity'),
      place('Centre de santé Richerand', 48.871, 2.364, 'healthcare'),
    ]
    expect(nearbyPlaces(results, marais)).toHaveLength(3)
  })

  it('fait passer le nom exact avant un nom plus long, malgré accents et traits d’union', () => {
    const results = [place('CeGIDD - Hôpital Saint Antoine - Paris', 48.849, 2.384), place('Hôpital Saint-Antoine', 48.849, 2.384)]
    expect(nearbyPlaces(results, marais, 'hopital saint antoine').map(s => s.title)).toEqual(['Hôpital Saint-Antoine', 'CeGIDD - Hôpital Saint Antoine - Paris'])
  })

  it('écarte les points qui portent seulement le nom (taxi, bouche de métro) et les doublons', () => {
    const results = [
      place('Gare de Lyon', 48.8443, 2.3744, 'railway', 'Paris', 'station'),
      place('Gare de Lyon', 48.8445, 2.3740, 'building', 'Paris', 'train_station'),
      place('Hôpital Saint-Antoine', 48.849, 2.384, 'amenity', 'Paris', 'taxi'),
      place('Mairie du 11e', 48.857, 2.379, 'railway', 'Paris', 'subway_entrance'),
    ]
    expect(nearbyPlaces(results, marais).map(s => s.title)).toEqual(['Gare de Lyon'])
  })

  it('ignore les rues et les villes du même nom', () => {
    expect(nearbyPlaces([place('Rue du Roi', 48.857, 2.358, 'highway'), place('Lyon', 45.76, 4.83, 'place')], marais)).toEqual([])
  })

  it('dit à quelle distance est le lieu', () => {
    expect(nearbyPlaces([place('King Falafel Palace', 48.8571, 2.3596)], marais)[0].detail).toMatch(/^à \d+ m · Paris$/)
  })
})
