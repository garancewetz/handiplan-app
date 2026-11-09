import { useState } from 'react'
import { Questionnaire } from '~/features/contribution/components/questionnaire'
import type { useOsmAccount } from '~/features/contribution/hooks/use-osm-account'
import { useDialog } from '~/hooks/use-dialog'
import { SpotPlacer } from '~/features/contribution/components/place-parking'
import { osmEditLink, editLinks, type Link } from '~/features/contribution/utils/edit-links.utils'
import type { Place, Point } from '~/types/place.types'
import { Button } from '~/components/button'
import { buttonClass } from '~/constants/buttons.constants'

/** `connues` : les places handicapées déjà sur la carte, pour prévenir d'un doublon. */
export type Request = { mode: 'spot'; point: Point | null; known: Point[] } | { mode: 'edit'; place: Place }

type Props = {
  request: Request | null
  account: ReturnType<typeof useOsmAccount>
  onClose: () => void
}

/**
 * Dit où aller pour corriger ou compléter, puis ouvre la page. On modifie directement le lieu,
 * sur Acceslibre ou OpenStreetMap, avec son propre compte : pas de note anonyme à faire traiter
 * par des bénévoles (docs/decisions/signalement, D5).
 */
export function Edit({ request, account, onClose }: Props) {
  const { ref } = useDialog<HTMLDivElement>(request !== null, onClose)
  const [questions, setQuestions] = useState(false)
  if (!request) return null

  const close = () => { setQuestions(false); onClose() }
  const links: Link[] = request.mode === 'edit' ? editLinks(request.place) : []
  // Répondre dans l'appli : un lieu d'OpenStreetMap (pas une place : elle se place sur la carte),
  // une fois l'appli enregistrée sur OSM (docs/decisions/signalement, D7).
  const answerHere = request.mode === 'edit' && account.available && request.place.type !== 'parking' && osmEditLink(request.place) !== null

  return (
    <div className="fixed inset-0 z-[1300] flex flex-col justify-end bg-ink/40 lg:right-auto lg:w-[440px]" onClick={close}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-title"
        tabIndex={-1}
        className="flex max-h-[90dvh] flex-col gap-4 overflow-y-auto rounded-t-[32px] bg-paper px-5.5 pt-7 pb-10"
        onClick={e => e.stopPropagation()}
      >
        {request.mode === 'edit' && questions && account.osmToken && account.name ? (
          <Questionnaire place={request.place} osmToken={account.osmToken} name={account.name} onClose={close} />
        ) : (<>
        <h2 id="edit-title" className="text-[28px] leading-[34px] font-bold">
          {request.mode === 'spot' ? 'Une place handicapée ici ?' : 'Modifier ou compléter'}
        </h2>
        {request.mode === 'edit' && <p className="text-lg">{request.place.name}</p>}

        {request.mode === 'spot' && request.point ? (
          <>
            <SpotPlacer departure={request.point} known={request.known} account={account} onClose={close} />
          </>
        ) : answerHere ? (
          <>
            <p className="text-[21px] leading-7">Deux questions, sur ce que vous voyez. OpenStreetMap enregistre vos réponses.</p>
            {account.osmToken && account.name ? (
              <Button variant="primary" onClick={() => setQuestions(true)}>
                Répondre aux questions
              </Button>
            ) : (
              <>
                <p className="text-lg text-muted">Il faut d’abord se connecter à OpenStreetMap (compte gratuit). Vos réponses seront signées de votre pseudo.</p>
                <Button variant="primary" onClick={account.signIn}>
                  Se connecter à OpenStreetMap
                </Button>
              </>
            )}
            {account.error && <p role="alert" className="text-lg text-difficult">{account.error}</p>}
          </>
        ) : links.length > 0 ? (
          <>
            <p className="text-[21px] leading-7">Ces infos viennent de cartes ouvertes : vous pouvez les corriger vous-même.</p>
            <p className="text-lg text-muted">Il faut un compte, gratuit. Vos modifications seront signées de votre pseudo.</p>
            {links.map((link, i) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                onClick={close}
                className={i === 0
                  ? buttonClass('primary')
                  : 'self-center py-1 text-lg font-semibold text-moss underline underline-offset-4'}
              >
                {link.text}
              </a>
            ))}
          </>
        ) : (
          <p className="text-[21px] leading-7">
            {request.mode === 'spot'
              ? 'Votre position est inconnue : autorisez la localisation pour ajouter une place.'
              : 'Ce lieu ne peut pas être modifié depuis l’appli.'}
          </p>
        )}

        {/* Ajouter une place a ses propres étapes et ses propres boutons. */}
        {!(request.mode === 'spot' && request.point) && (
          <Button variant="secondary" onClick={close}>Annuler</Button>
        )}
        </>)}
      </div>
    </div>
  )
}
