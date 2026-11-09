import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'

/**
 * Une fenêtre par-dessus la page (fiche, sources…), utilisable au clavier et au lecteur d'écran :
 * elle prend le focus en s'ouvrant, Échap la ferme, Tab tourne à l'intérieur sans en sortir, et le
 * focus revient là où il était quand elle se ferme. À poser sur l'élément `role="dialog"` (avec
 * `tabIndex={-1}`, pour qu'il puisse recevoir le focus).
 */
export function useDialog<T extends HTMLElement>(opened: boolean, onClose: () => void) {
  const ref = useRef<T>(null)
  const close = useRef(onClose)

  useEffect(() => { close.current = onClose })

  useEffect(() => {
    if (!opened) return
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = ref.current
    dialog?.focus()

    function keyPressed(e: KeyboardEvent) {
      if (e.key === 'Escape') { close.current(); return }
      if (e.key !== 'Tab' || !dialog) return
      const elements = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)]
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (!first) return
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', keyPressed)
    return () => {
      document.removeEventListener('keydown', keyPressed)
      before?.focus()
    }
  }, [opened])

  return { ref }
}
