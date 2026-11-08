import { useState } from 'react'
import clsx from 'clsx'
import { useFenetre } from '~/hooks/use-fenetre'
import { useGlisserPourFermer } from '~/hooks/use-glisser-pour-fermer'
import { verdict } from '~/features/lieux/utils/verdict.utils'
import { THEMES, type Etat, type Lieu, type Reponse, type Theme } from '~/types/lieu.types'
import { Bouton } from '~/components/bouton'

// Le verdict, en couleur et en mots : le symbole répète la couleur, pour qui la distingue mal.
const VERDICT: Record<Etat, { bloc: string; rond: string; symbole: string }> = {
  ok: { bloc: 'bg-mousse text-white', rond: 'bg-white text-mousse', symbole: '✓' },
  verifier: { bloc: 'bg-ambre-clair text-ambre-fonce', rond: 'bg-ambre text-white', symbole: '!' },
  non: { bloc: 'bg-non-clair text-encre', rond: 'bg-non text-white', symbole: '✕' },
  inconnu: { bloc: 'border-2 border-dashed border-gris bg-white text-encre', rond: 'bg-gris text-white', symbole: '?' },
  parking: { bloc: 'bg-place-clair text-place', rond: 'bg-place text-white', symbole: 'P' },
}
// Le symbole se voit, le mot se lit : un lecteur d'écran dit « Oui : Accessible en fauteuil ».
const ROND: Record<Reponse, { classe: string; symbole: string; mot: string }> = {
  oui: { classe: 'bg-mousse', symbole: '✓', mot: 'Oui' },
  attention: { classe: 'bg-ambre', symbole: '!', mot: 'Attention' },
  non: { classe: 'bg-non', symbole: '✕', mot: 'Non' },
  info: { classe: 'bg-gris', symbole: 'i', mot: 'À savoir' },
}

// Ce qui décide si l'on peut y aller ; le reste attend derrière « Voir tous les détails », pour ne pas
// noyer l'essentiel (docs/decisions/interface, D15).
const ESSENTIELS: Theme[] = ['Se garer', 'Entrée', 'Toilettes']

/** D'abord la réponse : peut-on y aller ? Puis, dessous, le détail de chaque critère. */
function Verdict({ lieu }: { lieu: Lieu }) {
  const { etat, titre, detail } = verdict(lieu)
  return (
    <div className={clsx('flex shrink-0 items-center gap-3.5 rounded-[20px] px-4 py-3.5', VERDICT[etat].bloc)}>
      <span aria-hidden className={clsx('flex size-11 shrink-0 items-center justify-center rounded-full text-2xl font-bold', VERDICT[etat].rond)}>
        {VERDICT[etat].symbole}
      </span>
      <span>
        <b className="block text-[24px] leading-7 font-bold">{titre}</b>
        {detail && <span className="block text-lg leading-6">{detail}</span>}
      </span>
    </div>
  )
}

function Criteres({ lieu, themes }: { lieu: Lieu; themes: readonly Theme[] }) {
  return themes.map(theme => {
    // « Place handicapée » sous le titre « Place handicapée » n'apprendrait rien.
    const lignes = lieu.lignes.filter(l => l.theme === theme && l.texte !== lieu.nom)
    if (lignes.length === 0) return null
    return (
      <section key={theme} className="flex shrink-0 flex-col gap-2">
        {/* Un seul thème (une place handicapée) : le titre n'apprendrait rien. */}
        {lieu.type !== 'parking' && <h3 className="px-1 pt-1 text-lg font-bold text-doux">{theme}</h3>}
        {lignes.map(ligne => (
          <div key={ligne.texte} className="flex items-center gap-3.5 rounded-[18px] bg-white px-3.5 py-3 text-[21px] font-semibold">
            <span aria-hidden className={clsx('flex size-9.5 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white', ROND[ligne.reponse].classe)}>
              {ROND[ligne.reponse].symbole}
            </span>
            <span>
              <span className="pour-lecteur">{ROND[ligne.reponse].mot} : </span>
              {ligne.texte}
              {ligne.detail && <small className="block text-lg font-normal">{ligne.detail}</small>}
            </span>
          </div>
        ))}
      </section>
    )
  })
}

/** Les détails, repliés : un lieu change, ils se replient (la clé du composant suit le lieu). */
function Details({ lieu }: { lieu: Lieu }) {
  const [ouverts, setOuverts] = useState(false)
  const themes = THEMES.filter(t => !ESSENTIELS.includes(t) && lieu.lignes.some(l => l.theme === t))
  if (themes.length === 0) return null
  if (!ouverts) {
    return (
      <Bouton variante="discret" onClick={() => setOuverts(true)} aria-expanded={false}>
        Voir tous les détails
      </Bouton>
    )
  }
  return <Criteres lieu={lieu} themes={themes} />
}

