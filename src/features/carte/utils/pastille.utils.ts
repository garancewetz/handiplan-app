import { ICONES } from '~/constants/icones.constants'
import { MOT_ETAT, SYMBOLE_ETAT } from '~/features/lieux/constants/etats.constants'
import type { Lieu } from '~/types/lieu.types'

/**
 * La pastille d'un lieu : son genre (tasse, couverts) sur la couleur de son état, et le symbole de
 * l'état dans un coin. Une place a déjà son P (docs/decisions/interface, D24).
 */
export function htmlPastille(lieu: Lieu, choisi: boolean) {
  const symbole = lieu.etat === 'parking' ? '' : `<span class="etat">${SYMBOLE_ETAT[lieu.etat]}</span>`
  // Caché aux lecteurs d'écran : sinon le symbole (« ! ») deviendrait le nom de la pastille, à la place
  // de « Marlette, attention » (son titre, posé par la carte).
  return `<div class="marqueur ${lieu.etat}${choisi ? ' choisi' : ''}" aria-hidden="true">${ICONES[lieu.type]}${symbole}</div>`
}

/** Ce qu'annonce un lecteur d'écran (et l'info-bulle) sur une pastille : le nom, puis l'état. */
export const nomPastille = (lieu: Lieu) => (lieu.nom === MOT_ETAT[lieu.etat] ? lieu.nom : `${lieu.nom}, ${MOT_ETAT[lieu.etat].toLowerCase()}`)
