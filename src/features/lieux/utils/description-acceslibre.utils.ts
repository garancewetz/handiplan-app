import { couleur, type Entree, type Toilettes } from '~/features/lieux/utils/couleur.utils'
import type { Etat, Lieu, Ligne, Reponse, Theme, TypeLieu } from '~/types/lieu.types'

type Oui = boolean | null

export type LigneAcceslibre = {
  id: string
  web_url: string | null
  name: string | null
  activite: string | null
  latitude: number | null
  longitude: number | null
  numero?: string | null
  voie?: string | null
  entree_plain_pied: Oui
  entree_marches: number | null
  entree_marches_rampe: string | null
  entree_ascenseur: Oui
  accueil_cheminement_plain_pied: Oui
  accueil_cheminement_ascenseur: Oui
  sanitaires_adaptes: Oui
  // Colonnes ajoutées ensuite : absentes des zones préparées avant leur ajout, d'où le `?`.
  stationnement_pmr?: Oui
  stationnement_ext_pmr?: Oui
  cheminement_ext_presence?: Oui
  cheminement_ext_terrain_stable?: Oui
  cheminement_ext_plain_pied?: Oui
  cheminement_ext_ascenseur?: Oui
  cheminement_ext_nombre_marches?: number | null
  cheminement_ext_rampe?: string | null
  cheminement_ext_pente_presence?: Oui
  cheminement_ext_pente_degre_difficulte?: string | null
  cheminement_ext_devers?: string | null
  cheminement_ext_retrecissement?: Oui
  cheminement_ext_main_courante?: Oui
  entree_ascenseur_pmr?: Oui
  entree_largeur_mini?: number | null
  entree_pmr?: Oui
  entree_porte_type?: string | null
  entree_porte_manoeuvre?: string | null
  entree_dispositif_appel?: Oui
  entree_aide_humaine?: Oui
  entree_balise_sonore?: Oui
  entree_marches_main_courante?: Oui
  accueil_cheminement_nombre_marches?: number | null
  accueil_cheminement_rampe?: string | null
  accueil_ascenseur_etage?: Oui
  accueil_retrecissement?: Oui
  accueil_cheminement_main_courante?: Oui
  accueil_personnels?: string | null
  accueil_equipements_malentendants_presence?: Oui
  accueil_audiodescription_presence?: Oui
  sanitaires_presence?: Oui
  labels?: string | string[] | null
}

/** Colonnes lues par l'appli : le script de préparation n'écrit que celles-ci (scripts/lib/prepare.mjs). */
export const COLONNES_ACCESLIBRE = [
  'id', 'web_url', 'name', 'activite', 'latitude', 'longitude', 'numero', 'voie',
  'entree_plain_pied', 'entree_marches', 'entree_marches_rampe', 'entree_ascenseur',
  'accueil_cheminement_plain_pied', 'accueil_cheminement_ascenseur', 'sanitaires_adaptes',
  'stationnement_pmr', 'stationnement_ext_pmr',
  'cheminement_ext_presence', 'cheminement_ext_terrain_stable', 'cheminement_ext_plain_pied',
  'cheminement_ext_ascenseur', 'cheminement_ext_nombre_marches', 'cheminement_ext_rampe',
  'cheminement_ext_pente_presence', 'cheminement_ext_pente_degre_difficulte', 'cheminement_ext_devers',
  'cheminement_ext_retrecissement', 'cheminement_ext_main_courante',
  'entree_ascenseur_pmr', 'entree_marches_main_courante', 'entree_largeur_mini', 'entree_pmr', 'entree_porte_type', 'entree_porte_manoeuvre',
  'entree_dispositif_appel', 'entree_aide_humaine', 'entree_balise_sonore',
  'accueil_cheminement_nombre_marches', 'accueil_cheminement_rampe', 'accueil_ascenseur_etage',
  'accueil_retrecissement', 'accueil_cheminement_main_courante', 'accueil_personnels', 'accueil_equipements_malentendants_presence',
  'accueil_audiodescription_presence', 'sanitaires_presence', 'labels',
] as const satisfies readonly (keyof LigneAcceslibre)[]

// On ne garde que les cafés, restaurants et toilettes publiques : où l'on entre librement, et qui
// servent à sortir (docs/decisions/interface, D23). Les noms exacts de la liste d'Acceslibre : un motif
// attrapait aussi « Barbier », « Restaurant scolaire » ou « Personnes âgées : foyer restaurant »
// (docs/decisions/donnees, D11).
export const ACTIVITES: Record<string, TypeLieu> = {
  'Restaurant': 'resto',
  'Restauration rapide': 'resto',
  'Hôtel restaurant': 'resto',
  'Café, bar, brasserie': 'cafe',
  'Bar tabac': 'cafe',
  'Salon de thé': 'cafe',
  'Toilettes publiques': 'wc',
}

