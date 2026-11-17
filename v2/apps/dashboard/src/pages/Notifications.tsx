import type { ChannelPrefs, NotificationChannel, NotificationEvent, NotificationPrefs } from '@zuri/shared'
import { Bell, BellOff, Check, Laptop, Mail, Play, Send, Share, Smartphone, Trash2, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConfirmDialog, useDialogState } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, cx, ErrorState, ListSkeleton, PageHeader, Switch } from '@/components/ui'
import { useDevices, useNotificationConfig, useNotificationPrefs, useRemoveDevice, useSaveNotificationPrefs, useTelegramLink, useTelegramUnlink, useTestNotification } from '@/hooks/notifications'
import { errorMessage } from '@/lib/api'
import { relative } from '@/lib/format'
import { disablePush, enablePush, getPushState, isIOS, type PushState } from '@/lib/push'
import { getSoundSettings, playSound, setSoundSettings, SOUNDS, type SoundId, type SoundSettings } from '@/lib/sound'

const CHANNELS: { key: NotificationChannel; label: string; icon: typeof Bell }[] = [
  { key: 'push', label: 'Push', icon: Smartphone },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'telegram', label: 'Telegram', icon: Send },
]

/** Section « Cet appareil » : activer le push ici (téléphone ou PC). */
function ThisDevice({ onChange }: { onChange: () => void }) {
  const toast = useToast()
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    void getPushState().then(setState)
  }, [])

  const enable = async () => {
    setBusy(true)
    try {
      const s = await enablePush()
      setState(s)
      if (s === 'on') {
        toast.success('Notifications activées sur cet appareil')
        playSound()
        onChange()
      } else if (s === 'denied') toast.error('Notifications refusées par le navigateur')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  const disable = async () => {
    setBusy(true)
    await disablePush().catch(() => undefined)
    setState('off')
    setBusy(false)
    onChange()
  }

  if (state === null) return <ListSkeleton rows={1} />
  if (state === 'on')
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="size-4" /> Activées sur cet appareil
        </p>
        <Button size="sm" variant="ghost" onClick={disable} loading={busy}>
          <BellOff className="size-3.5" /> Désactiver ici
        </Button>
      </div>
    )
  if (state === 'ios-needs-install')
    return (
      <div className="space-y-2 rounded-lg bg-surface-2 p-3 text-sm">
        <p className="font-medium">Sur iPhone, ajoutez d’abord Zuri à l’écran d’accueil :</p>
        <ol className="list-decimal space-y-1 pl-5 text-muted">
          <li>
            Touchez <Share className="inline size-3.5 align-text-bottom" /> <strong className="text-fg">Partager</strong> en bas de Safari.
          </li>
          <li>
            Choisissez <strong className="text-fg">Sur l’écran d’accueil</strong>.
          </li>
          <li>Ouvrez Zuri depuis l’icône, revenez ici et activez les notifications.</li>
        </ol>
      </div>
    )
  if (state === 'unsupported') return <p className="text-sm text-muted">Ce navigateur ne prend pas en charge les notifications push. Utilisez Chrome, Edge, Firefox ou Safari récent, ou reliez Telegram.</p>
  if (state === 'denied')
    return (
      <p className="text-sm text-muted">
        Les notifications sont bloquées pour Zuri dans ce navigateur. Autorisez-les dans les réglages du site (icône à gauche de l’adresse), puis rechargez la page.
      </p>
    )
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">Recevez une alerte sur cet appareil à chaque vente, même quand Zuri est fermé.</p>
      <Button variant="primary" onClick={enable} loading={busy}>
        <Bell className="size-4" /> Activer sur cet appareil
      </Button>
    </div>
  )
}

