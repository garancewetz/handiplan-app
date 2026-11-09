import { useState } from 'react'
import { ThumbBar } from '~/app/thumb-bar'
import { PlacesColumn } from '~/app/places-column'
import { PlacesMap } from '~/features/map/components/map'
import { useMapView } from '~/features/map/hooks/use-map-view'
import { Edit, type Request } from '~/features/contribution/components/edit'
import { useOsmAccount } from '~/features/contribution/hooks/use-osm-account'
import { searchAddress } from '~/features/itinerary/api/address.api'
import { RouteCard } from '~/features/itinerary/components/route-card'
import { useDestinations } from '~/features/itinerary/hooks/use-destinations'
import { useRoute } from '~/features/itinerary/hooks/use-route'
import { preferredApp, openGps } from '~/features/itinerary/utils/gps.utils'
import { PlaceCard } from '~/features/places/components/place-card'
import { FILTERS, matches, type Filter } from '~/features/places/constants/filters.constants'
import { usePlaces } from '~/features/places/hooks/use-places'
import { inArea } from '~/features/places/utils/nearby.utils'
import { Sources } from '~/features/sources/components/sources'
import { usePosition } from '~/hooks/use-position'
import type { Arrival, Place } from '~/types/place.types'

// Une liste trop longue fatigue : on montre les plus utiles, et le reste à la demande.
const PER_PAGE = 8

/**
 * L'appli : assemble les fonctionnalités et garde ce qui les relie (où l'on va, le lieu ouvert).
 * Téléphone, d'une seule main : la carte en haut (elle se regarde), la liste au milieu, et tout ce
 * qui se touche souvent dans une barre en bas, sous le pouce (docs/decisions/interface, D16).
 * Ordinateur : liste et barre à gauche, grande carte à droite.
 */
