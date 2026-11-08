import { COLONNES_ACCESLIBRE, decrireAcceslibre, nomPropre, typeAcceslibre, type LigneAcceslibre } from '~/features/lieux/utils/description-acceslibre.utils'
import type { Lieu, Point } from '~/types/lieu.types'
import { RAYON_RECHERCHE } from '~/constants/recherche.constants'
import { distanceMetres } from '~/utils/distance.utils'
import { chargerParQuartiers, type Rectangle } from '~/features/lieux/api/quartiers.api'

// Fichier national Acceslibre (data.gouv.fr, Licence Ouverte), interrogé via l'API tabulaire : sans clé.
const RESSOURCE = '93ae96a7-1db7-4cb4-a9f1-6d778370b640'
const API = `https://tabular-api.data.gouv.fr/api/resources/${RESSOURCE}/data/`

const alleger = (l: LigneAcceslibre) => Object.fromEntries(COLONNES_ACCESLIBRE.map(c => [c, l[c as keyof LigneAcceslibre] ?? null])) as LigneAcceslibre

// Les deux listes utiles : les lieux qui ont des toilettes adaptées, et ceux dont l'entrée a des marches.
const FILTRES: Record<string, string>[] = [{ sanitaires_adaptes__exact: 'true' }, { entree_plain_pied__exact: 'false' }]
// 200 lignes par page au plus : quelques pages suffisent pour un quartier, même dense.
const PAGES_MAX = 5

/** Les lignes Acceslibre d'un rectangle, toutes pages comprises. */
async function interroger([sud, ouest, nord, est]: Rectangle): Promise<LigneAcceslibre[]> {
  const zone = { latitude__greater: String(sud), latitude__less: String(nord), longitude__greater: String(ouest), longitude__less: String(est), page_size: '200' }
  const listes = await Promise.all(FILTRES.map(async filtre => {
    const lignes: LigneAcceslibre[] = []
    let url: string | null = `${API}?${new URLSearchParams({ ...zone, ...filtre })}`
    for (let page = 0; url && page < PAGES_MAX; page++) {
      // data.gouv répond d'habitude en 3 s, mais parfois en 20 s ou plus : on lui laisse le temps.
      const reponse = await fetch(url, { signal: AbortSignal.timeout(40000) })
      if (!reponse.ok) throw new Error(`Acceslibre ${reponse.status}`)
      const json = await reponse.json() as { data: LigneAcceslibre[]; links?: { next?: string | null } }
      // Seules les colonnes lues par l'appli sont gardées : une ligne en compte plus de 100.
      lignes.push(...json.data.map(alleger))
      url = json.links?.next ?? null
    }
    return lignes
  }))
  return [...new Map(listes.flat().map(l => [l.id, l])).values()]
}

async function lignesAutour(centre: Point): Promise<LigneAcceslibre[]> {
  // Les quartiers gardés sur le téléphone, puis le direct pour les manquants (docs/decisions/carte, D6).
  return chargerParQuartiers({
    jeu: 'acceslibre-q1',
    centre,
    rayon: RAYON_RECHERCHE,
    charger: interroger,
    position: l => (l.latitude !== null && l.longitude !== null ? { lat: l.latitude, lon: l.longitude } : null),
  })
}

/** Lieux Acceslibre autour d'un point : ceux qui ont des toilettes adaptées, et ceux dont l'entrée a des marches. */
export async function chargerAcceslibre(centre: Point): Promise<Lieu[]> {
  const lignes = await lignesAutour(centre)

  const lieux: Lieu[] = []
  for (const r of lignes) {
    const type = typeAcceslibre(r.activite)
    if (!type || r.latitude === null || r.longitude === null) continue
    const point = { lat: r.latitude, lon: r.longitude }
    const metres = Math.round(distanceMetres(centre, point))
    if (metres > RAYON_RECHERCHE) continue
    const { etat, lignes: description } = decrireAcceslibre(r)
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
    })
  }
  return lieux
}
