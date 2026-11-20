import { BellRing, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui'
import { errorMessage } from '@/lib/api'
import { enablePush, getPushState, type PushState } from '@/lib/push'
import { playSound } from '@/lib/sound'
import { readLocal, writeLocal } from '@/lib/storage'

const DISMISS_KEY = 'zuri:notif-banner-dismissed'
const DISMISS_DAYS = 3

/**
 * Incite à activer les notifications sur cet appareil tant qu'elles ne le sont pas :
 * sans elles, une vente peut attendre des heures avant d'être appelée.
 * Masquable 3 jours ; revient ensuite tant que ce n'est pas fait.
 */
export function EnableNotificationsBanner({ settingsHref }: { settingsHref: string }) {
  const toast = useToast()
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [hidden, setHidden] = useState(() => {
    const at = Number(readLocal(DISMISS_KEY) ?? 0)
    return at > 0 && Date.now() - at < DISMISS_DAYS * 86400_000
  })

  useEffect(() => {
    void getPushState().then(setState)
  }, [])

  if (hidden || (state !== 'off' && state !== 'ios-needs-install')) return null

  const dismiss = () => {
    writeLocal(DISMISS_KEY, String(Date.now()))
    setHidden(true)
  }
  const enable = async () => {
    setBusy(true)
    try {
      const s = await enablePush()
      setState(s)
      if (s === 'on') {
        toast.success('Notifications activées : tu seras prévenu à chaque vente')
        playSound()
      } else if (s === 'denied') toast.error('Notifications bloquées par le navigateur. Autorise-les dans les réglages du site, puis réessaie.')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-accent/40 bg-accent-soft px-4 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <BellRing className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Active les notifications pour ne rater aucune vente</p>
        <p className="mt-0.5 text-[13px] text-muted">
          {state === 'ios-needs-install'
            ? 'Sur iPhone : ajoute Zuri à l’écran d’accueil (Partager, puis Sur l’écran d’accueil), ouvre-le depuis l’icône et active ici.'
            : 'Ton téléphone ou ton PC sonne dès qu’un client commande, même quand Zuri est fermé. Tu peux aussi recevoir les ventes par email ou Telegram.'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {state === 'off' && (
            <Button size="sm" variant="primary" onClick={enable} loading={busy}>
              Activer sur cet appareil
            </Button>
          )}
          <NavLink to={settingsHref} className="text-[13px] font-medium text-accent hover:underline">
            Tous les réglages
          </NavLink>
        </div>
      </div>
      <button type="button" onClick={dismiss} className="rounded-full p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Masquer">
        <X className="size-4" />
      </button>
    </div>
  )
}
