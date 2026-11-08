import type { Etat, Lieu } from '~/types/lieu.types'

export type Verdict = { etat: Etat; titre: string; detail?: string }

// La réponse à la seule question qui compte, « est-ce que je peux y aller ? », avant les détails :
// la fiche ne laisse pas faire la synthèse de plusieurs lignes (docs/decisions/interface, D17).
// Les mêmes mots que la légende et la liste : « est-ce galère d'y aller ? » (docs/decisions/interface, D18).
const TITRES: Record<Etat, string> = {
  ok: 'Facile',
  verifier: 'Attention',
  non: 'Difficile',
  inconnu: 'Pas encore d’info',
  parking: 'Place handicapée',
}

/** Ce qui gêne, en peu de mots : les lignes « non » puis « attention » de l'entrée et des toilettes. */
function obstacles(lieu: Lieu): string[] {
  const essentielles = lieu.lignes.filter(l => l.theme === 'Entrée' || l.theme === 'Toilettes')
  return [...essentielles.filter(l => l.reponse === 'non'), ...essentielles.filter(l => l.reponse === 'attention')]
    .map(l => l.texte.charAt(0).toLowerCase() + l.texte.slice(1))
}

export function verdict(lieu: Lieu): Verdict {
  const titre = TITRES[lieu.etat]
  if (lieu.etat === 'ok') return { etat: 'ok', titre, detail: 'Sans marche, toilettes adaptées' }
  if (lieu.etat === 'parking' || lieu.etat === 'inconnu') return { etat: lieu.etat, titre }
  const liste = obstacles(lieu).slice(0, 2)
  return liste.length > 0 ? { etat: lieu.etat, titre, detail: liste.join(', ') } : { etat: lieu.etat, titre }
}

