import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadByArea } from '~/features/places/api/areas.api'
import type { Kept, Storage } from '~/features/places/api/area-storage.api'
import { areaKey, areasAround } from '~/features/places/utils/zones.utils'

// Un localStorage en mémoire, pour le ménage de l'ancienne forme : les tests tournent sans navigateur.
const old = new Map<string, string>()
vi.stubGlobal('localStorage', {
  get length() { return old.size },
  key: (i: number) => [...old.keys()][i] ?? null,
  removeItem: (k: string) => { old.delete(k) },
})

// Le stockage des quartiers, en mémoire.
const kept = new Map<string, Kept>()
const storage: Storage = {
  read: async keys => new Map(keys.filter(c => kept.has(c)).map(c => [c, kept.get(c)!])),
  write: async entries => { entries.forEach(([c, g]) => kept.set(c, g)) },
}

type Point = { lat: number; lon: number }
const center = { lat: 48.85625, lon: 2.35625 } // au milieu d'un quartier
const position = (p: Point) => p
const options = (load: () => Promise<Point[]>) => ({ dataset: 'essai', center, radius: 50, load, position, storage })

describe('loadByArea', () => {
  beforeEach(() => kept.clear())

  // Le ménage ne se fait qu'une fois par ouverture de l'appli : ce test passe en premier.
  it('oublie l’ancienne forme gardée dans localStorage', async () => {
    old.set('osm-v4:48.855,2.355', '{}')
    old.set('appli-gps', 'waze')
    await loadByArea(options(async () => []))
    expect([...old.keys()]).toEqual(['appli-gps'])
  })

  it('charge une fois, puis sert le quartier gardé sans redemander', async () => {
    const load = vi.fn(async () => [{ lat: 48.8562, lon: 2.3562 }])
    expect(await loadByArea(options(load))).toHaveLength(1)
    expect(await loadByArea({ ...options(load), center: { lat: 48.8563, lon: 2.3563 } })).toHaveLength(1)
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('sert un quartier gardé depuis plus d’un jour, et le remet à jour en arrière-plan', async () => {
    const key = `essai:${areaKey(center.lat, center.lon)}`
    kept.set(key, { date: Date.now() - 2 * 24 * 3600 * 1000, data: [{ lat: 48.8562, lon: 2.3562 }] })
    const load = vi.fn(async () => [{ lat: 48.8562, lon: 2.3562 }, { lat: 48.8563, lon: 2.3563 }])
    expect(await loadByArea(options(load))).toHaveLength(1)
    await vi.waitFor(() => expect(kept.get(key)?.data).toHaveLength(2))
  })

  it('ne donne pas deux fois un lieu d’un quartier gardé que le rectangle chargé recouvre', async () => {
    const around = { ...options(async () => []), radius: 300 }
    const keys = areasAround(center, around.radius)
    const cafe = { lat: 48.8562, lon: 2.3562 }
    // Tous les quartiers sont gardés, sauf un ; celui du café est gardé, et le rectangle le recouvre.
    for (const c of keys.slice(1)) kept.set(`essai:${c}`, { date: Date.now(), data: c === areaKey(cafe.lat, cafe.lon) ? [cafe] : [] })
    const places = await loadByArea({ ...around, load: async () => [cafe] })
    expect(places).toEqual([cafe])
  })

  it('donne quand même les lieux si le téléphone ne peut pas les garder', async () => {
    const full: Storage = { read: async () => new Map(), write: async () => { throw new Error('plein') } }
    expect(await loadByArea({ ...options(async () => [{ lat: 48.8562, lon: 2.3562 }]), storage: full })).toHaveLength(1)
  })
})
