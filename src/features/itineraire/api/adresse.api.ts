import type { Arrivee, Point } from '~/types/lieu.types'
import { distanceMetres } from '~/utils/distance.utils'
import { formaterDistance } from '~/utils/format.utils'

// Géocodeur officiel français (Base Adresse Nationale et lieux de l'IGN, via la Géoplateforme).
const GEOCODEUR = 'https://data.geopf.fr/geocodage/search'
const GEOCODEUR_INVERSE = 'https://data.geopf.fr/geocodage/reverse'
// L'IGN ne connaît pas les cafés ni les restaurants. Photon cherche par nom dans OpenStreetMap,
// les plus proches d'abord.
const LIEUX_OSM = 'https://photon.komoot.io/api/'
// Au-delà, un lieu du même nom est sans doute dans une autre ville.
const RAYON_LIEUX_M = 20000
const GENRES_LIEUX = new Set(['amenity', 'shop', 'tourism', 'leisure'])

export type Suggestion = Arrivee & {
  /** ligne principale, en gros */
  titre: string
  /** ligne secondaire : ville, type de lieu… */
  detail?: string
}

type Resultat = {
  geometry: { coordinates: [number, number] }
  properties: {
    _type: 'address' | 'poi'
    label?: string
    name?: string | string[]
    city?: string | string[]
    postcode?: string | string[]
    category?: string[]
  }
}

const premier = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

function versSuggestion({ geometry, properties: p }: Resultat): Suggestion {
  const [lon, lat] = geometry.coordinates
  if (p._type === 'address') {
    // « 12 Rue Carnot 93230 Romainville » : la rue en gros, la ville dessous.
    const libelle = p.label ?? ''
    const coupure = libelle.search(/ \d{5} /)
    return coupure > 0
      ? { lat, lon, adresse: libelle, titre: libelle.slice(0, coupure), detail: libelle.slice(coupure + 1) }
      : { lat, lon, adresse: libelle, titre: libelle }
  }
  const nom = premier(p.name) ?? ''
  const ville = premier(p.city)
  return {
    lat, lon,
    adresse: ville ? `${nom}, ${ville}` : nom,
    titre: nom,
    detail: [ville, p.category?.[0]].filter(Boolean).join(' · ') || undefined,
  }
}

async function interroger(texte: string, index: 'address' | 'poi', limite: number, proche: Point | null, signal?: AbortSignal) {
  const params = new URLSearchParams({ q: texte, index, limit: String(limite), autocomplete: '1' })
  // Les résultats proches passent en premier : « rue Carnot » donne d'abord celle du quartier.
  if (proche) { params.set('lat', String(proche.lat)); params.set('lon', String(proche.lon)) }
  const reponse = await fetch(`${GEOCODEUR}?${params}`, { signal })
  if (!reponse.ok) throw new Error(`Géocodeur ${reponse.status}`)
  const resultats: Resultat[] = (await reponse.json()).features ?? []
  return resultats.map(versSuggestion)
}

export type LieuPhoton = {
  geometry: { coordinates: [number, number] }
  properties: { name?: string; osm_key?: string; city?: string; street?: string }
}

/** Cafés, restaurants, magasins… d'OpenStreetMap dont le nom correspond, du plus proche au plus loin. */
async function lieuxParNom(texte: string, proche: Point | null, signal?: AbortSignal): Promise<Suggestion[]> {
  // Sans filtre, les rues et les villes du même nom prennent toute la place : on ne demande que des lieux.
  const params = new URLSearchParams({ q: texte, limit: '15', lang: 'fr' })
  for (const genre of GENRES_LIEUX) params.append('osm_tag', genre)
  if (proche) { params.set('lat', String(proche.lat)); params.set('lon', String(proche.lon)) }
  const reponse = await fetch(`${LIEUX_OSM}?${params}`, { signal })
  if (!reponse.ok) throw new Error(`Photon ${reponse.status}`)
  return lieuxProches((await reponse.json()).features ?? [], proche, texte)
}

const simplifier = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/**
 * Garde les vrais lieux (pas les rues ni les villes) à moins de 20 km. D'abord ceux dont le nom
 * contient ce qu'on a tapé, puis les noms approchants (Photon tolère les fautes) ; chaque groupe du
 * plus proche au plus loin.
 */
export function lieuxProches(resultats: LieuPhoton[], proche: Point | null, texte = ''): Suggestion[] {
  const tape = simplifier(texte.trim())
  const exact = (nom: string) => (tape && simplifier(nom).includes(tape) ? 0 : 1)
  return resultats
    .filter(r => r.properties.name && GENRES_LIEUX.has(r.properties.osm_key ?? ''))
    .map(r => {
      const [lon, lat] = r.geometry.coordinates
      return { r, lat, lon, metres: proche ? distanceMetres(proche, { lat, lon }) : null }
    })
    .filter(({ metres }) => metres === null || metres <= RAYON_LIEUX_M)
    .sort((a, b) => exact(a.r.properties.name!) - exact(b.r.properties.name!) || (a.metres ?? 0) - (b.metres ?? 0))
    .slice(0, 3)
    .map(({ r, lat, lon, metres }) => {
      const nom = r.properties.name!
      const ville = r.properties.city
      return {
        lat, lon,
        adresse: ville ? `${nom}, ${ville}` : nom,
        titre: nom,
        detail: [metres !== null ? `à ${formaterDistance(metres)}` : null, r.properties.street, ville].filter(Boolean).join(' · ') || undefined,
      }
    })
}

/** Les lieux du même nom tout proches, puis les adresses, puis les lieux connus de l'IGN (gares, mairies…). */
export async function suggerer(texte: string, proche: Point | null, signal?: AbortSignal): Promise<Suggestion[]> {
  const [lieuxOsm, adresses, lieux] = await Promise.all([
    lieuxParNom(texte, proche, signal).catch(() => []),
    interroger(texte, 'address', 4, proche, signal),
    interroger(texte, 'poi', 3, proche, signal).catch(() => []),
  ])
  const pasTropLoin = (s: Suggestion) => !proche || distanceMetres(proche, s) <= RAYON_LIEUX_M
  const vus = new Set<string>()
  // Des lieux trouvés par leur nom : les lieux publics de l'IGN ne seraient que du bruit
  // (« king falafel » donnait « Résidence Universitaire Martin Luther King »).
  const publics = lieuxOsm.length > 0 ? [] : lieux.filter(pasTropLoin)
  return [...lieuxOsm, ...adresses, ...publics].filter(s => !vus.has(s.adresse) && vus.add(s.adresse))
}

export async function chercherAdresse(texte: string, proche: Point | null = null): Promise<Arrivee | null> {
  return (await suggerer(texte, proche))[0] ?? null
}

/** L'adresse la plus proche d'un point (« 1 Rue de la République 93100 Montreuil »), pour vérifier où l'on est. */
export async function adresseProche(point: Point, signal?: AbortSignal): Promise<string | null> {
  const params = new URLSearchParams({ lat: String(point.lat), lon: String(point.lon), index: 'address', limit: '1' })
  const reponse = await fetch(`${GEOCODEUR_INVERSE}?${params}`, { signal })
  if (!reponse.ok) throw new Error(`Géocodeur ${reponse.status}`)
  const [resultat]: Resultat[] = (await reponse.json()).features ?? []
  return resultat?.properties.label ?? null
}
