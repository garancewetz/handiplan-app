import { useState } from 'react'
import { BarreDuPouce } from '~/app/barre-du-pouce'
import { ColonneLieux } from '~/app/colonne-lieux'
import { Carte } from '~/features/carte/components/carte'
import { useVueCarte } from '~/features/carte/hooks/use-vue-carte'
import { Modifier, type Demande } from '~/features/contribution/components/modifier'
import { useCompteOsm } from '~/features/contribution/hooks/use-compte-osm'
import { chercherAdresse } from '~/features/itineraire/api/adresse.api'
import { CarteTrajet } from '~/features/itineraire/components/carte-trajet'
import { useDestinations } from '~/features/itineraire/hooks/use-destinations'
import { useTrajet } from '~/features/itineraire/hooks/use-trajet'
import { appliPreferee, ouvrirGps } from '~/features/itineraire/utils/gps.utils'
import { Fiche } from '~/features/lieux/components/fiche-lieu'
import { FILTRES, correspond, type Filtre } from '~/features/lieux/constants/filtres.constants'
import { useLieux } from '~/features/lieux/hooks/use-lieux'
import { dansLaZone } from '~/features/lieux/utils/voisinage.utils'
import { Sources } from '~/features/sources/components/sources'
import { usePosition } from '~/hooks/use-position'
import type { Arrivee, Lieu } from '~/types/lieu.types'

// Une liste trop longue fatigue : on montre les plus utiles, et le reste à la demande.
const PAR_PAGE = 8

/**
 * L'appli : assemble les fonctionnalités et garde ce qui les relie (où l'on va, le lieu ouvert).
 * Téléphone, d'une seule main : la carte en haut (elle se regarde), la liste au milieu, et tout ce
 * qui se touche souvent dans une barre en bas, sous le pouce (docs/decisions/interface, D16).
 * Ordinateur : liste et barre à gauche, grande carte à droite.
 */