function SoundPicker() {
  const [s, setS] = useState<SoundSettings>(getSoundSettings)
  const update = (patch: Partial<SoundSettings>) => {
    const next = { ...s, ...patch }
    setS(next)
    setSoundSettings(next)
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(SOUNDS) as SoundId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              update({ sound: id })
              playSound(id, s.volume)
            }}
            className={cx('flex items-start gap-3 rounded-xl border p-3 text-left transition', s.sound === id ? 'border-accent bg-accent/10' : 'border-line hover:border-line-strong')}
          >
            <span className={cx('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full', s.sound === id ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-muted')}>
              {id === 'none' ? <BellOff className="size-3.5" /> : <Play className="size-3.5" />}
            </span>
            <span>
              <span className="block text-sm font-semibold">{SOUNDS[id].label}</span>
              <span className="block text-xs text-muted">{SOUNDS[id].description}</span>
            </span>
          </button>
        ))}
      </div>
      <label className="flex items-center gap-3 text-sm">
        <Volume2 className="size-4 text-muted" />
        <span className="w-16 shrink-0">Volume</span>
        <input type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => update({ volume: Number(e.target.value) })} onPointerUp={() => playSound(s.sound, s.volume)} className="w-full accent-[var(--color-accent,#f59e0b)]" />
      </label>
      <p className="text-xs text-muted">
        Ce son est joué quand Zuri est ouvert. Application fermée, c’est le son de notification du téléphone qui s’applique (Android et iPhone ne permettent pas de le personnaliser). Pour un son d’encaissement partout, reliez Telegram et choisissez votre son dans la conversation.
      </p>
    </div>
  )
}

function Telegram() {
  const toast = useToast()
  const config = useNotificationConfig()
  const link = useTelegramLink()
  const unlink = useTelegramUnlink()
  const tg = config.data?.telegram
  if (!tg) return <ListSkeleton rows={1} />
  if (!tg.enabled) return <p className="text-sm text-muted">Le bot Telegram n’est pas encore configuré sur Zuri.</p>
  if (tg.linked)
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="size-4" /> Telegram relié{tg.botUsername ? ` (@${tg.botUsername})` : ''}
        </p>
        <Button size="sm" variant="ghost" loading={unlink.isPending} onClick={() => unlink.mutate(undefined, { onSuccess: () => toast.success('Telegram délié') })}>
          Délier
        </Button>
      </div>
    )
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">Recevez vos ventes dans Telegram, avec le son de votre choix.</p>
      <Button
        loading={link.isPending}
        onClick={() =>
          link.mutate(undefined, {
            onSuccess: ({ url }) => {
              window.open(url, '_blank', 'noopener')
              toast.success('Appuyez sur « Démarrer » dans Telegram, puis revenez ici')
              // Le webhook relie le compte : on vérifie le statut quelques secondes plus tard.
              setTimeout(() => void config.refetch(), 8000)
              setTimeout(() => void config.refetch(), 20000)
            },
            onError: (e) => toast.error(e),
          })
        }
      >
        <Send className="size-4" /> Relier Telegram
      </Button>
    </div>
  )
}

function Devices() {
  const devices = useDevices()
  const remove = useRemoveDevice()
  const dialog = useDialogState<number>()
  if (devices.isPending) return <ListSkeleton rows={2} />
  if (devices.error && !devices.data) return <ErrorState error={devices.error} onRetry={() => devices.refetch()} />
  if (!devices.data.length) return <p className="text-sm text-muted">Aucun appareil pour l’instant.</p>
  return (
    <ul className="divide-y divide-line">
      {devices.data.map((d) => (
        <li key={d.id} className="flex items-center gap-3 py-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-surface-2 text-muted">{/Android|iPhone|iPad/.test(d.label) ? <Smartphone className="size-4" /> : <Laptop className="size-4" />}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{d.label}</p>
            <p className="text-xs text-muted">{d.lastUsedAt ? `Dernière notification ${relative(d.lastUsedAt)}` : `Ajouté ${relative(d.createdAt)}`}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => dialog.show(d.id)} aria-label={`Retirer ${d.label}`}>
            <Trash2 className="size-3.5" />
          </Button>
        </li>
      ))}
      <ConfirmDialog
        open={dialog.open}
        onClose={dialog.close}
        title="Retirer cet appareil ?"
        message="Il ne recevra plus de notifications push."
        confirmLabel="Retirer"
        danger
        loading={remove.isPending}
        onConfirm={() => dialog.value !== null && remove.mutate(dialog.value, { onSuccess: () => dialog.close() })}
      />
    </ul>
  )
}

