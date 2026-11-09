import { CREATED_BY } from '~/features/contribution/constants/osm.constants'

// Les messages XML de l'API d'OpenStreetMap (0.6) : ouvrir un groupe de modifications, puis y
// déposer le lieu modifié. Fonctions pures, testées : l'envoi lui-même est dans osm-edition.api.ts.

type Member = { type: 'node' | 'way' | 'relation'; ref: number; role: string }

/** Un objet OSM tel que l'API le renvoie en JSON. */
export type OsmElement = {
  type: 'node' | 'way' | 'relation'
  id: number
  version: number
  lat?: number
  lon?: number
  nodes?: number[]
  members?: Member[]
  tags: Record<string, string>
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const tagsXml = (osmTags: Record<string, string>) =>
  Object.entries(osmTags).map(([k, v]) => `<tag k="${escape(k)}" v="${escape(v)}"/>`).join('')

/**
 * Le groupe de modifications : commentaire clair, appli et #handiplan, pour que la communauté suive.
 * `surPlace` : la personne répond à ce qu'elle voit (`source=survey`, comme StreetComplete).
 */
export function changesetXml(changesetComment: string, onSite: boolean): string {
  const osmTags = { comment: changesetComment, created_by: CREATED_BY, hashtags: '#handiplan', ...(onSite ? { source: 'survey' } : {}) }
  return `<osm><changeset>${tagsXml(osmTags)}</changeset></osm>`
}

/**
 * Le lieu modifié (osmChange « modify ») : l'objet entier, avec sa version (OSM refuse une
 * modification faite sur une version dépassée) et ses nouvelles étiquettes. Un chemin garde ses
 * nœuds, une relation ses membres : seules les étiquettes changent.
 */
export function modifyXml(element: OsmElement, group: number, osmTags: Record<string, string>): string {
  const attributes = `id="${element.id}" version="${element.version}" changeset="${group}"`
  const tags = tagsXml(osmTags)
  const content =
    element.type === 'node'
      ? `<node ${attributes} lat="${element.lat}" lon="${element.lon}">${tags}</node>`
      : element.type === 'way'
        ? `<way ${attributes}>${(element.nodes ?? []).map(n => `<nd ref="${n}"/>`).join('')}${tags}</way>`
        : `<relation ${attributes}>${(element.members ?? []).map(m => `<member type="${m.type}" ref="${m.ref}" role="${escape(m.role)}"/>`).join('')}${tags}</relation>`
  return `<osmChange version="0.6" generator="${CREATED_BY}"><modify>${content}</modify></osmChange>`
}

/**
 * Un point neuf : une place handicapée ajoutée, ou, sur le serveur de test (où les lieux de la vraie
 * carte n'existent pas), une copie du lieu avec les nouvelles étiquettes.
 */
export function createNodeXml(point: { lat: number; lon: number }, group: number, osmTags: Record<string, string>): string {
  return `<osmChange version="0.6" generator="${CREATED_BY}"><create><node id="-1" changeset="${group}" lat="${point.lat}" lon="${point.lon}">${tagsXml(osmTags)}</node></create></osmChange>`
}
