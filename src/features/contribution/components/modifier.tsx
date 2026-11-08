import { useState } from 'react'
import { Questionnaire } from '~/features/contribution/components/questionnaire'
import type { useCompteOsm } from '~/features/contribution/hooks/use-compte-osm'
import { useFenetre } from '~/hooks/use-fenetre'
import { PlacerPlace } from '~/features/contribution/components/placer-place'
import { lienModifierOsm, liensModification, type Lien } from '~/features/contribution/utils/liens-modification.utils'
import type { Lieu, Point } from '~/types/lieu.types'
import { Bouton } from '~/components/bouton'
import { classeBouton } from '~/constants/boutons.constants'

/** `connues` : les places handicapées déjà sur la carte, pour prévenir d'un doublon. */
export type Demande = { mode: 'place'; point: Point | null; connues: Point[] } | { mode: 'corriger'; lieu: Lieu }

type Props = {
  demande: Demande | null
  compte: ReturnType<typeof useCompteOsm>
  onFermer: () => void
}

/**
 * Dit où aller pour corriger ou compléter, puis ouvre la page. On modifie directement le lieu,
 * sur Acceslibre ou OpenStreetMap, avec son propre compte : pas de note anonyme à faire traiter
 * par des bénévoles (docs/decisions/signalement, D5).
 */
export function Modifier({ demande, compte, onFermer }: Props) {
  const { ref } = useFenetre<HTMLDivElement>(demande !== null, onFermer)
  const [questions, setQuestions] = useState(false)
  if (!demande) return null

  const fermer = () => { setQuestions(false); onFermer() }
  const liens: Lien[] = demande.mode === 'corriger' ? liensModification(demande.lieu) : []
  // Répondre dans l'appli : un lieu d'OpenStreetMap (pas une place : elle se place sur la carte),
  // une fois l'appli enregistrée sur OSM (docs/decisions/signalement, D7).
  const repondreIci = demande.mode === 'corriger' && compte.disponible && demande.lieu.type !== 'parking' && lienModifierOsm(demande.lieu) !== null

  return (
    <div className="fixed inset-0 z-[1300] flex flex-col justify-end bg-encre/40 lg:right-auto lg:w-[440px]" onClick={fermer}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modifier-titre"
        tabIndex={-1}
        className="flex max-h-[90dvh] flex-col gap-4 overflow-y-auto rounded-t-[32px] bg-papier px-5.5 pt-7 pb-10"
        onClick={e => e.stopPropagation()}
      >
        {demande.mode === 'corriger' && questions && compte.cle && compte.nom ? (
          <Questionnaire lieu={demande.lieu} cle={compte.cle} nom={compte.nom} onFermer={fermer} />
        ) : (<>
        <h2 id="modifier-titre" className="text-[28px] leading-[34px] font-bold">
          {demande.mode === 'place' ? 'Une place handicapée ici ?' : 'Modifier ou compléter'}
        </h2>
        {demande.mode === 'corriger' && <p className="text-lg">{demande.lieu.nom}</p>}

        {demande.mode === 'place' && demande.point ? (
          <>
            <PlacerPlace depart={demande.point} connues={demande.connues} compte={compte} onFermer={fermer} />
          </>
        ) : repondreIci ? (
          <>
            <p className="text-[21px] leading-7">Deux questions, sur ce que vous voyez. OpenStreetMap enregistre vos réponses.</p>
            {compte.cle && compte.nom ? (
              <Bouton variante="principal" onClick={() => setQuestions(true)}>
                Répondre aux questions
              </Bouton>
            ) : (
              <>
                <p className="text-lg text-doux">Il faut d’abord se connecter à OpenStreetMap (compte gratuit). Vos réponses seront signées de votre pseudo.</p>
                <Bouton variante="principal" onClick={compte.connecter}>
                  Se connecter à OpenStreetMap
                </Bouton>
              </>
            )}
            {compte.erreur && <p role="alert" className="text-lg text-non">{compte.erreur}</p>}
          </>
        ) : liens.length > 0 ? (
          <>
            <p className="text-[21px] leading-7">Ces infos viennent de cartes ouvertes : vous pouvez les corriger vous-même.</p>
            <p className="text-lg text-doux">Il faut un compte, gratuit. Vos modifications seront signées de votre pseudo.</p>
            {liens.map((lien, i) => (
              <a
                key={lien.url}
                href={lien.url}
                target="_blank"
                rel="noreferrer"
                onClick={fermer}
                className={i === 0
                  ? classeBouton('principal')
                  : 'self-center py-1 text-lg font-semibold text-mousse underline underline-offset-4'}
              >
                {lien.texte}
              </a>
            ))}
          </>
        ) : (
          <p className="text-[21px] leading-7">
            {demande.mode === 'place'
              ? 'Votre position est inconnue : autorisez la localisation pour ajouter une place.'
              : 'Ce lieu ne peut pas être modifié depuis l’appli.'}
          </p>
        )}

        {/* Ajouter une place a ses propres étapes et ses propres boutons. */}
        {!(demande.mode === 'place' && demande.point) && (
          <Bouton variante="secondaire" onClick={fermer}>Annuler</Bouton>
        )}
        </>)}
      </div>
    </div>
  )
}
