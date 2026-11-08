import { useEffect, useState } from 'react'
import { suggerer, type Suggestion } from '~/features/itineraire/api/adresse.api'
import type { Point } from '~/types/lieu.types'

const ATTENTE_MS = 250
const LETTRES_MIN = 3

/**
 * Suggestions d'adresses pendant la frappe. On attend une courte pause avant d'interroger le
 * géocodeur, et une nouvelle frappe annule la demande précédente.
 */
export function useSuggestions(texte: string, proche: Point | null) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [chargement, setChargement] = useState(false)
  const recherche = texte.trim()

  useEffect(() => {
    if (recherche.length < LETTRES_MIN) { setSuggestions([]); return }
    const annulation = new AbortController()
    const minuterie = setTimeout(() => {
      setChargement(true)
      suggerer(recherche, proche, annulation.signal)
        .then(setSuggestions)
        .catch(() => { if (!annulation.signal.aborted) setSuggestions([]) })
        .finally(() => { if (!annulation.signal.aborted) setChargement(false) })
    }, ATTENTE_MS)
    return () => { clearTimeout(minuterie); annulation.abort() }
    // Suivre lat/lon plutôt que l'objet : un nouvel objet au même endroit ne doit pas relancer la recherche.
  }, [recherche, proche?.lat, proche?.lon]) // eslint-disable-line react-hooks/exhaustive-deps

  return { suggestions, chargement }
}
