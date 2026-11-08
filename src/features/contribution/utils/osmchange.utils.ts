// Les messages XML de l'API d'OpenStreetMap (0.6) : ouvrir un groupe de modifications, puis y
// déposer le lieu modifié. Fonctions pures, testées : l'envoi lui-même est dans osm-edition.api.ts.

type Membre = { type: 'node' | 'way' | 'relation'; ref: number; role: string }

/** Un objet OSM tel que l'API le renvoie en JSON. */
export type ElementOsm = {
  type: 'node' | 'way' | 'relation'
  id: number
  version: number
  lat?: number
  lon?: number
  nodes?: number[]
  members?: Membre[]
  tags: Record<string, string>
}

const echapper = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const etiquettesXml = (etiquettes: Record<string, string>) =>
  Object.entries(etiquettes).map(([k, v]) => `<tag k="${echapper(k)}" v="${echapper(v)}"/>`).join('')

/**
 * Le groupe de modifications : commentaire clair, appli et #handiplan, pour que la communauté suive.
 * `surPlace` : la personne répond à ce qu'elle voit (`source=survey`, comme StreetComplete).
 */
export function xmlGroupe(commentaire: string, surPlace: boolean): string {
  const etiquettes = { comment: commentaire, created_by: 'Handiplan', hashtags: '#handiplan', ...(surPlace ? { source: 'survey' } : {}) }
  return `<osm><changeset>${etiquettesXml(etiquettes)}</changeset></osm>`
}

/**
 * Le lieu modifié (osmChange « modify ») : l'objet entier, avec sa version (OSM refuse une
 * modification faite sur une version dépassée) et ses nouvelles étiquettes. Un chemin garde ses
 * nœuds, une relation ses membres : seules les étiquettes changent.
 */
export function xmlModification(element: ElementOsm, groupe: number, etiquettes: Record<string, string>): string {
  const attributs = `id="${element.id}" version="${element.version}" changeset="${groupe}"`
  const tags = etiquettesXml(etiquettes)
  const corps =
    element.type === 'node'
      ? `<node ${attributs} lat="${element.lat}" lon="${element.lon}">${tags}</node>`
      : element.type === 'way'
        ? `<way ${attributs}>${(element.nodes ?? []).map(n => `<nd ref="${n}"/>`).join('')}${tags}</way>`
        : `<relation ${attributs}>${(element.members ?? []).map(m => `<member type="${m.type}" ref="${m.ref}" role="${echapper(m.role)}"/>`).join('')}${tags}</relation>`
  return `<osmChange version="0.6" generator="Handiplan"><modify>${corps}</modify></osmChange>`
}

/**
 * Un point neuf : une place handicapée ajoutée, ou, sur le serveur de test (où les lieux de la vraie
 * carte n'existent pas), une copie du lieu avec les nouvelles étiquettes.
 */
export function xmlNouveauPoint(point: { lat: number; lon: number }, groupe: number, etiquettes: Record<string, string>): string {
  return `<osmChange version="0.6" generator="Handiplan"><create><node id="-1" changeset="${groupe}" lat="${point.lat}" lon="${point.lon}">${etiquettesXml(etiquettes)}</node></create></osmChange>`
}