export function typeAcceslibre(activite: string | null): TypeLieu | null {
  return (activite && ACTIVITES[activite]) || null
}

export function nomPropre(nom: string | null) {
  const n = nom?.replace(/[‎‏]/g, '').trim()
  return n && n.length > 1 ? n : null
}

// En dessous, un fauteuil passe mal : 77 cm est le minimum réglementaire d'un passage.
const LARGEUR_FAUTEUIL_CM = 77

const LABELS: Record<string, string> = {
  th: 'Tourisme & Handicap', dpt: 'Destination pour Tous', mobalib: 'Mobalib', handiplage: 'Handiplage',
}

const avecRampe = (rampe: string | null | undefined) => rampe === 'fixe' || rampe === 'amovible'
const marches = (n: number | null | undefined) => n ? `${n} marche${n > 1 ? 's' : ''}` : 'Des marches'

/** Une main courante, seulement là où il y a des marches. */
function tenir(ligne: (reponse: Reponse, texte: string) => void, marches: boolean, mainCourante: Oui | undefined) {
  if (!marches) return
  if (mainCourante) ligne('oui', 'Main courante pour se tenir')
  else if (mainCourante === false) ligne('attention', 'Pas de main courante')
}

/** Les labels arrivent en liste (API) ou en texte « ['th', 'dpt'] » (fichier CSV). */
function labelsConnus(labels: LigneAcceslibre['labels']): string[] {
  const codes = Array.isArray(labels) ? labels : (labels ?? '').match(/[a-z]+/g) ?? []
  return codes.flatMap(c => LABELS[c] ? [LABELS[c]] : [])
}

function entree(r: LigneAcceslibre, ligne: (reponse: Reponse, texte: string, detail?: string) => void): Entree {
  if (r.entree_plain_pied) {
    ligne('oui', 'Entrée sans marche')
    return 'ok'
  }
  if (r.entree_ascenseur) {
    ligne(r.entree_ascenseur_pmr === false ? 'attention' : 'oui', 'Entrée par ascenseur',
      r.entree_ascenseur_pmr === false ? 'Ascenseur pas adapté aux fauteuils' : undefined)
    return 'ok'
  }
  if (avecRampe(r.entree_marches_rampe)) {
    ligne('oui', 'Entrée avec rampe', r.entree_marches_rampe === 'amovible' ? 'Rampe à demander' : undefined)
    return 'ok'
  }
  if (r.entree_plain_pied === false) {
    ligne('non', `${marches(r.entree_marches)} à l’entrée`, 'Pas de rampe indiquée')
    return 'non'
  }
  ligne('attention', 'Entrée : on ne sait pas')
  return 'inconnue'
}

