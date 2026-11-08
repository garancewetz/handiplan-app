import { describe, expect, it } from 'vitest'
import { verdict } from '~/features/lieux/utils/verdict.utils'
import type { Lieu } from '~/types/lieu.types'

const lieu = (etat: Lieu['etat'], lignes: Lieu['lignes'] = []): Lieu => ({
  id: 'node/1', type: 'resto', etat, nom: 'King Falafel Palace', libelle: 'Restauration rapide',
  lat: 48.85, lon: 2.35, metres: 540, lignes, sources: ['Acceslibre'],
})

describe('verdict', () => {
  it('dit d’abord si l’on peut y aller, puis ce qui gêne', () => {
    expect(verdict(lieu('non', [
      { theme: 'Entrée', reponse: 'non', texte: 'Marche haute ou escalier à l’entrée' },
      { theme: 'Entrée', reponse: 'oui', texte: 'Porte de 78 cm' },
      { theme: 'Entrée', reponse: 'attention', texte: 'Porte à ouvrir soi-même' },
      { theme: 'Toilettes', reponse: 'non', texte: 'Toilettes non adaptées' },
    ]))).toEqual({ etat: 'non', titre: 'Difficile', detail: 'marche haute ou escalier à l’entrée, toilettes non adaptées' })
  })

  it('ne cite pas ce qui va bien ni les autres thèmes', () => {
    expect(verdict(lieu('verifier', [
      { theme: 'Entrée', reponse: 'oui', texte: 'Entrée sans marche' },
      { theme: 'Toilettes', reponse: 'attention', texte: 'Toilettes : on ne sait pas' },
      { theme: 'Accueil', reponse: 'attention', texte: 'Pas de personnel à l’accueil' },
    ])).detail).toBe('toilettes : on ne sait pas')
  })

  it('dit simplement quand tout est bon, ou quand on ne sait rien', () => {
    expect(verdict(lieu('ok'))).toEqual({ etat: 'ok', titre: 'Facile', detail: 'Sans marche, toilettes adaptées' })
    expect(verdict(lieu('inconnu'))).toEqual({ etat: 'inconnu', titre: 'Pas encore d’info' })
  })
})