function Preferences() {
  const toast = useToast()
  const prefs = useNotificationPrefs()
  const save = useSaveNotificationPrefs()
  const config = useNotificationConfig()
  const [draft, setDraft] = useState<NotificationPrefs | null>(null)
  useEffect(() => {
    if (prefs.data) setDraft(Object.fromEntries(prefs.data.events.map((e) => [e.event, e.channels])) as NotificationPrefs)
  }, [prefs.data])
  if (prefs.isPending || !draft) return <ListSkeleton rows={4} />
  if (prefs.error && !prefs.data) return <ErrorState error={prefs.error} onRetry={() => prefs.refetch()} />
  const telegramOff = !config.data?.telegram.enabled
  const toggle = (event: NotificationEvent, channel: NotificationChannel, value: boolean) => {
    const next = { ...draft, [event]: { ...(draft[event] as ChannelPrefs), [channel]: value } }
    setDraft(next)
    save.mutate(next, { onError: (e) => toast.error(e) })
  }
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="px-4 pb-2 font-medium sm:px-0">Événement</th>
            {CHANNELS.map((c) => (
              <th key={c.key} className="w-20 pb-2 text-center font-medium">
                <c.icon className="mx-auto mb-0.5 size-4" />
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {prefs.data.events.map((e) => (
            <tr key={e.event}>
              <td className="px-4 py-3 sm:px-0">
                <p className="font-medium">{e.label}</p>
                <p className="text-xs text-muted">{e.description}</p>
              </td>
              {CHANNELS.map((c) => (
                <td key={c.key} className="text-center">
                  <div className="inline-flex">
                    <Switch
                      size="sm"
                      ariaLabel={`${e.label} par ${c.label}`}
                      checked={Boolean(draft[e.event]?.[c.key])}
                      disabled={c.key === 'telegram' && telegramOff}
                      onChange={(v) => toggle(e.event, c.key, v)}
                    />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 px-4 text-xs text-muted sm:px-0">Vous ne recevez que les notifications des produits et des actions auxquels vous avez accès dans cette boutique.</p>
    </div>
  )
}

export default function Notifications() {
  const toast = useToast()
  const test = useTestNotification()
  const devices = useDevices()
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        description="Soyez prévenu à chaque vente, sur votre téléphone, votre ordinateur, par email ou sur Telegram."
        actions={
          <Button
            loading={test.isPending}
            onClick={() =>
              test.mutate(undefined, {
                onSuccess: (r) => {
                  if (!r.push && !r.telegram) toast.error('Aucun appareil ni Telegram relié pour l’instant')
                  else toast.success(`Test envoyé (${[r.push ? `${r.push} appareil(s)` : null, r.telegram ? 'Telegram' : null].filter(Boolean).join(' et ')})`)
                },
                onError: (e) => toast.error(e),
              })
            }
          >
            <Bell className="size-4" /> Envoyer un test
          </Button>
        }
      />
      <div className="space-y-4">
        <Card title="Cet appareil" description={isIOS() ? 'iPhone ou iPad' : 'Téléphone ou ordinateur que vous utilisez maintenant'}>
          <div className="p-4 sm:p-5">
            <ThisDevice onChange={() => void devices.refetch()} />
          </div>
        </Card>
        <Card title="Son de vente" description="Quand Zuri est ouvert sur cet appareil.">
          <div className="p-4 sm:p-5">
            <SoundPicker />
          </div>
        </Card>
        <Card title="Telegram">
          <div className="p-4 sm:p-5">
            <Telegram />
          </div>
        </Card>
        <Card title="Quoi recevoir, et où" description="Pour cette boutique. Les changements sont enregistrés tout de suite.">
          <div className="p-4 sm:p-5">
            <Preferences />
          </div>
        </Card>
        <Card
          title="Mes appareils"
          actions={
            devices.data?.length ? (
              <Badge>
                {devices.data.length} appareil{devices.data.length > 1 ? 's' : ''}
              </Badge>
            ) : undefined
          }
        >
          <div className="px-4 py-2 sm:px-5">
            <Devices />
          </div>
        </Card>
      </div>
    </div>
  )
}
