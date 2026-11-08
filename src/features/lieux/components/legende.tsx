import clsx from 'clsx'
import { MOT_ETAT, SYMBOLE_ETAT } from '~/features/lieux/constants/etats.constants'
import type { Etat } from '~/types/lieu.types'

// Les mêmes pastilles que sur la carte, avec leurs mots : on n'a pas à deviner ce que veut dire une couleur.
const CLASSES: [Etat, string][] = [
  ['ok', 'bg-mousse text-white'],
  ['verifier', 'bg-ambre text-white'],
  ['non', 'bg-non text-white'],
  ['inconnu', 'border-2 border-dashed border-gris bg-white text-gris'],
  ['parking', 'bg-place text-white'],
]

/** La légende des couleurs, sous la carte. */
export function Legende() {
  return (
    <ul aria-label="Les couleurs de la carte" className="mb-3 flex flex-wrap gap-x-4 gap-y-2 px-1">
      {CLASSES.map(([etat, classe]) => (
        <li key={etat} className="flex items-center gap-1.5 text-lg">
          <span aria-hidden className={clsx('flex size-6 items-center justify-center rounded-md text-sm font-bold', classe)}>{SYMBOLE_ETAT[etat]}</span>
          {MOT_ETAT[etat]}
        </li>
      ))}
    </ul>
  )
}
