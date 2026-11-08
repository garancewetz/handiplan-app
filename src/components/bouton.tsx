import type { ButtonHTMLAttributes } from 'react'
import { classeBouton, type Variante } from '~/constants/boutons.constants'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variante: Variante }

/** Un grand bouton de l'appli, toujours de la même taille (voir boutons.constants.ts). */
export function Bouton({ variante, className, type = 'button', ...props }: Props) {
  return <button type={type} className={classeBouton(variante, className)} {...props} />
}
