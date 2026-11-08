// Les quartiers déjà chargés, gardés dans la base du navigateur (IndexedDB) : bien plus de place que
// localStorage (environ 5 Mo), qu'un seul quartier dense d'Acceslibre suffisait à remplir.
const BASE = 'handiplan'
const MAGASIN = 'quartiers'
// Au-delà, un quartier est oublié : les lieux changent, on le rechargera.
const DUREE = 7 * 24 * 3600 * 1000

export type Garde = { date: number; donnees: unknown[] }

export type Stockage = {
  lire: (cles: string[]) => Promise<Map<string, Garde>>
  ecrire: (entrees: [string, Garde][]) => Promise<void>
}

let base: Promise<IDBDatabase> | undefined

function ouvrir() {
  base ??= new Promise((resolve, reject) => {
    const demande = indexedDB.open(BASE, 1)
    demande.onupgradeneeded = () => demande.result.createObjectStore(MAGASIN)
    demande.onsuccess = () => resolve(demande.result)
    demande.onerror = () => reject(demande.error)
  })
  return base
}

const fini = (t: IDBTransaction) => new Promise<void>((resolve, reject) => {
  t.oncomplete = () => resolve()
  t.onerror = () => reject(t.error)
})

/** Le stockage du téléphone, ou `null` s'il n'y en a pas (navigation privée stricte) : on charge alors à chaque fois. */
export const stockageNavigateur: Stockage | null = typeof indexedDB === 'undefined' ? null : {
  async lire(cles) {
    const t = (await ouvrir()).transaction(MAGASIN)
    const magasin = t.objectStore(MAGASIN)
    const gardes = new Map<string, Garde>()
    for (const cle of cles) {
      const demande = magasin.get(cle)
      demande.onsuccess = () => {
        const g = demande.result as Garde | undefined
        if (g && Date.now() - g.date < DUREE) gardes.set(cle, g)
      }
    }
    await fini(t)
    return gardes
  },
  async ecrire(entrees) {
    const t = (await ouvrir()).transaction(MAGASIN, 'readwrite')
    const magasin = t.objectStore(MAGASIN)
    for (const [cle, garde] of entrees) magasin.put(garde, cle)
    await fini(t)
  },
}