type Props = {
  lieu: Lieu | null
  /** pendant un itinéraire, une place handicapée propose « Me garer ici » */
  versArrivee: boolean
  onFermer: () => void
  onYAller: (l: Lieu) => void
  onGarerIci: (l: Lieu) => void
  onCorriger: (l: Lieu) => void
}

export function Fiche({ lieu, versArrivee, onFermer, onYAller, onGarerIci, onCorriger }: Props) {
  const ouverte = lieu !== null
  const garer = lieu?.type === 'parking' && versArrivee
  const { decalage, glisse, gestes } = useGlisserPourFermer(onFermer)
  const { ref } = useFenetre<HTMLDivElement>(ouverte, onFermer)

  return (
    <>
      <div
        aria-hidden
        onClick={onFermer}
        className={clsx('absolute inset-0 z-[1000] bg-encre/35 transition-opacity', !ouverte && 'pointer-events-none opacity-0')}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fiche-titre"
        tabIndex={-1}
        // Fermée, elle sort de l'écran mais reste dans la page : ni le clavier ni un lecteur d'écran ne doivent y entrer.
        inert={!ouverte}
        {...gestes}
        style={glisse ? { transform: `translateY(${decalage}px)` } : undefined}
        className={clsx(
          // Toutes les infos d'un lieu dépassent souvent l'écran : la fiche défile, sans couvrir le haut.
          'absolute inset-x-0 bottom-0 z-[1001] flex max-h-[88dvh] flex-col gap-3 overflow-y-auto overscroll-contain rounded-t-[32px] bg-papier px-5.5 pt-3 lg:right-auto lg:w-[440px]',
          // Pas d'animation pendant que le doigt tire la fiche : elle doit suivre le doigt sans retard.
          !glisse && 'transition-transform duration-250 ease-out',
          !ouverte && 'translate-y-[105%]',
        )}
      >
        {/* La poignée dit qu'on peut glisser la fiche vers le bas ; « Fermer », en bas, fait pareil. */}
        <div aria-hidden className="mx-auto h-1.5 w-12 shrink-0 rounded-full bg-gris/50" />
        {lieu && (
          <>
            {lieu.nom !== lieu.libelle && <div className="text-lg">{lieu.libelle}</div>}
            <h2 id="fiche-titre" className="text-[32px] leading-[38px] font-bold tracking-tight">{lieu.nom}</h2>
            <div className="text-[21px]">À {lieu.metres} mètres{versArrivee ? ' de l’arrivée' : ''}</div>
            {/* Une place n'a pas de verdict à donner : son titre dit déjà ce qu'elle est. */}
            {lieu.type !== 'parking' && <Verdict lieu={lieu} />}
            <Criteres lieu={lieu} themes={ESSENTIELS} />
            {lieu.conseil && <p className="px-1 text-lg leading-6">{lieu.conseil}</p>}
            <Details key={lieu.id} lieu={lieu} />
            {lieu.etat === 'inconnu' ? (
              <Bouton variante="contour" onClick={() => onCorriger(lieu)}>
                Dire si c’est accessible
              </Bouton>
            ) : (
              <button onClick={() => onCorriger(lieu)} className="self-center py-1 text-lg font-semibold text-mousse underline underline-offset-4">
                Modifier ou compléter
              </button>
            )}
            <p className="text-lg text-doux">
              Source{lieu.sources.length > 1 ? 's' : ''} : {lieu.sources.join(' et ')}
            </p>
            {/* D'une seule main, le pouce n'atteint que le bas de l'écran : les deux actions y restent,
                même quand la fiche défile (docs/decisions/interface, D16). L'action principale à
                droite, comme dans toutes ses autres applis (D20). */}
            <div className="sticky bottom-0 -mx-5.5 mt-auto flex shrink-0 gap-2.5 bg-papier px-5.5 pt-3 pb-8">
              <Bouton variante="secondaire" onClick={onFermer} className="flex-1">Fermer</Bouton>
              <Bouton variante="principal" onClick={() => (garer ? onGarerIci(lieu) : onYAller(lieu))} className="flex-[2]">
                {garer ? 'Me garer ici' : 'Y aller'}
              </Bouton>
            </div>
          </>
        )}
      </div>
    </>
  )
}
