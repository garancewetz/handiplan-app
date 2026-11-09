import { describe, expect, it } from 'vitest'
import {
  decrireAcceslibre,
  nomPropre,
  typeAcceslibre,
  type LigneAcceslibre,
} from '~/features/lieux/utils/description-acceslibre.utils'

function ligne(champs: Partial<LigneAcceslibre>): LigneAcceslibre {
  return {
    id: 'x', web_url: null, name: 'Le Lieu', activite: 'Restaurant', latitude: 48.85, longitude: 2.35,
    entree_plain_pied: null, entree_marches: null, entree_marches_rampe: null, entree_ascenseur: null,
    accueil_cheminement_plain_pied: null, accueil_cheminement_ascenseur: null, sanitaires_adaptes: true,
    ...champs,
  }
}

describe('typeAcceslibre', () => {
  it('garde les lieux où l’on entre librement', () => {
    expect(typeAcceslibre('Café, bar, brasserie')).toBe('cafe')
    expect(typeAcceslibre('Restauration rapide')).toBe('resto')
    expect(typeAcceslibre('Musée')).toBeNull()
  })

  it('écarte les lieux sur rendez-vous', () => {
    expect(typeAcceslibre('Avocat')).toBeNull()
    expect(typeAcceslibre('Dentiste, chirurgien dentiste')).toBeNull()
    expect(typeAcceslibre(null)).toBeNull()
  })

  it('ne prend pas un barbier pour un bar, ni une cantine pour un restaurant', () => {
    expect(typeAcceslibre('Barbier')).toBeNull()
    expect(typeAcceslibre('Vente de cafés et thés')).toBeNull()
    expect(typeAcceslibre('Restaurant scolaire')).toBeNull()
    expect(typeAcceslibre('Personnes âgées : foyer restaurant')).toBeNull()
    expect(typeAcceslibre('Bar tabac')).toBe('cafe')
    expect(typeAcceslibre('Toilettes publiques')).toBe('wc')
  })
})

describe('nomPropre', () => {
  it('ignore les noms vides ou d’un seul caractère', () => {
    expect(nomPropre('.')).toBeNull()
    expect(nomPropre('Au Chien Qui Fume‎')).toBe('Au Chien Qui Fume')
  })
})

describe('decrireAcceslibre', () => {
  it('marque « ok » une entrée de plain-pied', () => {
    const r = decrireAcceslibre(ligne({ entree_plain_pied: true }))
    expect(r.etat).toBe('ok')
    expect(r.lignes[0].texte).toBe('Entrée sans marche')
  })

  it('accepte une rampe, en précisant qu’elle est à demander', () => {
    const r = decrireAcceslibre(ligne({ entree_plain_pied: false, entree_marches: 2, entree_marches_rampe: 'amovible' }))
    expect(r.etat).toBe('ok')
    expect(r.lignes[0]).toMatchObject({ texte: 'Entrée avec rampe', detail: 'Rampe à demander' })
  })

  it('marque « pas accessible » une entrée avec des marches sans rampe et des toilettes non adaptées', () => {
    const r = decrireAcceslibre(ligne({ entree_plain_pied: false, entree_marches: 2, entree_marches_rampe: 'aucune', sanitaires_adaptes: false }))
    expect(r.etat).toBe('non')
    expect(r.lignes[0]).toMatchObject({ reponse: 'non', texte: '2 marches à l’entrée' })
  })

  it('marque « en partie » des marches à l’entrée mais des toilettes adaptées', () => {
    expect(decrireAcceslibre(ligne({ entree_plain_pied: false, entree_marches: 1, sanitaires_adaptes: true })).etat).toBe('verifier')
  })

  it('reste « à vérifier » si l’entrée est facile mais les toilettes pas adaptées ou inconnues', () => {
    const nonAdaptees = decrireAcceslibre(ligne({ entree_plain_pied: true, sanitaires_adaptes: false }))
    expect(nonAdaptees.etat).toBe('verifier')
    expect(nonAdaptees.lignes).toContainEqual(expect.objectContaining({ reponse: 'non', texte: 'Toilettes non adaptées' }))
    expect(decrireAcceslibre(ligne({ entree_plain_pied: true, sanitaires_adaptes: null })).etat).toBe('verifier')
  })

  it('reste « à vérifier » quand l’entrée n’est pas renseignée', () => {
    expect(decrireAcceslibre(ligne({})).etat).toBe('verifier')
  })
})

describe('decrireAcceslibre : toutes les catégories renseignées', () => {
  const textes = (champs: Partial<LigneAcceslibre>) =>
    decrireAcceslibre(ligne(champs)).lignes.map(l => `${l.theme} · ${l.texte}`)

  it('range chaque information dans son thème, dans l’ordre de la fiche', () => {
    expect(textes({
      entree_plain_pied: true, stationnement_pmr: true, entree_largeur_mini: 90, entree_porte_type: 'automatique',
      accueil_ascenseur_etage: true, accueil_personnels: 'formés', labels: "['th']",
    })).toEqual([
      'Se garer · Place handicapée sur place',
      'Entrée · Entrée sans marche',
      'Entrée · Porte de 90 cm',
      'Entrée · Porte automatique',
      'À l’intérieur · Ascenseur pour les étages',
      'Toilettes · Toilettes adaptées',
      'Accueil · Personnel formé au handicap',
      'Accueil · Label Tourisme & Handicap',
    ])
  })

  it('signale ce qui gêne un fauteuil', () => {
    const lignes = decrireAcceslibre(ligne({
      cheminement_ext_presence: true, cheminement_ext_plain_pied: false, cheminement_ext_nombre_marches: 3,
      cheminement_ext_pente_presence: true, cheminement_ext_pente_degre_difficulte: 'importante', entree_largeur_mini: 70,
    })).lignes
    expect(lignes).toContainEqual({ theme: 'Depuis la rue', reponse: 'non', texte: '3 marches sur le chemin de l’entrée' })
    expect(lignes).toContainEqual({ theme: 'Depuis la rue', reponse: 'non', texte: 'Pente forte' })
    expect(lignes).toContainEqual({ theme: 'Entrée', reponse: 'attention', texte: 'Porte de 70 cm', detail: 'Étroite pour un fauteuil' })
  })

  it('n’affiche rien de ce qui n’est pas renseigné', () => {
    expect(textes({ entree_plain_pied: true })).toEqual(['Entrée · Entrée sans marche', 'Toilettes · Toilettes adaptées'])
  })

  it('dit quand il n’y a pas de toilettes du tout', () => {
    expect(textes({ sanitaires_presence: false, sanitaires_adaptes: null })).toContain('Toilettes · Pas de toilettes')
  })
})

describe('decrireAcceslibre : se tenir', () => {
  it('dit s’il y a une main courante, seulement là où il y a des marches', () => {
    const textes = (champs: Partial<LigneAcceslibre>) => decrireAcceslibre(ligne(champs)).lignes.map(l => l.texte)
    expect(textes({ entree_plain_pied: false, entree_marches: 2, entree_marches_main_courante: true })).toContain('Main courante pour se tenir')
    expect(textes({ entree_plain_pied: false, entree_marches: 2, entree_marches_main_courante: false })).toContain('Pas de main courante')
    expect(textes({ entree_plain_pied: true, entree_marches_main_courante: false })).not.toContain('Pas de main courante')
  })
})
