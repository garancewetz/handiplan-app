import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chargerParQuartiers } from '~/features/lieux/api/quartiers.api'
import type { Garde, Stockage } from '~/features/lieux/api/stockage-quartiers.api'
import { cleZone } from '~/features/lieux/utils/zones.utils'

// Un localStorage en mémoire, pour le ménage de l'ancienne forme : les tests tournent sans navigateur.
const ancien = new Map<string, string>()
vi.stubGlobal('localStorage', {
  get length() { return ancien.size },
  key: (i: number) => [...ancien.keys()][i] ?? null,
  removeItem: (k: string) => { ancien.delete(k) },
})

// Le stockage des quartiers, en mémoire.
const gardes = new Map<string, Garde>()
const stockage: Stockage = {
  lire: async cles => new Map(cles.filter(c => gardes.has(c)).map(c => [c, gardes.get(c)!])),
  ecrire: async entrees => { entrees.forEach(([c, g]) => gardes.set(c, g)) },
}

type Point = { lat: number; lon: number }
const centre = { lat: 48.85625, lon: 2.35625 } // au milieu d'un quartier
const position = (p: Point) => p
const options = (charger: () => Promise<Point[]>) => ({ jeu: 'essai', centre, rayon: 50, charger, position, stockage })

describe('chargerParQuartiers', () => {
  beforeEach(() => gardes.clear())

  // Le ménage ne se fait qu'une fois par ouverture de l'appli : ce test passe en premier.
  it('oublie l’ancienne forme gardée dans localStorage', async () => {
    ancien.set('osm-v4:48.855,2.355', '{}')
    ancien.set('appli-gps', 'waze')
    await chargerParQuartiers(options(async () => []))
    expect([...ancien.keys()]).toEqual(['appli-gps'])
  })

  it('charge une fois, puis sert le quartier gardé sans redemander', async () => {
    const charger = vi.fn(async () => [{ lat: 48.8562, lon: 2.3562 }])
    expect(await chargerParQuartiers(options(charger))).toHaveLength(1)
    expect(await chargerParQuartiers({ ...options(charger), centre: { lat: 48.8563, lon: 2.3563 } })).toHaveLength(1)
    expect(charger).toHaveBeenCalledTimes(1)
  })

  it('sert un quartier gardé depuis plus d’un jour, et le remet à jour en arrière-plan', async () => {
    const cle = `essai:${cleZone(centre.lat, centre.lon)}`
    gardes.set(cle, { date: Date.now() - 2 * 24 * 3600 * 1000, donnees: [{ lat: 48.8562, lon: 2.3562 }] })
    const charger = vi.fn(async () => [{ lat: 48.8562, lon: 2.3562 }, { lat: 48.8563, lon: 2.3563 }])
    expect(await chargerParQuartiers(options(charger))).toHaveLength(1)
    await vi.waitFor(() => expect(gardes.get(cle)?.donnees).toHaveLength(2))
  })

  it('donne quand même les lieux si le téléphone ne peut pas les garder', async () => {
    const plein: Stockage = { lire: async () => new Map(), ecrire: async () => { throw new Error('plein') } }
    expect(await chargerParQuartiers({ ...options(async () => [{ lat: 48.8562, lon: 2.3562 }]), stockage: plein })).toHaveLength(1)
  })
})
