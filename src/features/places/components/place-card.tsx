import { useState } from 'react'
import clsx from 'clsx'
import { useDialog } from '~/hooks/use-dialog'
import { useSwipeToClose } from '~/hooks/use-swipe-to-close'
import { verdict } from '~/features/places/utils/verdict.utils'
import { THEMES, type State, type Place, type Answer, type Theme } from '~/types/place.types'
import { Button } from '~/components/button'

// Le verdict, en couleur et en mots : le symbole répète la couleur, pour qui la distingue mal.
const VERDICT: Record<State, { block: string; dot: string; symbol: string }> = {
  ok: { block: 'bg-moss text-white', dot: 'bg-white text-moss', symbol: '✓' },
  check: { block: 'bg-amber-light text-amber-dark', dot: 'bg-amber text-white', symbol: '!' },
  no: { block: 'bg-difficult-light text-ink', dot: 'bg-difficult text-white', symbol: '✕' },
  unknown: { block: 'border-2 border-dashed border-grey bg-white text-ink', dot: 'bg-grey text-white', symbol: '?' },
  parking: { block: 'bg-parking-light text-parking', dot: 'bg-parking text-white', symbol: 'P' },
}
// Le symbole se voit, le mot se lit : un lecteur d'écran dit « Oui : Accessible en fauteuil ».
const DOT: Record<Answer, { cssClass: string; symbol: string; word: string }> = {
  yes: { cssClass: 'bg-moss', symbol: '✓', word: 'Oui' },
  warning: { cssClass: 'bg-amber', symbol: '!', word: 'Attention' },
  no: { cssClass: 'bg-difficult', symbol: '✕', word: 'Non' },
  info: { cssClass: 'bg-grey', symbol: 'i', word: 'À savoir' },
}

// Ce qui décide si l'on peut y aller ; le reste attend derrière « Voir tous les détails », pour ne pas
// noyer l'essentiel (docs/decisions/interface, D15).
const ESSENTIALS: Theme[] = ['Se garer', 'Entrée', 'Toilettes']

/** D'abord la réponse : peut-on y aller ? Puis, dessous, le détail de chaque critère. */
function Verdict({ place }: { place: Place }) {
  const { state, title, detail } = verdict(place)
  return (
    <div className={clsx('flex shrink-0 items-center gap-3.5 rounded-[20px] px-4 py-3.5', VERDICT[state].block)}>
      <span aria-hidden className={clsx('flex size-11 shrink-0 items-center justify-center rounded-full text-2xl font-bold', VERDICT[state].dot)}>
        {VERDICT[state].symbol}
      </span>
      <span>
        <b className="block text-[24px] leading-7 font-bold">{title}</b>
        {detail && <span className="block text-lg leading-6">{detail}</span>}
      </span>
    </div>
  )
}

function Criteria({ place, themes }: { place: Place; themes: readonly Theme[] }) {
  return themes.map(theme => {
    // « Place handicapée » sous le titre « Place handicapée » n'apprendrait rien.
    const lines = place.lines.filter(line => line.theme === theme && line.text !== place.name)
    if (lines.length === 0) return null
    return (
      <section key={theme} className="flex shrink-0 flex-col gap-2">
        {/* Un seul thème (une place handicapée) : le titre n'apprendrait rien. */}
        {place.type !== 'parking' && <h3 className="px-1 pt-1 text-lg font-bold text-muted">{theme}</h3>}
        {lines.map(line => (
          <div key={line.text} className="flex items-center gap-3.5 rounded-[18px] bg-white px-3.5 py-3 text-[21px] font-semibold">
            <span aria-hidden className={clsx('flex size-9.5 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white', DOT[line.answer].cssClass)}>
              {DOT[line.answer].symbol}
            </span>
            <span>
              <span className="sr-only">{DOT[line.answer].word} : </span>
              {line.text}
              {line.detail && <small className="block text-lg font-normal">{line.detail}</small>}
            </span>
          </div>
        ))}
      </section>
    )
  })
}

