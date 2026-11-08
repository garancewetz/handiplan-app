import { useEffect, useState } from 'react'
import { envoyer, lireElement } from '~/features/contribution/api/osm-edition.api'
import { SERVEUR_DE_TEST } from '~/features/contribution/constants/osm.constants'
import type { ElementOsm } from '~/features/contribution/utils/osmchange.utils'
import { changements, commentaire, enMots, nouvellesEtiquettes, questionsPour, type Reponses } from '~/features/contribution/utils/questions.utils'
import type { Lieu } from '~/types/lieu.types'
import { Bouton } from '~/components/bouton'

type Props = {
  lieu: Lieu
  /** la clé d'accès et le pseudo du compte OpenStreetMap connecté */
  cle: string
  nom: string
  onFermer: () => void
}

type Etape = 'chargement' | 'questions' | 'resume' | 'envoi' | 'merci' | 'erreur'

/**
 * Comme StreetComplete : une question à la fois, de grandes réponses (les valeurs du wiki), « Je ne
 * sais pas » qui n'écrit rien. Puis le résumé « la carte dit / vous dites » avant d'envoyer, signé
 * du pseudo de la personne (docs/bien-contribuer-a-osm.md).
 */
export function Questionnaire({ lieu, cle, nom, onFermer }: Props) {
  const questions = questionsPour(lieu.type)
  const [etape, setEtape] = useState<Etape>('chargement')
  const [element, setElement] = useState<ElementOsm | null>(null)
  const [rang, setRang] = useState(0)
  const [reponses, setReponses] = useState<Reponses>({})

  useEffect(() => {
    lireElement(lieu.id).then(e => { setElement(e); setEtape('questions') }, () => setEtape('erreur'))
  }, [lieu.id])

  function repondre(cleOsm: string, valeur: string | null) {
    const suite = valeur === null ? reponses : { ...reponses, [cleOsm]: valeur }
    setReponses(suite)
    if (rang + 1 < questions.length) setRang(rang + 1)
    else setEtape('resume')
  }

  async function confirmer() {
    if (!element) return
    setEtape('envoi')
    try {
      await envoyer(cle, element, lieu, nouvellesEtiquettes(element.tags, reponses, new Date()), commentaire(reponses, lieu.type))
      setEtape('merci')
    } catch {
      setEtape('erreur')
    }
  }

  if (etape === 'chargement' || etape === 'envoi') {
    return <p role="status" className="py-6 text-center text-[22px] font-semibold">{etape === 'envoi' ? 'J’envoie…' : 'Un instant…'}</p>
  }

  if (etape === 'erreur') {
    return (
      <>
        <h2 id="modifier-titre" className="text-[28px] leading-[34px] font-bold">Ça n’a pas marché</h2>
        <p role="alert" className="text-[21px] leading-7">Rien n’a été modifié. Vérifiez la connexion internet, puis réessayez.</p>
        <Bouton variante="principal" onClick={onFermer}>Fermer</Bouton>
      </>
    )
  }

  if (etape === 'merci') {
    return (
      <>
        <h2 id="modifier-titre" className="text-[28px] leading-[34px] font-bold">C’est fait, merci !</h2>
        <p className="text-[21px] leading-7">
          {SERVEUR_DE_TEST
            ? 'Essai réussi sur le serveur de test : la vraie carte n’a pas changé.'
            : 'La carte est à jour, pour tout le monde.'}
        </p>
        <Bouton variante="principal" onClick={onFermer}>Fermer</Bouton>
      </>
    )
  }

  if (etape === 'resume') {
    const liste = changements(element?.tags ?? {}, reponses)
    if (liste.length === 0) {
      return (
        <>
          <h2 id="modifier-titre" className="text-[28px] leading-[34px] font-bold">Rien à envoyer</h2>
          <p className="text-[21px] leading-7">Vous n’avez répondu à aucune question : la carte reste comme elle est.</p>
          <Bouton variante="principal" onClick={onFermer}>Fermer</Bouton>
        </>
      )
    }
    return (
      <>
        <p className="text-lg text-doux">{lieu.nom}</p>
        <h2 id="modifier-titre" className="text-[28px] leading-[34px] font-bold">On modifie la carte ?</h2>
        {liste.map(c => (
          <section key={c.cle} className="flex shrink-0 flex-col gap-1.5 rounded-[20px] bg-white p-4">
            <h3 className="text-lg font-semibold text-doux">{c.cle === 'wheelchair' && lieu.type !== 'wc' ? 'Entrée' : 'Toilettes'}</h3>
            {/* On n'écrase jamais sans le dire : ce que dit la carte, puis ce que dit la personne. */}
            {c.avant !== undefined && c.avant !== c.apres && (
              <p className="text-[19px]">La carte dit : <b>{enMots(c.cle, c.avant)}</b></p>
            )}
            <p className="text-[19px]">
              {c.avant === undefined ? 'Nouveau' : c.avant === c.apres ? 'Vous confirmez' : 'Vous dites'} :{' '}
              <b className="text-mousse">{enMots(c.cle, c.apres)}</b>
            </p>
          </section>
        ))}
        <Bouton variante="principal" onClick={confirmer}>Oui, modifier</Bouton>
        <Bouton variante="secondaire" onClick={() => { setReponses({}); setRang(0); setEtape('questions') }}>Corriger</Bouton>
        <p className="text-lg text-doux">
          Signé {nom} · visible par tous{SERVEUR_DE_TEST ? ' · serveur de test, la vraie carte ne change pas' : ''}
        </p>
      </>
    )
  }

  const question = questions[rang]
  return (
    <>
      <p className="text-lg font-semibold text-doux">
        Question {rang + 1} sur {questions.length} · {lieu.nom}
      </p>
      <h2 id="modifier-titre" className="text-[28px] leading-[34px] font-bold">{question.question}</h2>
      {question.aide && <p className="text-lg text-doux">{question.aide}</p>}
      <div className="flex flex-col gap-2.5">
        {question.choix.map(c => (
          <button
            key={c.valeur}
            onClick={() => repondre(question.cle, c.valeur)}
            className="flex shrink-0 flex-col items-start gap-0.5 rounded-[20px] border-2 border-encre/20 bg-white px-4 py-3.5 text-left"
          >
            <span className="text-[21px] font-bold">{c.titre}</span>
            {c.aide && <span className="text-lg text-doux">{c.aide}</span>}
          </button>
        ))}
      </div>
      <Bouton variante="contour" onClick={() => repondre(question.cle, null)}>
        Je ne sais pas, passer
      </Bouton>
      <Bouton variante="secondaire" onClick={onFermer}>Annuler</Bouton>
    </>
  )
}
