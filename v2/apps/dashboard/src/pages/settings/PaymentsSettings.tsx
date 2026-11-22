import { Check, Copy, Lock } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, EmptyState, ErrorState, Input, Segmented, Select, Skeleton, Switch } from '@/components/ui'
import { useCan, useStoreId } from '@/hooks/auth'
import { usePaymentAccounts, useSavePaymentAccount } from '@/hooks/resources'
import { api, ApiError, errorMessage } from '@/lib/api'
import { FIELD_LABEL, PROVIDER_LABEL } from '@/lib/labels'
import { SaveBar } from '@/components/SaveBar'
import type { PaymentAccount } from '@/lib/types'

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  const toast = useToast()
  return (
    <Button
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        } catch {
          toast.error('Copie impossible : sélectionnez le texte manuellement')
        }
      }}
      aria-label="Copier l’URL du webhook"
    >
      {done ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      {done ? 'Copié' : 'Copier'}
    </Button>
  )
}

/** Ce que chaque carte expose à la page : un seul enregistrement pour tous les moyens modifiés. */
type CardState = { dirty: boolean; save: () => Promise<void>; discard: () => void }

function ProviderCard({ account, report }: { account: PaymentAccount; report: (provider: string, state: CardState) => void }) {
  const save = useSavePaymentAccount()
  const toast = useToast()
  const [enabled, setEnabled] = useState(account.enabled)
  const [mode, setMode] = useState(account.mode)
  const [values, setValues] = useState<Record<'sandbox' | 'live', Record<string, string>>>({ sandbox: {}, live: {} })
  const [cleared, setCleared] = useState<Record<string, boolean>>({})
  const [credMode, setCredMode] = useState<'sandbox' | 'live'>(account.mode)
  const isPo = account.provider === 'orchestrator'
  const initialSettings = account.settings ?? { widgetMode: 'auto' as const, locale: null, allowedCountries: [], allowedOperators: [], defaultCountry: null }
  const [settings, setSettings] = useState(initialSettings)
  const [testing, setTesting] = useState<string | null>(null)
  const storeId = useStoreId()
  const dirty =
    enabled !== account.enabled ||
    mode !== account.mode ||
    Object.values(values.sandbox).some(Boolean) ||
    Object.values(values.live).some(Boolean) ||
    Object.values(cleared).some(Boolean) ||
    (isPo && JSON.stringify(settings) !== JSON.stringify(initialSettings))
  const testConnection = async () => {
    setTesting('…')
    try {
      const r = await api.post<{ ok: boolean; merchant?: { name: string }; livemode?: boolean; error?: string }>(`/stores/${storeId}/payment-accounts/orchestrator/test`)
      setTesting(r.ok ? `Connecté à « ${r.merchant?.name} » (${r.livemode ? 'production' : 'test'})` : `Échec : ${r.error}`)
    } catch (e) {
      setTesting(`Échec : ${errorMessage(e)}`)
    }
  }

  const discard = () => {
    setEnabled(account.enabled)
    setMode(account.mode)
    setValues({ sandbox: {}, live: {} })
    setCleared({})
    setSettings(initialSettings)
  }
  const save_ = async () => {
    // Champ vide = conserver ; null = effacer.
    const build = (m: 'sandbox' | 'live') => {
      const out: Record<string, string | null> = {}
      for (const f of account.fields) {
        if (cleared[`${m}.${f}`]) out[f] = null
        else if (values[m][f]?.trim()) out[f] = values[m][f]!.trim()
      }
      return out
    }
    try {
      await save.mutateAsync({ provider: account.provider, body: { enabled, mode, sandbox: build('sandbox'), live: build('live'), ...(isPo ? { settings } : {}) } })
      setValues({ sandbox: {}, live: {} })
      setCleared({})
      toast.success(`${PROVIDER_LABEL[account.provider]} enregistré`)
    } catch (err) {
      toast.error(err)
      throw err
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    void save_().catch(() => undefined)
  }
  // La page rassemble l'état de toutes les cartes (fonctions à jour à chaque rendu).
  const latest = useRef({ save: save_, discard })
  latest.current = { save: save_, discard }
  useEffect(() => {
    report(account.provider, { dirty, save: () => latest.current.save(), discard: () => latest.current.discard() })
  }, [dirty]) // eslint-disable-line react-hooks/exhaustive-deps

  const current = account[credMode]
  const configured = account.fields.every((f) => account[account.mode][f])

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          {PROVIDER_LABEL[account.provider]}
          {account.enabled ? <Badge tone="green">Activé</Badge> : <Badge>Désactivé</Badge>}
          {account.enabled && !configured && <Badge tone="orange">Identifiants incomplets</Badge>}
        </span>
      }
      actions={<Switch checked={enabled} onChange={setEnabled} ariaLabel={`Activer ${PROVIDER_LABEL[account.provider]}`} />}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] font-medium">Mode actif</span>
          <Segmented
            label="Mode actif"
            value={mode}
            onChange={(m) => {
              setMode(m)
              setCredMode(m)
            }}
            options={[
              { value: 'sandbox', label: 'Test (sandbox)' },
              { value: 'live', label: 'Production' },
            ]}
          />
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-muted">Identifiants</span>
            <Segmented
              label="Identifiants à modifier"
              value={credMode}
              onChange={setCredMode}
              options={[
                { value: 'sandbox', label: 'Test' },
                { value: 'live', label: 'Production' },
              ]}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* autoComplete new-password : le navigateur ne remplit pas les clés avec un mot de passe enregistré. */}
        {account.fields.map((f) => {
              const key = `${credMode}.${f}`
              const masked = current[f]
              return (
                <div key={key}>
                  <Input
                    label={
                      <span className="inline-flex items-center gap-2">
                        {FIELD_LABEL[f] ?? f}
                        {masked && !cleared[key] && <code className="rounded bg-surface-2 px-1.5 text-[12px] font-normal text-muted">{masked}</code>}
                      </span>
                    }
                    type="password"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    placeholder={masked && !cleared[key] ? 'laisser vide pour conserver' : 'Non renseigné'}
                    value={values[credMode][f] ?? ''}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, [credMode]: { ...v[credMode], [f]: e.target.value } }))
                      setCleared((c) => ({ ...c, [key]: false }))
                    }}
                  />
                  {masked && (
                    <button type="button" onClick={() => setCleared((c) => ({ ...c, [key]: !c[key] }))} className="mt-1 text-[12px] font-medium text-red-600 hover:underline dark:text-red-400">
                      {cleared[key] ? 'Annuler' : 'Effacer'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        {isPo && (
          <div className="space-y-3 rounded-lg border border-line p-3">
            <p className="text-[13px] font-medium text-muted">Paiement sur ta boutique</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Affichage du paiement"
                value={settings.widgetMode}
                onChange={(e) => setSettings({ ...settings, widgetMode: e.target.value as typeof settings.widgetMode })}
                options={[
                  { value: 'auto', label: 'Auto (fenêtre sur ordinateur, page sur mobile)' },
                  { value: 'modal', label: 'Fenêtre sur la page de vente' },
                  { value: 'redirect', label: 'Page de paiement séparée' },
                ]}
              />
              <Select
                label="Langue"
                value={settings.locale ?? ''}
                onChange={(e) => setSettings({ ...settings, locale: (e.target.value || null) as typeof settings.locale })}
                options={[
                  { value: '', label: 'Celle du navigateur du client' },
                  { value: 'fr', label: 'Français' },
                  { value: 'en', label: 'Anglais' },
                ]}
              />
              <Input
                label="Pays autorisés"
                optional
                placeholder="BJ, CI, SN (vide = tous)"
                value={settings.allowedCountries.join(', ')}
                onChange={(e) => setSettings({ ...settings, allowedCountries: e.target.value.toUpperCase().split(/[\s,;]+/).filter((x) => /^[A-Z]{2}$/.test(x)) })}
              />
              <Input
                label="Opérateurs autorisés"
                optional
                placeholder="mtn, moov, wave (vide = tous)"
                value={settings.allowedOperators.join(', ')}
                onChange={(e) => setSettings({ ...settings, allowedOperators: e.target.value.toLowerCase().split(/[\s,;]+/).filter((x) => /^[a-z0-9_-]{2,20}$/.test(x)) })}
              />
              <Input
                label="Pays présélectionné"
                optional
                placeholder="Pays de la boutique par défaut"
                maxLength={2}
                value={settings.defaultCountry ?? ''}
                onChange={(e) => setSettings({ ...settings, defaultCountry: /^[A-Za-z]{2}$/.test(e.target.value) ? e.target.value.toUpperCase() : null })}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={testConnection} disabled={!account[account.mode].secretKey}>
                Tester la connexion
              </Button>
              {testing && <span className="text-[13px] text-muted">{testing}</span>}
            </div>
          </div>
        )}
        {account.webhookUrl ? (
          <div>
            <p className="mb-1.5 text-[13px] font-medium">URL de webhook</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-surface-2 px-3 py-2 text-[12.5px]" title={account.webhookUrl}>
                {account.webhookUrl}
              </code>
              <CopyButton text={account.webhookUrl} />
            </div>
            <p className="mt-1 text-[12.5px] text-muted">À coller dans le tableau de bord de {PROVIDER_LABEL[account.provider]}.</p>
          </div>
        ) : (
          <p className="text-[12.5px] text-muted">L’URL de webhook apparaîtra après le premier enregistrement.</p>
        )}
      </form>
    </Card>
  )
}

export function PaymentsSettings() {
  const isOwner = useCan('payments.manage')
  const { data, error, isPending, refetch } = usePaymentAccounts(isOwner)
  const [cards, setCards] = useState<Record<string, CardState>>({})
  const [saving, setSaving] = useState(false)
  const report = useCallback((provider: string, state: CardState) => setCards((c) => ({ ...c, [provider]: state })), [])
  const dirtyCards = Object.values(cards).filter((c) => c.dirty)
  const saveAll = async () => {
    setSaving(true)
    try {
      for (const c of dirtyCards) await c.save()
    } catch {
      /* erreur déjà affichée par la carte */
    } finally {
      setSaving(false)
    }
  }
  const discardAll = () => dirtyCards.forEach((c) => c.discard())
  const forbidden = !isOwner || (error instanceof ApiError && error.status === 403)
  if (forbidden) return <EmptyState icon={<Lock className="size-5" />} title="Réservé au propriétaire" description="Seul le propriétaire de la boutique peut voir et modifier les moyens de paiement." />
  if (error && !data) return <ErrorState error={error} onRetry={() => void refetch()} />
  if (isPending)
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    )
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Les identifiants sont chiffrés. Les valeurs actuelles ne sont jamais affichées en entier.</p>
        <Button variant="primary" onClick={() => void saveAll()} loading={saving} disabled={!dirtyCards.length}>
          Enregistrer
        </Button>
      </div>
      <p className="rounded-lg bg-accent-soft p-3 text-[13px]">
        <strong>Recommandé : Payment Orchestrator.</strong> Un seul compte pour MTN, Moov, Orange, Wave… avec bascule automatique vers un autre prestataire en cas de panne. Crée tes clés sur payment.zurisell.store (Développeurs, Clés API), colle la clé secrète et le secret de webhook ci-dessous, puis ajoute l’URL de webhook affichée dans Développeurs, Webhooks. Commence en mode test.
      </p>
      {data.map((a) => (
        <ProviderCard key={`${a.provider}-${a.enabled}-${a.mode}-${JSON.stringify(a.sandbox)}-${JSON.stringify(a.live)}`} account={a} report={report} />
      ))}
      {/* Une seule barre pour toute la page : elle enregistre tous les moyens de paiement modifiés. */}
      <SaveBar dirty={dirtyCards.length > 0} saving={saving} onSave={() => void saveAll()} onDiscard={discardAll} alwaysOnMobile={false} label={dirtyCards.length > 1 ? `Enregistrer (${dirtyCards.length})` : 'Enregistrer'} />
    </div>
  )
}
