type Props = { onClick: () => void }

/**
 * « Ajouter une place handicapée » : une action rare, rangée en bas de la liste plutôt que sur la
 * carte, qui ne garde que ce qui sert à la regarder (docs/decisions/interface, D17).
 */
export function BoutonPlace({ onClick }: Props) {
  return (
    <button onClick={onClick} className="mt-2.5 flex min-h-16 w-full items-center justify-center gap-3.5 rounded-[22px] border-2 border-place px-2 py-2 text-lg font-semibold text-place">
      {/* L'icône ne rétrécit jamais, et le texte (18 px) tient sur une ligne sur un téléphone courant. */}
      <span aria-hidden className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-place text-lg font-bold text-white">
        P
        <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-mousse text-base leading-none text-white ring-2 ring-white">+</span>
      </span>
      <span className="text-balance">Ajouter une place handicapée</span>
    </button>
  )
}