export function App() {
  const { ici, position, refusee } = usePosition()
  const positionReelle = refusee ? null : position
  const [arrivee, setArrivee] = useState<Arrivee | null>(null)
  const [placeChoisie, setPlaceChoisie] = useState<Lieu | null>(null)
  const [filtre, setFiltre] = useState<Filtre>(FILTRES[0])
  const [nbAffiches, setNbAffiches] = useState(PAR_PAGE)
  const [ouvert, setOuvert] = useState<Lieu | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [infos, setInfos] = useState(false)
  const [demande, setDemande] = useState<Demande | null>(null)
  const compte = useCompteOsm()
  const destinations = useDestinations()
  const trajet = useTrajet(positionReelle)

  const centre = arrivee ?? position
  const vue = useVueCarte(centre)
  const { lieux, enCours, enPanne, termine, reessayer } = useLieux(vue.chargerAutour, arrivee ?? positionReelle)
  const visibles = lieux.filter(l => correspond(l.type, filtre))
  const dansLaListe = vue.chargerAutour ? dansLaZone(visibles, vue.chargerAutour) : visibles

  /** Revenir autour de soi. Pendant un trajet, on garde le chemin : la carte le recadre. */
  function revenirIci() {
    vue.oublier()
    if (trajet.vers) return
    setArrivee(null)
    setPlaceChoisie(null)
    setNbAffiches(PAR_PAGE)
  }

  function choisirArrivee(choisie: Arrivee) {
    setErreur(null)
    setPlaceChoisie(null)
    vue.oublier()
    setNbAffiches(PAR_PAGE)
    trajet.fermer()
    setArrivee(choisie)
    destinations.retenir(choisie)
  }

  async function chercher(texte: string) {
    setErreur(null)
    try {
      const trouvee = await chercherAdresse(texte, position)
      if (trouvee) choisirArrivee(trouvee)
      else setErreur('Je n’ai pas trouvé cette adresse.')
    } catch {
      setErreur('La recherche d’adresse ne répond pas.')
    }
  }

  function annulerItineraire() {
    vue.oublier()
    setArrivee(null)
    setPlaceChoisie(null)
    setNbAffiches(PAR_PAGE)
    trajet.fermer()
  }

  function ouvrirLieuCherche(lieu: Lieu) {
    destinations.retenirLieu(lieu)
    setOuvert(lieu)
  }

  function allerVers(lieu: Lieu) {
    setOuvert(null)
    if (!destinations.vientDEtreRetenu(lieu)) destinations.retenirLieu(lieu)
    trajet.allerVers(lieu)
  }

  /**
   * La place choisie : l'appli de guidage s'ouvre tout de suite, sans étape de plus. La première fois
   * seulement, le trajet s'affiche pour choisir l'appli (Waze, Google Maps…). La place n'entre pas
   * dans « Récemment » : la destination, c'est l'adresse (docs/decisions/interface, D23).
   */
  function garerIci(place: Lieu) {
    setOuvert(null)
    setPlaceChoisie(place)
    const appli = appliPreferee()
    if (appli) ouvrirGps(place, 'voiture', appli)
    else trajet.allerVers(place)
  }

  const texteEnCours = arrivee
    ? placeChoisie ? `Garé à ${placeChoisie.metres} m de l’arrivée` : arrivee.adresse
    : null

  return (
    <div className="relative mx-auto grid h-dvh max-w-[480px] grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-clip bg-papier lg:max-w-none lg:grid-cols-[440px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)_auto]">
      <h1 className="pour-lecteur">Handiplan : cafés et restaurants faciles d’accès, et places handicapées</h1>

      {/* La carte reste toujours visible ; seule la liste en dessous défile. */}
      <div role="region" aria-label="Carte des lieux" className="relative mx-4 mt-[max(env(safe-area-inset-top),16px)] h-[clamp(240px,40dvh,340px)] overflow-hidden rounded-[28px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:m-0 lg:h-full lg:rounded-none">
        {centre && (
          <Carte
            centre={centre}
            versArrivee={arrivee !== null}
            // Trop dézoomée, la carte ferait un tas illisible de pastilles : elle se tait, comme la liste.
            lieux={vue.dezoomee ? [] : visibles}
            placeChoisie={placeChoisie}
            trace={trajet.trajet?.trace ?? null}
            ici={ici}
            figee={vue.figee}
            onChoisir={setOuvert}
            onGeste={vue.geste}
            onDeplacee={vue.deplacer}
          />
        )}
        {refusee && !arrivee && (
          <div role="status" className="absolute inset-x-3 top-3 z-[500] rounded-2xl bg-white/95 px-4 py-2 text-lg">
            Position inconnue : la carte montre Paris.
          </div>
        )}
      </div>

      <ColonneLieux
        trajet={trajet.vers && <CarteTrajet lieu={trajet.vers} trajet={trajet.trajet} echec={trajet.echec} onFermer={trajet.fermer} />}
        erreur={erreur}
        onFermerErreur={() => setErreur(null)}
        dezoomee={vue.dezoomee}
        messages={{
          // Des places se comparent à leur distance ; des cafés, d'abord à leur facilité.
          titre: filtre.id === 'garer' ? (arrivee ? 'Les plus proches de l’arrivée' : 'Les plus proches') : 'Les plus faciles d’abord',
          aucunLieu: (vue.chargerAutour ? dansLaZone(lieux, vue.chargerAutour) : lieux).length === 0,
          termine,
          enCours,
          enPanne,
          aucunVisible: dansLaListe.length === 0,
          onReessayer: reessayer,
        }}
        lieux={dansLaListe}
        nbAffiches={nbAffiches}
        onVoirPlus={() => setNbAffiches(n => n + PAR_PAGE)}
        onChoisir={setOuvert}
        onAjouterPlace={() => setDemande({ mode: 'place', point: positionReelle, connues: lieux.filter(l => l.type === 'parking') })}
        onInfos={() => setInfos(true)}
      />

      <BarreDuPouce
        filtres={{ actif: filtre, onChange: f => { setFiltre(f); setNbAffiches(PAR_PAGE) } }}
        recherche={{
          enCours: texteEnCours,
          lieux,
          recentes: destinations.recentes,
          proche: position,
          onChoisir: choisirArrivee,
          onChoisirLieu: ouvrirLieuCherche,
          onChercher: chercher,
          onAnnuler: annulerItineraire,
        }}
        onMaPosition={positionReelle ? revenirIci : undefined}
      />

      <Modifier demande={demande} compte={compte} onFermer={() => setDemande(null)} />
      <Sources ouverte={infos} onFermer={() => setInfos(false)} />
      <Fiche
        lieu={ouvert}
        versArrivee={arrivee !== null}
        onFermer={() => setOuvert(null)}
        onYAller={allerVers}
        onGarerIci={garerIci}
        onCorriger={l => { setOuvert(null); setDemande({ mode: 'corriger', lieu: l }) }}
      />
    </div>
  )
}
