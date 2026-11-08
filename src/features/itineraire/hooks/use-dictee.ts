import { useState } from 'react'

// Reconnaissance vocale du navigateur (Chrome, Safari) : parler est souvent plus simple que taper.
// Elle n'est pas encore dans les types du DOM : on décrit juste ce qu'on en utilise.
type Reconnaissance = {
  lang: string
  onresult: (e: { results: { 0: { 0: { transcript: string } } } }) => void
  onend: () => void
  start: () => void
}
type AvecReconnaissance = { SpeechRecognition?: new () => Reconnaissance; webkitSpeechRecognition?: new () => Reconnaissance }
const navigateur: AvecReconnaissance = window as Window & AvecReconnaissance
const ReconnaissanceVocale = navigateur.SpeechRecognition ?? navigateur.webkitSpeechRecognition

/** Dicter une adresse : `ecoute` reste vrai tant que le micro écoute. */
export function useDictee() {
  const [ecoute, setEcoute] = useState(false)

  function ecouter(onTexte: (texte: string) => void) {
    if (!ReconnaissanceVocale) return
    const r = new ReconnaissanceVocale()
    r.lang = 'fr-FR'
    r.onresult = e => onTexte(e.results[0][0].transcript)
    r.onend = () => setEcoute(false)
    setEcoute(true)
    r.start()
  }

  return { disponible: ReconnaissanceVocale !== undefined, ecoute, ecouter }
}
