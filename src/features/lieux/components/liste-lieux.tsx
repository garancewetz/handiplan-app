import clsx from 'clsx'
import { Icone } from '~/components/icone'
import type { Etat, Lieu } from '~/types/lieu.types'
import { formaterDistance } from '~/utils/format.utils'

// Les mots de la légende : « est-ce galère d'y aller ? » (docs/decisions/interface, D18).
const ETIQUETTE: Record<Etat, string> = { ok: 'Facile, toilettes adaptées', verifier: 'Attention', inconnu: 'Pas d’info', non: 'Difficile', parking: 'Place handicapée' }

const STYLE_ICONE: Record<Etat, string> = {
  ok: 'bg-mousse-clair text-mousse',
  verifier: 'bg-ambre-clair text-ambre-fonce',
  inconnu: 'border-2 border-dashed border-gris bg-white text-gris',
  non: 'bg-non-clair text-non',
  parking: 'bg-place text-white',
}
// L'état se lit en mots, avec un symbole : jamais la couleur seule.
const STATUT: Record<Etat, { symbole: string; rond: string; texte: string }> = {
  ok: { symbole: '✓', rond: 'bg-mousse', texte: 'text-mousse' },
  verifier: { symbole: '!', rond: 'bg-ambre', texte: 'text-ambre-fonce' },
  inconnu: { symbole: '?', rond: 'bg-gris', texte: 'text-gris' },
  non: { symbole: '✕', rond: 'bg-non', texte: 'text-non' },
  parking: { symbole: 'P', rond: 'bg-place', texte: 'text-place' },
}

// Après les plus faciles : difficiles et sans info ensemble, du plus proche au plus loin, sous un seul titre.
const EN_BAS: Etat[] = ['non', 'inconnu']

export function Liste({ lieux, onChoisir }: { lieux: Lieu[]; onChoisir: (l: Lieu) => void }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {lieux.map((l, i) => (
        <li key={l.id}>
          {EN_BAS.includes(l.etat) && !EN_BAS.includes(lieux[i - 1]?.etat) && (
            <h3 className="px-2 pt-3 pb-2.5 text-lg font-semibold">Difficiles ou sans info, par distance</h3>
          )}
          <button
            onClick={() => onChoisir(l)}
            className="flex w-full flex-col gap-2.5 rounded-[22px] bg-white p-3.5 text-left"
          >
            {/* L'icône, puis le nom avec la distance dessous : le nom a toute la largeur et se coupe rarement. */}
            <span className="flex items-center gap-3.5">
              <span aria-hidden className={clsx('flex size-13 shrink-0 items-center justify-center rounded-[18px]', STYLE_ICONE[l.etat])}>
                <Icone nom={l.type} className="size-8" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <b className="line-clamp-2 text-[22px] leading-[27px] font-semibold">{l.nom}</b>
                <span className="text-xl leading-7 text-doux"><span className="pour-lecteur">à </span>{formaterDistance(l.metres)}</span>
              </span>
            </span>
            {/* L'état dessous, sur toute la largeur de la carte : « Facile, toilettes adaptées » tient sur une ligne. */}
            {/* Une place s'appelle déjà « Place handicapée » : la redire n'apprendrait rien. */}
            {l.etat !== 'parking' && (
              <span className={clsx('flex items-center gap-2 text-lg font-semibold', STATUT[l.etat].texte)}>
                <span aria-hidden className={clsx('flex size-6.5 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white', STATUT[l.etat].rond)}>
                  {STATUT[l.etat].symbole}
                </span>
                {ETIQUETTE[l.etat]}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}
