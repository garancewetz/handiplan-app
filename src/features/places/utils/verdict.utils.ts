import type { State, Place } from '~/types/place.types'

export type Verdict = { state: State; title: string; detail?: string }

// La réponse à la seule question qui compte, « est-ce que je peux y aller ? », avant les détails :
// la fiche ne laisse pas faire la synthèse de plusieurs lignes (docs/decisions/interface, D17).
// Les mêmes mots que la légende et la liste : « est-ce galère d'y aller ? » (docs/decisions/interface, D18).
const TITLES: Record<State, string> = {
  ok: 'Facile',
  check: 'Attention',
  no: 'Difficile',
  unknown: 'Pas encore d’info',
  parking: 'Place handicapée',
}

/** Ce qui gêne, en peu de mots : les lignes « non » puis « attention » de l'entrée et des toilettes. */
function obstacles(place: Place): string[] {
  const essentials = place.lines.filter(line => line.theme === 'Entrée' || line.theme === 'Toilettes')
  return [...essentials.filter(line => line.answer === 'no'), ...essentials.filter(line => line.answer === 'warning')]
    .map(line => line.text.charAt(0).toLowerCase() + line.text.slice(1))
}

export function verdict(place: Place): Verdict {
  const title = TITLES[place.state]
  if (place.state === 'ok') return { state: 'ok', title, detail: 'Sans marche, toilettes adaptées' }
  if (place.state === 'parking' || place.state === 'unknown') return { state: place.state, title }
  const list = obstacles(place).slice(0, 2)
  return list.length > 0 ? { state: place.state, title, detail: list.join(', ') } : { state: place.state, title }
}