/** Toutes les informations renseignées sur Acceslibre, rangées par thème. Ce qui n'est pas renseigné n'apparaît pas. */
export function decrireAcceslibre(r: LigneAcceslibre): { etat: Exclude<Etat, 'parking'>; lignes: Ligne[]; acces: NonNullable<Lieu['acces']> } {
  const lignes: Ligne[] = []
  const dans = (theme: Theme) => (reponse: Reponse, texte: string, detail?: string) =>
    lignes.push({ theme, reponse, texte, ...(detail ? { detail } : {}) })

  const garer = dans('Se garer')
  if (r.stationnement_pmr) garer('oui', 'Place handicapée sur place')
  else if (r.stationnement_ext_pmr) garer('oui', 'Place handicapée à moins de 200 m')
  else if (r.stationnement_pmr === false && r.stationnement_ext_pmr === false) garer('non', 'Pas de place handicapée à proximité')

  const rue = dans('Depuis la rue')
  if (r.cheminement_ext_presence) {
    if (r.cheminement_ext_plain_pied) rue('oui', 'Chemin sans marche jusqu’à l’entrée')
    else if (r.cheminement_ext_ascenseur) rue('oui', 'Ascenseur sur le chemin de l’entrée')
    else if (avecRampe(r.cheminement_ext_rampe)) rue('oui', 'Rampe sur le chemin de l’entrée', r.cheminement_ext_rampe === 'amovible' ? 'Rampe à demander' : undefined)
    else if (r.cheminement_ext_plain_pied === false) rue('non', `${marches(r.cheminement_ext_nombre_marches)} sur le chemin de l’entrée`)
    tenir(rue, r.cheminement_ext_plain_pied === false, r.cheminement_ext_main_courante)
    if (r.cheminement_ext_pente_presence) {
      rue(r.cheminement_ext_pente_degre_difficulte === 'importante' ? 'non' : 'attention',
        r.cheminement_ext_pente_degre_difficulte === 'importante' ? 'Pente forte' : 'Pente légère')
    }
    if (r.cheminement_ext_devers === 'important') rue('attention', 'Chemin penché sur le côté')
    if (r.cheminement_ext_terrain_stable === false) rue('attention', 'Sol instable', 'Pavés, gravier, terre ou herbe')
    if (r.cheminement_ext_retrecissement) rue('attention', 'Passage de moins de 90 cm')
  }

  const porte = dans('Entrée')
  const etatEntree = entree(r, porte)
  // Avec un côté affaibli, pouvoir se tenir dans des marches change tout (docs/decisions/interface, D18).
  tenir(porte, r.entree_plain_pied === false, r.entree_marches_main_courante)
  if (r.entree_pmr) porte('oui', 'Une entrée sans marche à part', 'Une autre porte que l’entrée principale')
  if (r.entree_largeur_mini) {
    const large = r.entree_largeur_mini >= LARGEUR_FAUTEUIL_CM
    porte(large ? 'oui' : 'attention', `Porte de ${r.entree_largeur_mini} cm`, large ? undefined : 'Étroite pour un fauteuil')
  }
  if (r.entree_porte_type === 'automatique') porte('oui', 'Porte automatique')
  else if (r.entree_porte_manoeuvre === 'tourniquet' || r.entree_porte_manoeuvre === 'tambour') porte('non', r.entree_porte_manoeuvre === 'tambour' ? 'Porte tambour' : 'Tourniquet')
  else if (r.entree_porte_type === 'manuelle') porte('attention', 'Porte à ouvrir soi-même')
  if (r.entree_dispositif_appel) porte('oui', 'Sonnette pour appeler')
  if (r.entree_aide_humaine) porte('oui', 'On peut vous aider à entrer')

  const dedans = dans('À l’intérieur')
  if (r.accueil_cheminement_plain_pied) dedans('oui', 'Intérieur sans marche')
  else if (r.accueil_cheminement_ascenseur) dedans('oui', 'Ascenseur à l’intérieur')
  else if (avecRampe(r.accueil_cheminement_rampe)) dedans('oui', 'Rampe à l’intérieur')
  else if (r.accueil_cheminement_plain_pied === false) dedans('attention', `${marches(r.accueil_cheminement_nombre_marches)} à l’intérieur`)
  tenir(dedans, r.accueil_cheminement_plain_pied === false, r.accueil_cheminement_main_courante)
  if (r.accueil_ascenseur_etage) dedans('oui', 'Ascenseur pour les étages')
  else if (r.accueil_ascenseur_etage === false) dedans('attention', 'Pas d’ascenseur pour les étages')
  if (r.accueil_retrecissement) dedans('attention', 'Passage de moins de 90 cm')

  const wc = dans('Toilettes')
  const toilettes: Toilettes = r.sanitaires_adaptes === true ? 'oui' : r.sanitaires_adaptes === false ? 'non' : 'inconnues'
  if (r.sanitaires_presence === false) wc('non', 'Pas de toilettes')
  else if (toilettes === 'oui') wc('oui', 'Toilettes adaptées')
  else if (toilettes === 'non') wc('non', 'Toilettes non adaptées')
  else wc('attention', 'Toilettes : on ne sait pas', 'Le lieu ne l’a pas encore dit : à demander sur place')

  const accueil = dans('Accueil')
  if (r.accueil_personnels === 'formés') accueil('oui', 'Personnel formé au handicap')
  else if (r.accueil_personnels === 'non-formés') accueil('attention', 'Personnel non formé au handicap')
  else if (r.accueil_personnels === 'aucun') accueil('attention', 'Pas de personnel à l’accueil')
  if (r.accueil_equipements_malentendants_presence) accueil('oui', 'Aide pour les personnes sourdes ou malentendantes')
  if (r.accueil_audiodescription_presence) accueil('oui', 'Audiodescription')
  if (r.entree_balise_sonore) accueil('oui', 'Balise sonore à l’entrée')
  for (const label of labelsConnus(r.labels)) accueil('oui', `Label ${label}`)

  return { etat: couleur(etatEntree, toilettes), lignes, acces: { entree: etatEntree, toilettes } }
}
