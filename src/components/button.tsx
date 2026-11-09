import type { ButtonHTMLAttributes } from 'react'
import { buttonClass, type Variant } from '~/constants/buttons.constants'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant: Variant }

/** Un grand bouton de l'appli, toujours de la même taille (voir boutons.constants.ts). */
export function Button({ variant, className, type = 'button', ...props }: Props) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />
}
