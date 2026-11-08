import clsx from 'clsx'

/** Les quatre sortes de grands boutons de l'appli. */
export type Variante = 'principal' | 'secondaire' | 'contour' | 'discret'

const VARIANTES: Record<Variante, string> = {
  // L'action à faire : vert plein.
  principal: 'bg-mousse text-white',
  // Revenir, fermer, annuler : bordure foncée.
  secondaire: 'border-2 border-encre',
  // Une autre action possible : bordure verte.
  contour: 'border-2 border-mousse text-mousse',
  // En savoir plus : bordure légère, texte un peu plus petit.
  discret: 'border-2 border-encre/25 text-lg font-semibold',
}

/**
 * Les classes d'un grand bouton : 64 px de haut pour tous, faciles à toucher d'un pouce. Sert aussi
 * à un lien qui a l'air d'un bouton.
 */
export const classeBouton = (variante: Variante, enPlus?: string) =>
  clsx('flex h-16 shrink-0 items-center justify-center rounded-3xl px-4 text-xl font-bold', VARIANTES[variante], enPlus)
