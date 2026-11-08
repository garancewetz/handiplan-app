type Props = { onClick: () => void }

/**
 * « Ajouter une place handicapée » : une action rare, rangée en bas de la liste plutôt que sur la
 * carte, qui ne garde que ce qui sert à la regarder (docs/decisions/interface, D17).
 */
export function BoutonPlace({ onClick }: Props) {
  return (
    <button onClick={onClick} className="mt-2.5 flex h-16 w-full items-center justify-center gap-3 rounded-[22px] border-2 border-place text-xl font-semibold text-place">
      <span aria-hidden className="relative flex size-9 items-center justify-center rounded-lg bg-place text-xl font-bold text-white">
        P
        <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-mousse text-base leading-none text-white ring-2 ring-white">+</span>
      </span>
      Ajouter une place handicapée
    </button>
  )
}
