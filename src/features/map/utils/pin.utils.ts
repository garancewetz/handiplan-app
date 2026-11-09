import { ICONS } from '~/constants/icons.constants'
import { STATE_WORD, STATE_SYMBOL } from '~/features/places/constants/states.constants'
import type { Place } from '~/types/place.types'

/**
 * La pastille d'un lieu : son genre (tasse, couverts) sur la couleur de son état, et le symbole de
 * l'état dans un coin. Une place a déjà son P (docs/decisions/interface, D24).
 */
export function pinHtml(place: Place, chosen: boolean) {
  const symbol = place.state === 'parking' ? '' : `<span class="state">${STATE_SYMBOL[place.state]}</span>`
  // Caché aux lecteurs d'écran : sinon le symbole (« ! ») deviendrait le nom de la pastille, à la place
  // de « Marlette, attention » (son titre, posé par la carte).
  return `<div class="marker ${place.state}${chosen ? ' selected' : ''}" aria-hidden="true">${ICONS[place.type]}${symbol}</div>`
}

/** Ce qu'annonce un lecteur d'écran (et l'info-bulle) sur une pastille : le nom, puis l'état. */
export const pinName = (place: Place) => (place.name === STATE_WORD[place.state] ? place.name : `${place.name}, ${STATE_WORD[place.state].toLowerCase()}`)
