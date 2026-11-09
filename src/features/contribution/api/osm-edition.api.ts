import { WRITE_API, READ_API, TEST_SERVER } from '~/features/contribution/constants/osm.constants'
import { createNodeXml, changesetXml, modifyXml, type OsmElement } from '~/features/contribution/utils/osmchange.utils'
import type { Point } from '~/types/place.types'

/** Le lieu tel qu'il est sur la vraie carte (lecture seule) : ses étiquettes et sa version actuelles. */
export async function readElement(id: string): Promise<OsmElement> {
  const answer = await fetch(`${READ_API}/${id}.json`)
  if (!answer.ok) throw new Error(`Lieu OSM ${answer.status}`)
  const json = (await answer.json()) as { elements?: OsmElement[] }
  const element = json.elements?.[0]
  if (!element) throw new Error('Lieu OSM introuvable')
  return { ...element, tags: element.tags ?? {} }
}

async function call(key: string, path: string, httpMethod: 'PUT' | 'POST', content?: string) {
  const answer = await fetch(`${WRITE_API}${path}`, {
    method: httpMethod,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'text/xml' },
    body: content,
  })
  if (!answer.ok) throw new Error(`OSM ${answer.status} : ${(await answer.text()).slice(0, 200)}`)
  return answer.text()
}

/**
 * Envoie les nouvelles étiquettes d'un lieu : un groupe de modifications par lieu, ouvert, rempli,
 * puis fermé tout de suite. Sur le serveur de test, une copie du lieu est créée à sa place.
 */
export async function send(key: string, element: OsmElement, point: Point, osmTags: Record<string, string>, changesetComment: string) {
  // Les réponses aux questions décrivent ce qu'on voit sur place.
  const group = Number(await call(key, '/changeset/create', 'PUT', changesetXml(changesetComment, true)))
  try {
    const change = TEST_SERVER ? createNodeXml(point, group, osmTags) : modifyXml(element, group, osmTags)
    await call(key, `/changeset/${group}/upload`, 'POST', change)
  } finally {
    // Même en cas d'échec, on ne laisse pas un groupe ouvert sur la carte.
    await call(key, `/changeset/${group}/close`, 'PUT').catch(() => {})
  }
  return group
}

/** Ajoute un point neuf (une place handicapée), dans son propre groupe de modifications. */
export async function addPoint(key: string, point: Point, osmTags: Record<string, string>, changesetComment: string) {
  // Une place peut se placer sur la carte de chez soi : on ne prétend pas l'avoir vue.
  const group = Number(await call(key, '/changeset/create', 'PUT', changesetXml(changesetComment, false)))
  try {
    await call(key, `/changeset/${group}/upload`, 'POST', createNodeXml(point, group, osmTags))
  } finally {
    await call(key, `/changeset/${group}/close`, 'PUT').catch(() => {})
  }
  return group
}
