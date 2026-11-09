import clsx from 'clsx'
import { Icon } from '~/components/icon'

type Props = { listening: boolean; onListen: () => void }

/** Le micro, au bout du champ : un toucher et l'on dit son adresse. Orange pendant l'écoute. */
export function MicButton({ listening, onListen }: Props) {
  return (
    <button
      type="button"
      onClick={onListen}
      aria-label="Dire une adresse"
      aria-pressed={listening}
      className={clsx('flex size-12 shrink-0 items-center justify-center rounded-full text-white', listening ? 'bg-amber' : 'bg-moss')}
    >
      <Icon name="mic" className="size-6" />
    </button>
  )
}