/** Les détails, repliés : un lieu change, ils se replient (la clé du composant suit le lieu). */
function Details({ place }: { place: Place }) {
  const [expanded, setExpanded] = useState(false)
  const themes = THEMES.filter(theme => !ESSENTIALS.includes(theme) && place.lines.some(line => line.theme === theme))
  if (themes.length === 0) return null
  if (!expanded) {
    return (
      <Button variant="quiet" onClick={() => setExpanded(true)} aria-expanded={false}>
        Voir tous les détails
      </Button>
    )
  }
  return <Criteria place={place} themes={themes} />
}

type Props = {
  place: Place | null
  /** pendant un itinéraire, une place handicapée propose « Me garer ici » */
  towardArrival: boolean
  onClose: () => void
  onGoThere: (p: Place) => void
  onParkHere: (p: Place) => void
  onEdit: (p: Place) => void
}

export function PlaceCard({ place, towardArrival, onClose, onGoThere, onParkHere, onEdit }: Props) {
  const opened = place !== null
  const park = place?.type === 'parking' && towardArrival
  const { offset, swipe, gestures } = useSwipeToClose(onClose)
  const { ref } = useDialog<HTMLDivElement>(opened, onClose)

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={clsx('absolute inset-0 z-[1000] bg-ink/35 transition-opacity', !opened && 'pointer-events-none opacity-0')}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-card-title"
        tabIndex={-1}
        // Fermée, elle sort de l'écran mais reste dans la page : ni le clavier ni un lecteur d'écran ne doivent y entrer.
        inert={!opened}
        {...gestures}
        style={swipe ? { transform: `translateY(${offset}px)` } : undefined}
        className={clsx(
          // Toutes les infos d'un lieu dépassent souvent l'écran : la fiche défile, sans couvrir le haut.
          'absolute inset-x-0 bottom-0 z-[1001] flex max-h-[88dvh] flex-col gap-3 overflow-y-auto overscroll-contain rounded-t-[32px] bg-paper px-5.5 pt-3 lg:right-auto lg:w-[440px]',
          // Pas d'animation pendant que le doigt tire la fiche : elle doit suivre le doigt sans retard.
          !swipe && 'transition-transform duration-250 ease-out',
          !opened && 'translate-y-[105%]',
        )}
      >
        {/* La poignée dit qu'on peut glisser la fiche vers le bas ; « Fermer », en bas, fait pareil. */}
        <div aria-hidden className="mx-auto h-1.5 w-12 shrink-0 rounded-full bg-grey/50" />
        {place && (
          <>
            {place.name !== place.label && <div className="text-lg">{place.label}</div>}
            <h2 id="place-card-title" className="text-[32px] leading-[38px] font-bold tracking-tight">{place.name}</h2>
            <div className="text-[21px]">À {place.meters} mètres{towardArrival ? ' de l’arrivée' : ''}</div>
            {/* Une place n'a pas de verdict à donner : son titre dit déjà ce qu'elle est. */}
            {place.type !== 'parking' && <Verdict place={place} />}
            <Criteria place={place} themes={ESSENTIALS} />
            {place.advice && <p className="px-1 text-lg leading-6">{place.advice}</p>}
            <Details key={place.id} place={place} />
            {place.state === 'unknown' ? (
              <Button variant="outline" onClick={() => onEdit(place)}>
                Dire si c’est accessible
              </Button>
            ) : (
              <button onClick={() => onEdit(place)} className="self-center py-1 text-lg font-semibold text-moss underline underline-offset-4">
                Modifier ou compléter
              </button>
            )}
            <p className="text-lg text-muted">
              Source{place.sources.length > 1 ? 's' : ''} : {place.sources.join(' et ')}
            </p>
            {/* D'une seule main, le pouce n'atteint que le bas de l'écran : les deux actions y restent,
                même quand la fiche défile (docs/decisions/interface, D16). L'action principale à
                droite, comme dans toutes ses autres applis (D20). */}
            <div className="sticky bottom-0 -mx-5.5 mt-auto flex shrink-0 gap-2.5 bg-paper px-5.5 pt-3 pb-8">
              <Button variant="secondary" onClick={onClose} className="flex-1">Fermer</Button>
              <Button variant="primary" onClick={() => (park ? onParkHere(place) : onGoThere(place))} className="flex-[2]">
                {park ? 'Me garer ici' : 'Y aller'}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
