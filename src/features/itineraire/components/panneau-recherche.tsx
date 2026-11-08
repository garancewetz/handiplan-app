import { useEffect, useRef, useState } from 'react'
import { Icone } from '~/components/icone'
import type { Suggestion } from '~/features/itineraire/api/adresse.api'
import { BoutonMicro } from '~/features/itineraire/components/bouton-micro'
import { GroupePropositions, LigneProposition } from '~/features/itineraire/components/ligne-proposition'
import { useDictee } from '~/features/itineraire/hooks/use-dictee'
import { useSuggestions } from '~/features/itineraire/hooks/use-suggestions'
import { useZoneVisible } from '~/features/itineraire/hooks/use-zone-visible'
import { aProposer, type Destination } from '~/features/itineraire/utils/adresses-recentes.utils'
import { decouper, lieuxCorrespondants } from '~/features/itineraire/utils/recherche.utils'
import { useFenetre } from '~/hooks/use-fenetre'
import type { Arrivee, Lieu, Point } from '~/types/lieu.types'
import { distanceMetres } from '~/utils/distance.utils'

type Props = {
  lieux: Lieu[]
  recentes: Destination[]
  proche: Point | null
  onChoisir: (arrivee: Arrivee) => void
  onChoisirLieu: (lieu: Lieu) => void
  onChercher: (texte: string) => void
  onFermer: () => void
}

const cle = (d: Destination) => d.lieu?.id ?? `${d.lat},${d.lon}`

/**
 * Le panneau de recherche, une feuille qui monte du bas comme la fiche d'un lieu : le haut de la
 * carte reste visible, on sait qu'on n'a pas quitté l'appli. Le champ reste en bas, là où l'on vient
 * de toucher la barre, juste au-dessus du clavier ; les propositions, en grandes lignes, s'empilent
 * au-dessus (docs/decisions/interface, D19).
 */
