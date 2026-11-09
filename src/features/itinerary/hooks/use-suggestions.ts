import { useEffect, useState } from 'react'
import { suggest, type Suggestion } from '~/features/itinerary/api/address.api'
import type { Point } from '~/types/place.types'

const DEBOUNCE_MS = 250
const MIN_LETTERS = 3

/**
 * Suggestions d'adresses pendant la frappe. On attend une courte pause avant d'interroger le
 * géocodeur, et une nouvelle frappe annule la demande précédente.
 */
export function useSuggestions(text: string, near: Point | null) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const searchText = text.trim()

  useEffect(() => {
    if (searchText.length < MIN_LETTERS) { setSuggestions([]); return }
    const abort = new AbortController()
    const timer = setTimeout(() => {
      setLoading(true)
      suggest(searchText, near, abort.signal)
        .then(setSuggestions)
        .catch(() => { if (!abort.signal.aborted) setSuggestions([]) })
        .finally(() => { if (!abort.signal.aborted) setLoading(false) })
    }, DEBOUNCE_MS)
    return () => { clearTimeout(timer); abort.abort() }
    // Suivre lat/lon plutôt que l'objet : un nouvel objet au même endroit ne doit pas relancer la recherche.
  }, [searchText, near?.lat, near?.lon]) // eslint-disable-line react-hooks/exhaustive-deps

  return { suggestions, loading }
}
