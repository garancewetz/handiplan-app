// Les quartiers déjà chargés, gardés dans la base du navigateur (IndexedDB) : bien plus de place que
// localStorage (environ 5 Mo), qu'un seul quartier dense d'Acceslibre suffisait à remplir.
const BASE = 'handiplan'
const SHOP = 'quartiers'
// Au-delà, un quartier est oublié : les lieux changent, on le rechargera.
const DURATION = 7 * 24 * 3600 * 1000

export type Kept = { date: number; data: unknown[] }

export type Storage = {
  read: (keys: string[]) => Promise<Map<string, Kept>>
  write: (entries: [string, Kept][]) => Promise<void>
}

let base: Promise<IDBDatabase> | undefined

function open() {
  base ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(BASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(SHOP)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return base
}

const done = (t: IDBTransaction) => new Promise<void>((resolve, reject) => {
  t.oncomplete = () => resolve()
  t.onerror = () => reject(t.error)
})

/** Le stockage du téléphone, ou `null` s'il n'y en a pas (navigation privée stricte) : on charge alors à chaque fois. */
export const browserStorage: Storage | null = typeof indexedDB === 'undefined' ? null : {
  async read(keys) {
    const t = (await open()).transaction(SHOP)
    const shop = t.objectStore(SHOP)
    const keptOnes = new Map<string, Kept>()
    for (const key of keys) {
      const request = shop.get(key)
      request.onsuccess = () => {
        const g = request.result as Kept | undefined
        if (g && Date.now() - g.date < DURATION) keptOnes.set(key, g)
      }
    }
    await done(t)
    return keptOnes
  },
  async write(entries) {
    const t = (await open()).transaction(SHOP, 'readwrite')
    const shop = t.objectStore(SHOP)
    for (const [key, kept] of entries) shop.put(kept, key)
    await done(t)
  },
}