export function App() {
  const { here, position, refused } = usePosition()
  const realPosition = refused ? null : position
  const [arrival, setArrival] = useState<Arrival | null>(null)
  const [chosenSpot, setChosenSpot] = useState<Place | null>(null)
  const [filter, setFilter] = useState<Filter>(FILTERS[0])
  const [shownCount, setShownCount] = useState(PER_PAGE)
  const [openPlace, setOpenPlace] = useState<Place | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [request, setRequest] = useState<Request | null>(null)
  const account = useOsmAccount()
  const destinations = useDestinations()
  const route = useRoute(realPosition)

  const center = arrival ?? position
  const view = useMapView(center)
  const { places, inFlight, down, finished, retry } = usePlaces(view.loadAround, arrival ?? realPosition)
  const visiblePlaces = places.filter(p => matches(p.type, filter))
  const inList = view.loadAround ? inArea(visiblePlaces, view.loadAround) : visiblePlaces

  /** Revenir autour de soi. Pendant un trajet, on garde le chemin : la carte le recadre. */
  function backHere() {
    view.forget()
    if (route.toward) return
    setArrival(null)
    setChosenSpot(null)
    setShownCount(PER_PAGE)
  }

  function chooseArrival(destination: Arrival) {
    setError(null)
    setChosenSpot(null)
    view.forget()
    setShownCount(PER_PAGE)
    route.close()
    setArrival(destination)
    destinations.remember(destination)
  }

  async function search(text: string) {
    setError(null)
    try {
      const found = await searchAddress(text, position)
      if (found) chooseArrival(found)
      else setError('Je n’ai pas trouvé cette adresse.')
    } catch {
      setError('La recherche d’adresse ne répond pas.')
    }
  }

  function cancelRoute() {
    view.forget()
    setArrival(null)
    setChosenSpot(null)
    setShownCount(PER_PAGE)
    route.close()
  }

  function openSearchedPlace(place: Place) {
    destinations.rememberPlace(place)
    setOpenPlace(place)
  }

  function goTo(place: Place) {
    setOpenPlace(null)
    if (!destinations.justRemembered(place)) destinations.rememberPlace(place)
    route.goTo(place)
  }

  /**
   * La place choisie : l'appli de guidage s'ouvre tout de suite, sans étape de plus. La première fois
   * seulement, le trajet s'affiche pour choisir l'appli (Waze, Google Maps…). La place n'entre pas
   * dans « Récemment » : la destination, c'est l'adresse (docs/decisions/interface, D23).
   */
  function parkHere(spot: Place) {
    setOpenPlace(null)
    setChosenSpot(spot)
    const app = preferredApp()
    if (app) openGps(spot, 'car', app)
    else route.goTo(spot)
  }

  const barText = arrival
    ? chosenSpot ? `Garé à ${chosenSpot.meters} m de l’arrivée` : arrival.address
    : null

  return (
    <div className="relative mx-auto grid h-dvh max-w-[480px] grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-clip bg-paper lg:max-w-none lg:grid-cols-[440px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)_auto]">
      <h1 className="sr-only">Handiplan : cafés et restaurants faciles d’accès, et places handicapées</h1>

      {/* La carte reste toujours visible ; seule la liste en dessous défile. */}
      <div role="region" aria-label="Carte des lieux" className="relative mx-4 mt-[max(env(safe-area-inset-top),16px)] h-[clamp(240px,40dvh,340px)] overflow-hidden rounded-[28px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:m-0 lg:h-full lg:rounded-none">
        {center && (
          <PlacesMap
            center={center}
            towardArrival={arrival !== null}
            // Trop dézoomée, la carte ferait un tas illisible de pastilles : elle se tait, comme la liste.
            places={view.zoomedOut ? [] : visiblePlaces}
            chosenSpot={chosenSpot}
            trace={route.route?.trace ?? null}
            here={here}
            frozen={view.frozen}
            onChoose={setOpenPlace}
            onGesture={view.gesture}
            onMoved={view.move}
          />
        )}
        {refused && !arrival && (
          <div role="status" className="absolute inset-x-3 top-3 z-[500] rounded-2xl bg-white/95 px-4 py-2 text-lg">
            Position inconnue : la carte montre Paris.
          </div>
        )}
      </div>

      <PlacesColumn
        route={route.toward && <RouteCard place={route.toward} route={route.route} failure={route.failure} onClose={route.close} />}
        error={error}
        onCloseError={() => setError(null)}
        zoomedOut={view.zoomedOut}
        status={{
          // Des places se comparent à leur distance ; des cafés, d'abord à leur facilité.
          title: filter.id === 'park' ? (arrival ? 'Les plus proches de l’arrivée' : 'Les plus proches') : 'Les plus faciles d’abord',
          noPlace: (view.loadAround ? inArea(places, view.loadAround) : places).length === 0,
          finished,
          inFlight,
          down,
          noneVisible: inList.length === 0,
          onRetry: retry,
        }}
        places={inList}
        shownCount={shownCount}
        onShowMore={() => setShownCount(n => n + PER_PAGE)}
        onChoose={setOpenPlace}
        onAddSpot={() => setRequest({ mode: 'spot', point: realPosition, known: places.filter(p => p.type === 'parking') })}
        onInfo={() => setSourcesOpen(true)}
      />

      <ThumbBar
        filters={{ active: filter, onChange: f => { setFilter(f); setShownCount(PER_PAGE) } }}
        search={{
          inFlight: barText,
          places,
          recent: destinations.recent,
          near: position,
          onChoose: chooseArrival,
          onChoosePlace: openSearchedPlace,
          onSearch: search,
          onCancel: cancelRoute,
        }}
        onMyPosition={realPosition ? backHere : undefined}
      />

      <Edit request={request} account={account} onClose={() => setRequest(null)} />
      <Sources opened={sourcesOpen} onClose={() => setSourcesOpen(false)} />
      <PlaceCard
        place={openPlace}
        towardArrival={arrival !== null}
        onClose={() => setOpenPlace(null)}
        onGoThere={goTo}
        onParkHere={parkHere}
        onEdit={p => { setOpenPlace(null); setRequest({ mode: 'edit', place: p }) }}
      />
    </div>
  )
}
