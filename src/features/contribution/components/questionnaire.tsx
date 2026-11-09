import { useEffect, useState } from 'react'
import { send, readElement } from '~/features/contribution/api/osm-edition.api'
import { TEST_SERVER } from '~/features/contribution/constants/osm.constants'
import type { OsmElement } from '~/features/contribution/utils/osmchange.utils'
import { changes, changesetComment, inWords, newTags, questionsFor, type Answers } from '~/features/contribution/utils/questions.utils'
import type { Place } from '~/types/place.types'
import { Button } from '~/components/button'

type Props = {
  place: Place
  /** la clé d'accès et le pseudo du compte OpenStreetMap connecté */
  osmToken: string
  name: string
  onClose: () => void
}

type Step = 'loading' | 'questions' | 'summary' | 'sending' | 'thanks' | 'error'

/**
 * Comme StreetComplete : une question à la fois, de grandes réponses (les valeurs du wiki), « Je ne
 * sais pas » qui n'écrit rien. Puis le résumé « la carte dit / vous dites » avant d'envoyer, signé
 * du pseudo de la personne (docs/bien-contribuer-a-osm.md).
 */
export function Questionnaire({ place, osmToken, name, onClose }: Props) {
  const questions = questionsFor(place.type)
  const [step, setStep] = useState<Step>('loading')
  const [element, setElement] = useState<OsmElement | null>(null)
  const [rank, setRank] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})

  useEffect(() => {
    readElement(place.id).then(e => { setElement(e); setStep('questions') }, () => setStep('error'))
  }, [place.id])

  function respond(osmKey: string, value: string | null) {
    const remaining = value === null ? answers : { ...answers, [osmKey]: value }
    setAnswers(remaining)
    if (rank + 1 < questions.length) setRank(rank + 1)
    else setStep('summary')
  }

  async function confirm() {
    if (!element) return
    setStep('sending')
    try {
      await send(osmToken, element, place, newTags(element.tags, answers, new Date()), changesetComment(answers, place.type))
      setStep('thanks')
    } catch {
      setStep('error')
    }
  }

  if (step === 'loading' || step === 'sending') {
    return <p role="status" className="py-6 text-center text-[22px] font-semibold">{step === 'sending' ? 'J’envoie…' : 'Un instant…'}</p>
  }

  if (step === 'error') {
    return (
      <>
        <h2 id="edit-title" className="text-[28px] leading-[34px] font-bold">Ça n’a pas marché</h2>
        <p role="alert" className="text-[21px] leading-7">Rien n’a été modifié. Vérifiez la connexion internet, puis réessayez.</p>
        <Button variant="primary" onClick={onClose}>Fermer</Button>
      </>
    )
  }

  if (step === 'thanks') {
    return (
      <>
        <h2 id="edit-title" className="text-[28px] leading-[34px] font-bold">C’est fait, merci !</h2>
        <p className="text-[21px] leading-7">
          {TEST_SERVER
            ? 'Essai réussi sur le serveur de test : la vraie carte n’a pas changé.'
            : 'La carte est à jour, pour tout le monde.'}
        </p>
        <Button variant="primary" onClick={onClose}>Fermer</Button>
      </>
    )
  }

  if (step === 'summary') {
    const list = changes(element?.tags ?? {}, answers)
    if (list.length === 0) {
      return (
        <>
          <h2 id="edit-title" className="text-[28px] leading-[34px] font-bold">Rien à envoyer</h2>
          <p className="text-[21px] leading-7">Vous n’avez répondu à aucune question : la carte reste comme elle est.</p>
          <Button variant="primary" onClick={onClose}>Fermer</Button>
        </>
      )
    }
    return (
      <>
        <p className="text-lg text-muted">{place.name}</p>
        <h2 id="edit-title" className="text-[28px] leading-[34px] font-bold">On modifie la carte ?</h2>
        {list.map(c => (
          <section key={c.key} className="flex shrink-0 flex-col gap-1.5 rounded-[20px] bg-white p-4">
            <h3 className="text-lg font-semibold text-muted">{c.key === 'wheelchair' && place.type !== 'wc' ? 'Entrée' : 'Toilettes'}</h3>
            {/* On n'écrase jamais sans le dire : ce que dit la carte, puis ce que dit la personne. */}
            {c.before !== undefined && c.before !== c.after && (
              <p className="text-[19px]">La carte dit : <b>{inWords(c.key, c.before)}</b></p>
            )}
            <p className="text-[19px]">
              {c.before === undefined ? 'Nouveau' : c.before === c.after ? 'Vous confirmez' : 'Vous dites'} :{' '}
              <b className="text-moss">{inWords(c.key, c.after)}</b>
            </p>
          </section>
        ))}
        <Button variant="primary" onClick={confirm}>Oui, modifier</Button>
        <Button variant="secondary" onClick={() => { setAnswers({}); setRank(0); setStep('questions') }}>Corriger</Button>
        <p className="text-lg text-muted">
          Signé {name} · visible par tous{TEST_SERVER ? ' · serveur de test, la vraie carte ne change pas' : ''}
        </p>
      </>
    )
  }

  const question = questions[rank]
  return (
    <>
      <p className="text-lg font-semibold text-muted">
        Question {rank + 1} sur {questions.length} · {place.name}
      </p>
      <h2 id="edit-title" className="text-[28px] leading-[34px] font-bold">{question.question}</h2>
      {question.help && <p className="text-lg text-muted">{question.help}</p>}
      <div className="flex flex-col gap-2.5">
        {question.choice.map(c => (
          <button
            key={`${c.key ?? question.key}=${c.value}`}
            onClick={() => respond(c.key ?? question.key, c.value)}
            className="flex shrink-0 flex-col items-start gap-0.5 rounded-[20px] border-2 border-ink/20 bg-white px-4 py-3.5 text-left"
          >
            <span className="text-[21px] font-bold">{c.title}</span>
            {c.help && <span className="text-lg text-muted">{c.help}</span>}
          </button>
        ))}
      </div>
      <Button variant="outline" onClick={() => respond(question.key, null)}>
        Je ne sais pas, passer
      </Button>
      <Button variant="secondary" onClick={onClose}>Annuler</Button>
    </>
  )
}
