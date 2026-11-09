import clsx from 'clsx'
import { STATE_WORD, STATE_SYMBOL } from '~/features/places/constants/states.constants'
import type { State } from '~/types/place.types'

// Les mêmes pastilles que sur la carte, avec leurs mots : on n'a pas à deviner ce que veut dire une couleur.
const CLASSES: [State, string][] = [
  ['ok', 'bg-moss text-white'],
  ['check', 'bg-amber text-white'],
  ['no', 'bg-difficult text-white'],
  ['unknown', 'border-2 border-dashed border-grey bg-white text-grey'],
  ['parking', 'bg-parking text-white'],
]

/** La légende des couleurs, sous la carte. */
export function Legend() {
  return (
    <ul aria-label="Les couleurs de la carte" className="mb-3 flex flex-wrap gap-x-4 gap-y-2 px-1">
      {CLASSES.map(([state, cssClass]) => (
        <li key={state} className="flex items-center gap-1.5 text-lg">
          <span aria-hidden className={clsx('flex size-6 items-center justify-center rounded-md text-sm font-bold', cssClass)}>{STATE_SYMBOL[state]}</span>
          {STATE_WORD[state]}
        </li>
      ))}
    </ul>
  )
}
