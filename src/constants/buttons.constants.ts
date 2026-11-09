import clsx from 'clsx'

/** Les quatre sortes de grands boutons de l'appli. */
export type Variant = 'primary' | 'secondary' | 'outline' | 'quiet'

const VARIANTS: Record<Variant, string> = {
  // L'action à faire : vert plein.
  primary: 'bg-moss text-white',
  // Revenir, fermer, annuler : bordure foncée.
  secondary: 'border-2 border-ink',
  // Une autre action possible : bordure verte.
  outline: 'border-2 border-moss text-moss',
  // En savoir plus : bordure légère, texte un peu plus petit.
  quiet: 'border-2 border-ink/25 text-lg font-semibold',
}

/**
 * Les classes d'un grand bouton : 64 px de haut pour tous, faciles à toucher d'un pouce. Sert aussi
 * à un lien qui a l'air d'un bouton.
 */
export const buttonClass = (variant: Variant, extra?: string) =>
  clsx('flex h-16 shrink-0 items-center justify-center rounded-3xl px-4 text-xl font-bold', VARIANTS[variant], extra)
