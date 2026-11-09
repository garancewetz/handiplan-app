import { useState } from 'react'

// Reconnaissance vocale du navigateur (Chrome, Safari) : parler est souvent plus simple que taper.
// Elle n'est pas encore dans les types du DOM : on décrit juste ce qu'on en utilise.
type Recognition = {
  lang: string
  onresult: (e: { results: { 0: { 0: { transcript: string } } } }) => void
  onend: () => void
  start: () => void
}
type WithRecognition = { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
const browser: WithRecognition = window as Window & WithRecognition
const SpeechRecognitionLike = browser.SpeechRecognition ?? browser.webkitSpeechRecognition

/** Dicter une adresse : `listening` reste vrai tant que le micro écoute. */
export function useDictation() {
  const [listening, setListening] = useState(false)

  function listen(onText: (text: string) => void) {
    if (!SpeechRecognitionLike) return
    const r = new SpeechRecognitionLike()
    r.lang = 'fr-FR'
    r.onresult = e => onText(e.results[0][0].transcript)
    r.onend = () => setListening(false)
    setListening(true)
    r.start()
  }

  return { available: SpeechRecognitionLike !== undefined, listening, listen }
}
