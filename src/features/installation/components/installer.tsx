import { useEffect, useState } from 'react'
import { useFenetre } from '~/hooks/use-fenetre'
import { Bouton } from '~/components/bouton'

type InvitationAndroid = Event & { prompt: () => Promise<void> }

const CLE_REFUS = 'installer-plus-tard'
const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
const dejaInstallee = window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true
const telephone = window.matchMedia('(pointer: coarse)').matches
// ?installer dans l'adresse : affiche la proposition même sur ordinateur (pour tester)
const force = new URLSearchParams(window.location.search).has('installer')

function refuseRecemment() {
  try {
    const quand = Number(localStorage.getItem(CLE_REFUS))
    return Date.now() - quand < 7 * 24 * 3600 * 1000
  } catch {
    return false
  }
}

const PARTAGER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/></svg>'

/** Propose d'installer l'appli sur l'écran d'accueil du téléphone, en une ou deux étapes simples. */
export function Installer() {
  const [android, setAndroid] = useState<InvitationAndroid | null>(null)
  const [visible, setVisible] = useState(force || (!dejaInstallee && telephone && ios && !refuseRecemment()))
  const [etapes, setEtapes] = useState(false)
  const { ref } = useFenetre<HTMLDivElement>(etapes, () => setEtapes(false))

  useEffect(() => {
    const quandProposee = (e: Event) => {
      // Sur ordinateur, on laisse le navigateur proposer l'installation à sa façon.
      if (dejaInstallee || !telephone) return
      e.preventDefault()
      setAndroid(e as InvitationAndroid)
      if (!refuseRecemment()) setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', quandProposee)
    return () => window.removeEventListener('beforeinstallprompt', quandProposee)
  }, [])

  function plusTard() {
    try { localStorage.setItem(CLE_REFUS, String(Date.now())) } catch { /* rien */ }
    setVisible(false)
  }

  async function installer() {
    if (android) {
      await android.prompt()
      setVisible(false)
    } else {
      setEtapes(true)
    }
  }

  if (!visible) return null

  return (
    <>
      <div className="mb-2.5 flex flex-col gap-3 rounded-[22px] bg-mousse p-4 text-white">
        <div className="flex items-center gap-3">
          <img src="/icone-192.png" alt="" className="size-13 shrink-0 rounded-[14px]" />
          <p className="text-xl leading-[26px] font-semibold">Mettre l’appli sur l’écran d’accueil ?</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={plusTard} className="h-14 flex-1 rounded-2xl border-2 border-white/70 text-lg font-semibold">
            Plus tard
          </button>
          <button onClick={installer} className="h-14 flex-[2] rounded-2xl bg-white text-xl font-bold text-mousse">
            Installer
          </button>
        </div>
      </div>

      {etapes && (
        <div className="fixed inset-0 z-[1200] flex flex-col justify-end bg-encre/40" onClick={() => setEtapes(false)}>
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="installer-titre"
            tabIndex={-1}
            className="flex flex-col gap-4 rounded-t-[32px] bg-papier px-5.5 pt-7 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="installer-titre" className="text-[28px] leading-[34px] font-bold">Installer en 3 gestes</h2>
            <ol className="flex flex-col gap-3 text-[21px] leading-7">
              <li className="flex items-center gap-3.5 rounded-[18px] bg-white p-3.5">
                <b className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mousse text-white">1</b>
                <span>Touchez <span role="img" aria-label="Partager" className="inline-flex size-8 translate-y-1.5 text-place" dangerouslySetInnerHTML={{ __html: PARTAGER }} /> en bas de l’écran</span>
              </li>
              <li className="flex items-center gap-3.5 rounded-[18px] bg-white p-3.5">
                <b className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mousse text-white">2</b>
                <span>Choisissez <b>« Sur l’écran d’accueil »</b></span>
              </li>
              <li className="flex items-center gap-3.5 rounded-[18px] bg-white p-3.5">
                <b className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mousse text-white">3</b>
                <span>Touchez <b>« Ajouter »</b></span>
              </li>
            </ol>
            <Bouton variante="principal" onClick={() => { setEtapes(false); setVisible(false) }}>
              J’ai compris
            </Bouton>
          </div>
        </div>
      )}
    </>
  )
}
