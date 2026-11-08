import type { Source } from '~/types/lieu.types'

type Props = {
  /** le titre de la liste, qui dit dans quel ordre elle est */
  titre: string
  aucunLieu: boolean
  termine: boolean
  enCours: Source[]
  enPanne: Source[]
  aucunVisible: boolean
  onReessayer: () => void
}

const ALERTE = 'mb-2.5 flex items-center gap-3 rounded-[22px] bg-ambre-clair px-4 py-3 text-lg text-ambre-fonce'

/** Titre de la liste et messages d'attente ou de panne des sources. */
export function MessagesChargement({ titre, aucunLieu, termine, enCours, enPanne, aucunVisible, onReessayer }: Props) {
  return (
    <>
      <h2 className="px-2 pb-2.5 text-lg font-semibold">
        {aucunLieu && !termine ? 'Je cherche les lieux autour…' : titre}
      </h2>
      {/* Annoncé par les lecteurs d'écran à chaque changement, sans couper ce qu'ils lisent. */}
      <div role="status">
        {enCours.includes('OpenStreetMap') && !aucunLieu && (
          <p className="mb-2.5 px-2 text-lg text-doux">Je cherche encore les cafés, restos et places…</p>
        )}
        {termine && enPanne.length === 0 && aucunVisible && (
          <p className="px-2 text-lg">Aucun lieu trouvé ici pour l’instant.</p>
        )}
      </div>
      {termine && enPanne.length > 0 && (
        <div role="alert" className={ALERTE}>
          <span className="flex-1">
            {enPanne.includes('OpenStreetMap')
              ? 'OpenStreetMap ne répond pas : il manque des cafés, des restos et les places handicapées.'
              : 'Le détail des toilettes n’a pas pu être chargé.'}
          </span>
          <button onClick={onReessayer} className="rounded-full bg-ambre-fonce px-4 py-2 font-semibold text-white">
            Réessayer
          </button>
        </div>
      )}
    </>
  )
}
