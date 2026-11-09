import { useEffect, useRef, useState } from 'react'
import { Icon } from '~/components/icon'
import type { Suggestion } from '~/features/itinerary/api/address.api'
import { MicButton } from '~/features/itinerary/components/mic-button'
import { SuggestionGroup, SuggestionRow } from '~/features/itinerary/components/suggestion-row'
import { useDictation } from '~/features/itinerary/hooks/use-dictation'
import { useSuggestions } from '~/features/itinerary/hooks/use-suggestions'
import { useVisibleArea } from '~/features/itinerary/hooks/use-visible-area'
import { toSuggest, type Destination } from '~/features/itinerary/utils/recent-addresses.utils'
import { split, matchingPlaces } from '~/features/itinerary/utils/search.utils'
import { useDialog } from '~/hooks/use-dialog'
import type { Arrival, Place, Point } from '~/types/place.types'
import { distanceMeters } from '~/utils/distance.utils'

type Props = {
  places: Place[]
  recent: Destination[]
  near: Point | null
  onChoose: (arrival: Arrival) => void
  onChoosePlace: (place: Place) => void
  onSearch: (text: string) => void
  onClose: () => void
}

const key = (d: Destination) => d.place?.id ?? `${d.lat},${d.lon}`

/**
 * Le panneau de recherche, une feuille qui monte du bas comme la fiche d'un lieu : le haut de la
 * carte reste visible, on sait qu'on n'a pas quitté l'appli. Le champ reste en bas, là où l'on vient
 * de toucher la barre, juste au-dessus du clavier ; les propositions, en grandes lignes, s'empilent
 * au-dessus (docs/decisions/interface, D19).
 */
