import { useEffect, useState } from 'react'

/**
 * La partie de l'écran que le clavier ne cache pas (sur téléphone) : un panneau qui s'y tient garde
 * son champ juste au-dessus du clavier. `null` tant que le navigateur ne la donne pas.
 */
export function useZoneVisible() {
  const [zone, setZone] = useState<{ haut: number; hauteur: number } | null>(null)
  useEffect(() => {
    const vue = window.visualViewport
    if (!vue) return
    const suivre = () => setZone({ haut: vue.offsetTop, hauteur: vue.height })
    suivre()
    vue.addEventListener('resize', suivre)
    vue.addEventListener('scroll', suivre)
    return () => { vue.removeEventListener('resize', suivre); vue.removeEventListener('scroll', suivre) }
  }, [])
  return { zone }
}
