import type { ReactNode } from 'react'
import { useFenetre } from '~/hooks/use-fenetre'
import { Bouton } from '~/components/bouton'

function Bloc({ titre, lien, children }: { titre: string; lien?: { texte: string; url: string }; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-[22px] bg-white p-4">
      <h3 className="text-[22px] leading-7 font-semibold">{titre}</h3>
      <div className="flex flex-col gap-2 text-lg leading-[26px]">{children}</div>
      {lien && (
        <a href={lien.url} target="_blank" rel="noreferrer" className="text-lg font-semibold text-mousse underline underline-offset-4">
          {lien.texte}
        </a>
      )}
    </section>
  )
}

/** Page d'information : d'où viennent les données, et leurs limites. */
export function Sources({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const { ref } = useFenetre<HTMLDivElement>(ouverte, onFermer)
  if (!ouverte) return null
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="sources-titre" tabIndex={-1} className="absolute inset-0 z-[1100] flex flex-col bg-papier lg:right-auto lg:w-[440px] lg:shadow-2xl">
      <header className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),24px)] pb-3">
        <h2 id="sources-titre" className="px-2 text-[28px] leading-[34px] font-bold tracking-tight">D’où viennent les infos</h2>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-8">
        {/* Le plus utile d'abord, en phrases courtes (FALC ; docs/decisions/interface, D21). */}
        <Bloc titre="Les couleurs">
          <p><b className="text-mousse">Vert, facile</b> : entrée sans marche et toilettes adaptées.</p>
          <p><b className="text-ambre-fonce">Orange, attention</b> : une partie va, une autre non, ou on ne sait pas tout.</p>
          <p><b className="text-non">Rouge, difficile</b> : une marche haute ou un escalier.</p>
          <p><b className="text-gris">Blanc à bord pointillé</b> : pas d’info.</p>
          <p><b className="text-place">Bleu avec un P</b> : place handicapée.</p>
          <p className="text-lg text-doux">Les infos décrivent l’accès en fauteuil. C’est un bon repère de ce qui sera facile.</p>
        </Bloc>

        <Bloc titre="À savoir">
          <p>Les infos sont données par des personnes. Elles peuvent manquer ou dater. En cas de doute, demandez sur place.</p>
          <p>Un lieu absent de la carte n’est pas forcément difficile : il n’est peut-être pas encore décrit.</p>
          <p>Votre position et vos destinations restent sur votre téléphone.</p>
        </Bloc>

        <Bloc titre="Acceslibre" lien={{ texte: 'Voir Acceslibre', url: 'https://acceslibre.beta.gouv.fr' }}>
          <p>La base de l’État sur l’accessibilité des lieux : entrée, marches, toilettes.</p>
          <p className="text-lg text-doux">Fichier national publié sur data.gouv.fr, Licence Ouverte.</p>
        </Bloc>

        <Bloc titre="OpenStreetMap" lien={{ texte: 'Voir OpenStreetMap', url: 'https://www.openstreetmap.org' }}>
          <p>La carte libre du monde, faite par ses habitants. Elle donne les lieux, les toilettes publiques et les places handicapées.</p>
          <p className="text-lg text-doux">© les contributeurs OpenStreetMap, licence ODbL.</p>
        </Bloc>

        <Bloc titre="Adresses et plan" lien={{ texte: 'Voir la Géoplateforme', url: 'https://geoservices.ign.fr' }}>
          <p>Les adresses viennent de la Base Adresse Nationale, les noms de lieux de Photon (OpenStreetMap), le plan de l’IGN.</p>
        </Bloc>

        <Bloc titre="Vous pouvez aider">
          <p>Dans la fiche d’un lieu, « Modifier ou compléter » : dire ce que vous voyez sur place.</p>
          <p>En bas de la liste, « Ajouter une place handicapée » : ajouter une place qui manque.</p>
          <p className="text-lg text-doux">Il faut un compte gratuit. Vos ajouts sont publics et signés de votre pseudo.</p>
        </Bloc>
      </div>
      {/* « Fermer » sous le pouce, comme partout (docs/decisions/interface, D16). */}
      <div className="shrink-0 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),14px)]">
        <Bouton variante="principal" onClick={onFermer} className="w-full">Fermer</Bouton>
      </div>
    </div>
  )
}