export function SearchPanel({ places, recent, near, onChoose, onChoosePlace, onSearch, onClose }: Props) {
  const [text, setText] = useState('')
  const field = useRef<HTMLInputElement>(null)
  // Rendu hors de l'appli (dans le corps de la page) : on rend l'appli inerte derrière, pour qu'un
  // lecteur d'écran ou le clavier ne s'y égare pas. Avant useFenetre : à la fermeture, l'appli
  // redevient active avant que le focus y revienne.
  useEffect(() => {
    const app = document.getElementById('root')
    if (!app) return
    app.inert = true
    return () => { app.inert = false }
  }, [])
  const { ref } = useDialog<HTMLDivElement>(true, onClose)
  const { zone } = useVisibleArea()
  const dictation = useDictation()
  const { suggestions, loading } = useSuggestions(text, near)
  const empty = text.trim() === ''
  const suggestedPlaces = matchingPlaces(places, text)
  // Un lieu déjà chargé (qui ouvre sa fiche) et le même trouvé par la recherche : on ne le montre qu'une fois.
  const otherSuggestions = suggestions.filter(s => !suggestedPlaces.some(p => distanceMeters(p, s) < 50))
  // Champ vide : comme Waze, on propose d'abord ce qu'on demande souvent, puis les dernières destinations.
  const { often, recent: dernieres } = empty ? toSuggest(recent) : { often: [], recent: [] }
  const number = often.length + dernieres.length + suggestedPlaces.length + otherSuggestions.length

  // Le clavier s'ouvre tout de suite : on vient pour taper.
  useEffect(() => { field.current?.focus() }, [])

  function choose(action: () => void) {
    onClose()
    action()
  }

  /** Un lieu déjà chargé rouvre sa fiche ; sinon, la carte va à l'endroit et le montre. */
  function reopen(d: Destination) {
    const place = d.place && places.find(p => p.id === d.place?.id)
    if (place) onChoosePlace(place)
    else onChoose(d)
  }

  const destinationRow = (d: Destination, marker: 'star' | 'clock') => {
    const { title, detail } = d.place ? { title: d.address, detail: d.place.label } : split(d.address)
    return (
      <SuggestionRow
        key={key(d)}
        title={title}
        detail={detail}
        icon={d.place ? d.place.type : marker}
        isPlace={d.place !== undefined}
        onChoose={() => choose(() => reopen(d))}
      />
    )
  }

  return (
    <div
      style={zone ? { top: zone.top, height: zone.height } : undefined}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-x-0 top-0 z-[1250] flex h-dvh flex-col justify-end bg-ink/30 lg:right-auto lg:w-[440px]"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Où allez-vous ?"
        tabIndex={-1}
        className="flex max-h-[calc(100%-56px)] flex-col rounded-t-[32px] bg-paper lg:shadow-2xl"
      >
        {/* Pour un lecteur d'écran : combien de propositions sont apparues, et quand le micro écoute. */}
        <p role="status" className="sr-only">
          {dictation.listening ? 'Je vous écoute.' : number > 0 ? `${number} propositions` : ''}
        </p>

        {/* Les propositions s'empilent au-dessus du champ, au plus près du pouce. */}
        <div id="suggestions" className="flex min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain px-4 pt-5 pb-2">
          {often.length > 0 && (
            <SuggestionGroup id="often-group" title="Souvent">{often.map(d => destinationRow(d, 'star'))}</SuggestionGroup>
          )}
          {dernieres.length > 0 && (
            <SuggestionGroup id="recent-group" title="Récemment">{dernieres.map(d => destinationRow(d, 'clock'))}</SuggestionGroup>
          )}
          {(suggestedPlaces.length > 0 || otherSuggestions.length > 0) && (
            <ul aria-label="Propositions" className="flex flex-col gap-2">
              {suggestedPlaces.map(p => (
                <SuggestionRow key={p.id} title={p.name} detail={`${p.label} · à ${p.meters} m`} icon={p.type} isPlace onChoose={() => choose(() => onChoosePlace(p))} />
              ))}
              {otherSuggestions.map(s => (
                <SuggestionRow key={`${s.lat},${s.lon},${s.title}`} title={s.title} detail={s.detail} onChoose={() => choose(() => onChoose(s))} />
              ))}
            </ul>
          )}
          {loading && suggestions.length === 0 && <p className="px-2 py-3 text-lg text-muted">Je cherche…</p>}
          {/* Un panneau tout vide ne dit pas quoi faire : au premier usage, une phrase et des exemples. */}
          {empty && recent.length === 0 && (
            <p className="px-2 pb-1 text-xl leading-8">
              Écrivez une adresse ou le nom d’un lieu, comme « 12 rue de Rivoli », « hôpital Saint-Antoine » ou « Marlette ».
              {dictation.available && <span className="block text-muted">Ou touchez le micro pour le dire.</span>}
            </p>
          )}
        </div>

        <form
          className="flex shrink-0 items-center gap-2 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),14px)]"
          onSubmit={e => {
            e.preventDefault()
            // Entrée prend le premier de la liste, comme le doigt : le lieu proche s'il y en a un.
            const place: Place | undefined = suggestedPlaces[0]
            const first: Suggestion | undefined = otherSuggestions[0]
            if (place) choose(() => onChoosePlace(place))
            else if (first) choose(() => onChoose(first))
            else if (text.trim()) choose(() => onSearch(text.trim()))
          }}
        >
          {/* La flèche retour à gauche du champ, comme dans Google Maps et Waze (docs/decisions/interface, D22). */}
          <button type="button" onClick={onClose} aria-label="Retour" className="flex size-15 shrink-0 items-center justify-center rounded-full text-ink">
            <Icon name="back" className="size-8" />
          </button>
          <div className="flex h-15 min-w-0 flex-1 items-center gap-2 rounded-full bg-white pr-1.5 pl-5 has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-3 has-[input:focus-visible]:outline-ink">
            <input
              ref={field}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={dictation.listening ? 'Je vous écoute…' : 'Où allez-vous ?'}
              aria-label="Où allez-vous ?"
              aria-controls="suggestions"
              enterKeyHint="search"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-xl outline-none placeholder:text-muted"
            />
            {text ? (
              <button
                type="button"
                onClick={() => { setText(''); field.current?.focus() }}
                aria-label="Effacer"
                className="flex size-12 shrink-0 items-center justify-center rounded-full text-ink"
              >
                <Icon name="cross" className="size-6" />
              </button>
            ) : dictation.available && (
              <MicButton listening={dictation.listening} onListen={() => dictation.listen(query => choose(() => onSearch(query)))} />
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
