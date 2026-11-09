import { useEffect, useState } from 'react'
import { useDialog } from '~/hooks/use-dialog'
import { Button } from '~/components/button'

type AndroidPrompt = Event & { prompt: () => Promise<void> }

const DECLINED_KEY = 'installer-plus-tard'
const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
const alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true
const phone = window.matchMedia('(pointer: coarse)').matches
// ?installer dans l'adresse : affiche la proposition même sur ordinateur (pour tester)
const force = new URLSearchParams(window.location.search).has('installer')

function refusedRecently() {
  try {
    const when = Number(localStorage.getItem(DECLINED_KEY))
    return Date.now() - when < 7 * 24 * 3600 * 1000
  } catch {
    return false
  }
}

const SHARE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/></svg>'

/** Propose d'installer l'appli sur l'écran d'accueil du téléphone, en une ou deux étapes simples. */
export function InstallPrompt() {
  const [android, setAndroid] = useState<AndroidPrompt | null>(null)
  const [visible, setVisible] = useState(force || (!alreadyInstalled && phone && ios && !refusedRecently()))
  const [steps, setSteps] = useState(false)
  const { ref } = useDialog<HTMLDivElement>(steps, () => setSteps(false))

  useEffect(() => {
    const whenSuggested = (e: Event) => {
      // Sur ordinateur, on laisse le navigateur proposer l'installation à sa façon.
      if (alreadyInstalled || !phone) return
      e.preventDefault()
      setAndroid(e as AndroidPrompt)
      if (!refusedRecently()) setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', whenSuggested)
    return () => window.removeEventListener('beforeinstallprompt', whenSuggested)
  }, [])

  function later() {
    try { localStorage.setItem(DECLINED_KEY, String(Date.now())) } catch { /* rien */ }
    setVisible(false)
  }

  async function install() {
    if (android) {
      await android.prompt()
      setVisible(false)
    } else {
      setSteps(true)
    }
  }

  if (!visible) return null

  return (
    <>
      <div className="mb-2.5 flex flex-col gap-3 rounded-[22px] bg-moss p-4 text-white">
        <div className="flex items-center gap-3">
          <img src="/icone-192.png" alt="" className="size-13 shrink-0 rounded-[14px]" />
          <p className="text-xl leading-[26px] font-semibold">Mettre l’appli sur l’écran d’accueil ?</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={later} className="h-14 flex-1 rounded-2xl border-2 border-white/70 text-lg font-semibold">
            Plus tard
          </button>
          <button onClick={install} className="h-14 flex-[2] rounded-2xl bg-white text-xl font-bold text-moss">
            Installer
          </button>
        </div>
      </div>

      {steps && (
        <div className="fixed inset-0 z-[1200] flex flex-col justify-end bg-ink/40" onClick={() => setSteps(false)}>
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
            tabIndex={-1}
            className="flex flex-col gap-4 rounded-t-[32px] bg-paper px-5.5 pt-7 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="install-title" className="text-[28px] leading-[34px] font-bold">Installer en 3 gestes</h2>
            <ol className="flex flex-col gap-3 text-[21px] leading-7">
              <li className="flex items-center gap-3.5 rounded-[18px] bg-white p-3.5">
                <b className="flex size-10 shrink-0 items-center justify-center rounded-full bg-moss text-white">1</b>
                <span>Touchez <span role="img" aria-label="Partager" className="inline-flex size-8 translate-y-1.5 text-parking" dangerouslySetInnerHTML={{ __html: SHARE }} /> en bas de l’écran</span>
              </li>
              <li className="flex items-center gap-3.5 rounded-[18px] bg-white p-3.5">
                <b className="flex size-10 shrink-0 items-center justify-center rounded-full bg-moss text-white">2</b>
                <span>Choisissez <b>« Sur l’écran d’accueil »</b></span>
              </li>
              <li className="flex items-center gap-3.5 rounded-[18px] bg-white p-3.5">
                <b className="flex size-10 shrink-0 items-center justify-center rounded-full bg-moss text-white">3</b>
                <span>Touchez <b>« Ajouter »</b></span>
              </li>
            </ol>
            <Button variant="primary" onClick={() => { setSteps(false); setVisible(false) }}>
              J’ai compris
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
