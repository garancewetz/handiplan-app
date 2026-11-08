import { API_ECRITURE, API_LECTURE, SERVEUR_DE_TEST } from '~/features/contribution/constants/osm.constants'
import { xmlNouveauPoint, xmlGroupe, xmlModification, type ElementOsm } from '~/features/contribution/utils/osmchange.utils'
import type { Point } from '~/types/lieu.types'

/** Le lieu tel qu'il est sur la vraie carte (lecture seule) : ses étiquettes et sa version actuelles. */
export async function lireElement(id: string): Promise<ElementOsm> {
  const reponse = await fetch(`${API_LECTURE}/${id}.json`)
  if (!reponse.ok) throw new Error(`Lieu OSM ${reponse.status}`)
  const json = (await reponse.json()) as { elements?: ElementOsm[] }
  const element = json.elements?.[0]
  if (!element) throw new Error('Lieu OSM introuvable')
  return { ...element, tags: element.tags ?? {} }
}

async function appeler(cle: string, chemin: string, methode: 'PUT' | 'POST', corps?: string) {
  const reponse = await fetch(`${API_ECRITURE}${chemin}`, {
    method: methode,
    headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'text/xml' },
    body: corps,
  })
  if (!reponse.ok) throw new Error(`OSM ${reponse.status} : ${(await reponse.text()).slice(0, 200)}`)
  return reponse.text()
}

/**
 * Envoie les nouvelles étiquettes d'un lieu : un groupe de modifications par lieu, ouvert, rempli,
 * puis fermé tout de suite. Sur le serveur de test, une copie du lieu est créée à sa place.
 */
export async function envoyer(cle: string, element: ElementOsm, point: Point, etiquettes: Record<string, string>, commentaire: string) {
  // Les réponses aux questions décrivent ce qu'on voit sur place.
  const groupe = Number(await appeler(cle, '/changeset/create', 'PUT', xmlGroupe(commentaire, true)))
  try {
    const changement = SERVEUR_DE_TEST ? xmlNouveauPoint(point, groupe, etiquettes) : xmlModification(element, groupe, etiquettes)
    await appeler(cle, `/changeset/${groupe}/upload`, 'POST', changement)
  } finally {
    // Même en cas d'échec, on ne laisse pas un groupe ouvert sur la carte.
    await appeler(cle, `/changeset/${groupe}/close`, 'PUT').catch(() => {})
  }
  return groupe
}

/** Ajoute un point neuf (une place handicapée), dans son propre groupe de modifications. */
export async function ajouterPoint(cle: string, point: Point, etiquettes: Record<string, string>, commentaire: string) {
  // Une place peut se placer sur la carte de chez soi : on ne prétend pas l'avoir vue.
  const groupe = Number(await appeler(cle, '/changeset/create', 'PUT', xmlGroupe(commentaire, false)))
  try {
    await appeler(cle, `/changeset/${groupe}/upload`, 'POST', xmlNouveauPoint(point, groupe, etiquettes))
  } finally {
    await appeler(cle, `/changeset/${groupe}/close`, 'PUT').catch(() => {})
  }
  return groupe
}
