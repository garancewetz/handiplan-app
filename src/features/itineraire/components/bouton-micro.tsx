import clsx from 'clsx'
import { Icone } from '~/components/icone'

type Props = { ecoute: boolean; onEcouter: () => void }

/** Le micro, au bout du champ : un toucher et l'on dit son adresse. Orange pendant l'écoute. */
export function BoutonMicro({ ecoute, onEcouter }: Props) {
  return (
    <button
      type="button"
      onClick={onEcouter}
      aria-label="Dire une adresse"
      aria-pressed={ecoute}
      className={clsx('flex size-12 shrink-0 items-center justify-center rounded-full text-white', ecoute ? 'bg-ambre' : 'bg-mousse')}
    >
      <Icone nom="micro" className="size-6" />
    </button>
  )
}
