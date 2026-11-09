// Les quartiers déjà chargés, gardés dans la base du navigateur (IndexedDB) : bien plus de place que
// localStorage (environ 5 Mo), qu'un seul quartier dense d'Acceslibre suffisait à remplir.
const BASE = 'handiplan'
// Les noms de la base et du magasin ne changent jamais : les quartiers gardés sur le téléphone y sont.
const STORE = 'quartiers'
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
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return base
}

const done = (tx: IDBTransaction) => new Promise<void>((resolve, reject) => {
  tx.oncomplete = () => resolve()
  tx.onerror = () => reject(tx.error)
})

/** Le stockage du téléphone, ou `null` s'il n'y en a pas (navigation privée stricte) : on charge alors à chaque fois. */
export const browserStorage: Storage | null = typeof indexedDB === 'undefined' ? null : {
  async read(keys) {
    const tx = (await open()).transaction(STORE)
    const store = tx.objectStore(STORE)
    const kept = new Map<string, Kept>()
    for (const key of keys) {
      const request = store.get(key)
      request.onsuccess = () => {
        const g = request.result as Kept | undefined
        if (g && Date.now() - g.date < DURATION) kept.set(key, g)
      }
    }
    await done(tx)
    return kept
  },
  async write(entries) {
    const tx = (await open()).transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    for (const [key, kept] of entries) store.put(kept, key)
    await done(tx)
  },
}
