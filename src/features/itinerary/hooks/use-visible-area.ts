import { useEffect, useState } from 'react'

/**
 * La partie de l'écran que le clavier ne cache pas (sur téléphone) : un panneau qui s'y tient garde
 * son champ juste au-dessus du clavier. `null` tant que le navigateur ne la donne pas.
 */
export function useVisibleArea() {
  const [zone, setZone] = useState<{ top: number; height: number } | null>(null)
  useEffect(() => {
    const view = window.visualViewport
    if (!view) return
    const follow = () => setZone({ top: view.offsetTop, height: view.height })
    follow()
    view.addEventListener('resize', follow)
    view.addEventListener('scroll', follow)
    return () => { view.removeEventListener('resize', follow); view.removeEventListener('scroll', follow) }
  }, [])
  return { zone }
}