export function PanneauRecherche({ lieux, recentes, proche, onChoisir, onChoisirLieu, onChercher, onFermer }: Props) {
  const [texte, setTexte] = useState('')
  const champ = useRef<HTMLInputElement>(null)
  // Rendu hors de l'appli (dans le corps de la page) : on rend l'appli inerte derrière, pour qu'un
  // lecteur d'écran ou le clavier ne s'y égare pas. Avant useFenetre : à la fermeture, l'appli
  // redevient active avant que le focus y revienne.
  useEffect(() => {
    const appli = document.getElementById('root')
    if (!appli) return
    appli.inert = true
    return () => { appli.inert = false }
  }, [])
  const { ref } = useFenetre<HTMLDivElement>(true, onFermer)
  const { zone } = useZoneVisible()
  const dictee = useDictee()
  const { suggestions, chargement } = useSuggestions(texte, proche)
  const vide = texte.trim() === ''
  const lieuxProposes = lieuxCorrespondants(lieux, texte)
  // Un lieu déjà chargé (qui ouvre sa fiche) et le même trouvé par la recherche : on ne le montre qu'une fois.
  const autresSuggestions = suggestions.filter(s => !lieuxProposes.some(l => distanceMetres(l, s) < 50))
  // Champ vide : comme Waze, on propose d'abord ce qu'on demande souvent, puis les dernières destinations.
  const { souvent, recentes: dernieres } = vide ? aProposer(recentes) : { souvent: [], recentes: [] }
  const nombre = souvent.length + dernieres.length + lieuxProposes.length + autresSuggestions.length

  // Le clavier s'ouvre tout de suite : on vient pour taper.
  useEffect(() => { champ.current?.focus() }, [])

  function choisir(action: () => void) {
    onFermer()
    action()
  }

  /** Un lieu déjà chargé rouvre sa fiche ; sinon, la carte va à l'endroit et le montre. */
  function rouvrir(d: Destination) {
    const lieu = d.lieu && lieux.find(l => l.id === d.lieu?.id)
    if (lieu) onChoisirLieu(lieu)
    else onChoisir(d)
  }

  const ligneDestination = (d: Destination, repere: 'etoile' | 'horloge') => {
    const { titre, detail } = d.lieu ? { titre: d.adresse, detail: d.lieu.libelle } : decouper(d.adresse)
    return (
      <LigneProposition
        key={cle(d)}
        titre={titre}
        detail={detail}
        icone={d.lieu ? d.lieu.type : repere}
        estLieu={d.lieu !== undefined}
        onChoisir={() => choisir(() => rouvrir(d))}
      />
    )
  }

  return (
    <div
      style={zone ? { top: zone.haut, height: zone.hauteur } : undefined}
      onClick={e => { if (e.target === e.currentTarget) onFermer() }}
      className="fixed inset-x-0 top-0 z-[1250] flex h-dvh flex-col justify-end bg-encre/30 lg:right-auto lg:w-[440px]"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Où allez-vous ?"
        tabIndex={-1}
        className="flex max-h-[calc(100%-56px)] flex-col rounded-t-[32px] bg-papier lg:shadow-2xl"
      >
        {/* Pour un lecteur d'écran : combien de propositions sont apparues, et quand le micro écoute. */}
        <p role="status" className="pour-lecteur">
          {dictee.ecoute ? 'Je vous écoute.' : nombre > 0 ? `${nombre} propositions` : ''}
        </p>

        {/* Les propositions s'empilent au-dessus du champ, au plus près du pouce. */}
        <div id="propositions" className="flex min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain px-4 pt-5 pb-2">
          {souvent.length > 0 && (
            <GroupePropositions id="groupe-souvent" titre="Souvent">{souvent.map(d => ligneDestination(d, 'etoile'))}</GroupePropositions>
          )}
          {dernieres.length > 0 && (
            <GroupePropositions id="groupe-recemment" titre="Récemment">{dernieres.map(d => ligneDestination(d, 'horloge'))}</GroupePropositions>
          )}
          {(lieuxProposes.length > 0 || autresSuggestions.length > 0) && (
            <ul aria-label="Propositions" className="flex flex-col gap-2">
              {lieuxProposes.map(l => (
                <LigneProposition key={l.id} titre={l.nom} detail={`${l.libelle} · à ${l.metres} m`} icone={l.type} estLieu onChoisir={() => choisir(() => onChoisirLieu(l))} />
              ))}
              {autresSuggestions.map(s => (
                <LigneProposition key={`${s.lat},${s.lon},${s.titre}`} titre={s.titre} detail={s.detail} onChoisir={() => choisir(() => onChoisir(s))} />
              ))}
            </ul>
          )}
          {chargement && suggestions.length === 0 && <p className="px-2 py-3 text-lg text-doux">Je cherche…</p>}
          {/* Un panneau tout vide ne dit pas quoi faire : au premier usage, une phrase et des exemples. */}
          {vide && recentes.length === 0 && (
            <p className="px-2 pb-1 text-xl leading-8">
              Écrivez une adresse ou le nom d’un lieu, comme « 12 rue de Rivoli », « hôpital Saint-Antoine » ou « Marlette ».
              {dictee.disponible && <span className="block text-doux">Ou touchez le micro pour le dire.</span>}
            </p>
          )}
        </div>

        <form
          className="flex shrink-0 items-center gap-2 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),14px)]"
          onSubmit={e => {
            e.preventDefault()
            // Entrée prend le premier de la liste, comme le doigt : le lieu proche s'il y en a un.
            const lieu: Lieu | undefined = lieuxProposes[0]
            const premiere: Suggestion | undefined = autresSuggestions[0]
            if (lieu) choisir(() => onChoisirLieu(lieu))
            else if (premiere) choisir(() => onChoisir(premiere))
            else if (texte.trim()) choisir(() => onChercher(texte.trim()))
          }}
        >
          {/* La flèche retour à gauche du champ, comme dans Google Maps et Waze (docs/decisions/interface, D22). */}
          <button type="button" onClick={onFermer} aria-label="Retour" className="flex size-15 shrink-0 items-center justify-center rounded-full text-encre">
            <Icone nom="retour" className="size-8" />
          </button>
          <div className="flex h-15 min-w-0 flex-1 items-center gap-2 rounded-full bg-white pr-1.5 pl-5 has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-3 has-[input:focus-visible]:outline-encre">
            <input
              ref={champ}
              value={texte}
              onChange={e => setTexte(e.target.value)}
              placeholder={dictee.ecoute ? 'Je vous écoute…' : 'Où allez-vous ?'}
              aria-label="Où allez-vous ?"
              aria-controls="propositions"
              enterKeyHint="search"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-xl outline-none placeholder:text-doux"
            />
            {texte ? (
              <button
                type="button"
                onClick={() => { setTexte(''); champ.current?.focus() }}
                aria-label="Effacer"
                className="flex size-12 shrink-0 items-center justify-center rounded-full text-encre"
              >
                <Icone nom="croix" className="size-6" />
              </button>
            ) : dictee.disponible && (
              <BoutonMicro ecoute={dictee.ecoute} onEcouter={() => dictee.ecouter(t => choisir(() => onChercher(t)))} />
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
