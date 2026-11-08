import { useEffect, useRef } from 'react'

const FOCALISABLES = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'

/**
 * Une fenêtre par-dessus la page (fiche, sources…), utilisable au clavier et au lecteur d'écran :
 * elle prend le focus en s'ouvrant, Échap la ferme, Tab tourne à l'intérieur sans en sortir, et le
 * focus revient là où il était quand elle se ferme. À poser sur l'élément `role="dialog"` (avec
 * `tabIndex={-1}`, pour qu'il puisse recevoir le focus).
 */
export function useFenetre<T extends HTMLElement>(ouverte: boolean, onFermer: () => void) {
  const ref = useRef<T>(null)
  const fermer = useRef(onFermer)

  useEffect(() => { fermer.current = onFermer })

  useEffect(() => {
    if (!ouverte) return
    const avant = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const fenetre = ref.current
    fenetre?.focus()

    function touche(e: KeyboardEvent) {
      if (e.key === 'Escape') { fermer.current(); return }
      if (e.key !== 'Tab' || !fenetre) return
      const elements = [...fenetre.querySelectorAll<HTMLElement>(FOCALISABLES)]
      const premier = elements[0]
      const dernier = elements[elements.length - 1]
      if (!premier) return
      if (e.shiftKey && (document.activeElement === premier || document.activeElement === fenetre)) {
        e.preventDefault()
        dernier.focus()
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault()
        premier.focus()
      }
    }

    document.addEventListener('keydown', touche)
    return () => {
      document.removeEventListener('keydown', touche)
      avant?.focus()
    }
  }, [ouverte])

  return { ref }
}
