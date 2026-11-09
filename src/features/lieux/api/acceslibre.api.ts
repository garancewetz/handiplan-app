import { ACTIVITES, COLONNES_ACCESLIBRE, decrireAcceslibre, nomPropre, typeAcceslibre, type LigneAcceslibre } from '~/features/lieux/utils/description-acceslibre.utils'
import type { Lieu, Point } from '~/types/lieu.types'
import { RAYON_RECHERCHE } from '~/constants/recherche.constants'
import { distanceMetres } from '~/utils/distance.utils'
import { chargerParQuartiers, type Rectangle } from '~/features/lieux/api/quartiers.api'

// Fichier national Acceslibre (data.gouv.fr, Licence Ouverte), interrogé via l'API tabulaire : sans clé.
const RESSOURCE = '93ae96a7-1db7-4cb4-a9f1-6d778370b640'
const API = `https://tabular-api.data.gouv.fr/api/resources/${RESSOURCE}/data/`

const alleger = (l: LigneAcceslibre) => Object.fromEntries(COLONNES_ACCESLIBRE.map(c => [c, l[c as keyof LigneAcceslibre] ?? null])) as LigneAcceslibre

// Tous les cafés, restaurants et toilettes publiques, filtrés par le serveur. Avant, seulement ceux qui
// ont des toilettes adaptées ou des marches : on perdait près de la moitié des « entrée sans marche »
// (docs/decisions/donnees, D11). Les noms contiennent des virgules : entre guillemets.
const FILTRE = { activite__in: Object.keys(ACTIVITES).map(a => `"${a}"`).join(',') }
// 200 lignes par page au plus : quelques pages suffisent pour un quartier, même dense.
const TAILLE_PAGE = 200
const PAGES_MAX = 5

async function page(zone: Record<string, string>, numero: number) {
  const url = `${API}?${new URLSearchParams({ ...zone, ...FILTRE, page_size: String(TAILLE_PAGE), page: String(numero) })}`
  // data.gouv répond d'habitude en 3 s, mais parfois en 20 s ou plus : on lui laisse le temps.
  const reponse = await fetch(url, { signal: AbortSignal.timeout(40000) })
  if (!reponse.ok) throw new Error(`Acceslibre ${reponse.status}`)
  return reponse.json() as Promise<{ data: LigneAcceslibre[]; meta?: { total?: number } }>
}

/** Les lignes Acceslibre d'un rectangle : la première page dit combien il y en a, les suivantes arrivent ensemble. */
async function interroger([sud, ouest, nord, est]: Rectangle): Promise<LigneAcceslibre[]> {
  const zone = { latitude__greater: String(sud), latitude__less: String(nord), longitude__greater: String(ouest), longitude__less: String(est) }
  const premiere = await page(zone, 1)
  const pages = Math.min(PAGES_MAX, Math.ceil((premiere.meta?.total ?? 0) / TAILLE_PAGE))
  const suivantes = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, i) => page(zone, i + 2)))
  // Seules les colonnes lues par l'appli sont gardées : une ligne en compte plus de 100.
  const lignes = [premiere, ...suivantes].flatMap(p => p.data.map(alleger))
  return [...new Map(lignes.map(l => [l.id, l])).values()]
}

async function lignesAutour(centre: Point): Promise<LigneAcceslibre[]> {
  // Les quartiers gardés sur le téléphone, puis le direct pour les manquants (docs/decisions/carte, D6).
  return chargerParQuartiers({
    // q2 : toutes les activités et l'adresse ; les quartiers gardés en q1 n'avaient qu'une partie des lieux.
    jeu: 'acceslibre-q2',
    centre,
    rayon: RAYON_RECHERCHE,
    charger: interroger,
    position: l => (l.latitude !== null && l.longitude !== null ? { lat: l.latitude, lon: l.longitude } : null),
  })
}

/** Les cafés, restaurants et toilettes publiques d'Acceslibre autour d'un point. */
export async function chargerAcceslibre(centre: Point): Promise<Lieu[]> {
  const lignes = await lignesAutour(centre)

  const lieux: Lieu[] = []
  for (const r of lignes) {
    const type = typeAcceslibre(r.activite)
    if (!type || r.latitude === null || r.longitude === null) continue
    const point = { lat: r.latitude, lon: r.longitude }
    const metres = Math.round(distanceMetres(centre, point))
    if (metres > RAYON_RECHERCHE) continue
    const { etat, lignes: description, acces } = decrireAcceslibre(r)
    const libelle = r.activite!.split(',')[0]
    lieux.push({
      id: `acceslibre/${r.id}`,
      type, etat, libelle, metres, ...point,
      nom: nomPropre(r.name) ?? libelle,
      lignes: description,
      // Seulement si les toilettes sont adaptées : sinon, le conseil enverrait vers des toilettes inutilisables.
      conseil: etat === 'ok' && (type === 'cafe' || type === 'resto') ? 'Toilettes pour les clients : demandez au comptoir.' : undefined,
      sources: ['Acceslibre'],
      lienAcceslibre: r.web_url ?? undefined,
      acces,
      ...(r.numero && r.voie ? { adresse: { numero: r.numero, rue: r.voie } } : {}),
    })
  }
  return lieux
}
