import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BillingPromo } from '@zuri/shared'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, ErrorState, Input, Select, Skeleton, Switch, Textarea } from '@/components/ui'
import { api } from '@/lib/api'
import { LAST_STORE_KEY, writeLocal } from '@/lib/storage'
import { fdate, fmt } from './shared'

interface PlatformSettings {
  paymentsOnline: boolean
  billingEnabled: boolean
  billingAccount: { storeId?: string } | null
  urlImport: boolean
  cartEnabled: boolean
  cartEnv: boolean
  contact: { email: string; whatsapp: string | null; socials: string[] }
  ai: { configured: boolean }
  billingPromo: BillingPromo
  firecrawl: { configured: boolean; source: 'admin' | 'env' | null; hint: string | null }
  po: { configured: boolean; source: 'admin' | 'env' | null; hint: string | null; livemode: boolean | null; webhookSecretSet: boolean; webhookUrl: string }
  myStores: { id: string; name: string; accounts: { provider: string; enabled: boolean; mode: string }[] }[]
}

export default function AdminSettings() {
  const qc = useQueryClient()
  const toast = useToast()
  const { data, error, isPending, refetch } = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => api.get<PlatformSettings>('/admin/settings') })
  const payments = useQuery({ queryKey: ['admin', 'billing-payments'], queryFn: () => api.get<{ id: number; email: string; plan: string; months: number; amount: number; status: string; provider: string; error?: string | null; createdAt: string }[]>('/admin/billing-payments') })
  const save = useMutation({ mutationFn: (body: unknown) => api.put('/admin/settings', body) })
  const put = (body: unknown, msg: string) => save.mutate(body, { onSuccess: () => (toast.success(msg), void qc.invalidateQueries({ queryKey: ['admin', 'settings'] })), onError: (e) => toast.error(e) })
  if (error && !data) return <ErrorState error={error} onRetry={() => void refetch()} />
  if (isPending) return <Skeleton className="h-96 rounded-xl" />
  const billingStore = data.myStores.find((s) => s.id === data.billingAccount?.storeId)
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Réglages de la plateforme</h1>
      <Card title="Contact Zuri" description="Affichés sur la page contact du site, en bouton WhatsApp sur les pages marketing, et dans les emails d’accompagnement des vendeurs (les réponses arrivent sur cet email).">
        <ContactSettings contact={data.contact} onSave={(body) => put(body, 'Coordonnées de contact enregistrées')} saving={save.isPending} />
      </Card>
      <Card title="Payment Orchestrator de la plateforme" description="Ton compte payment.zurisell.store : il encaisse les abonnements Zuri et les ventes de tes propres boutiques. Jamais celles des autres vendeurs (ils connectent leur propre compte).">
        <PoPlatform po={data.po} onSave={(body, msg) => put(body, msg)} />
      </Card>
      <Card title="Offre sur les formules" description="Réduction appliquée au paiement des abonnements, affichée sur la page Abonnement, le tableau de bord des vendeurs, le site (tarifs et bandeau) et les emails de relance.">
        <PromoForm promo={data.billingPromo} billingOpen={data.billingEnabled} onSave={(billingPromo, msg) => put({ billingPromo }, msg)} />
      </Card>
      <Card title="Ouverture des paiements" description="Tant que c’est désactivé, seules tes boutiques (et les comptes que tu autorises dans leur fiche) encaissent en ligne. Les autres vendeurs restent en paiement à la livraison.">
        <div className="space-y-3">
          <Switch label="Paiement en ligne (Payment Orchestrator, Mobile Money) ouvert à tous les vendeurs" checked={data.paymentsOnline} onChange={(v) => put({ paymentsOnline: v }, v ? 'Paiements en ligne ouverts à tous' : 'Paiements en ligne réservés')} />
          <Switch label="Paiement des abonnements ouvert à tous" checked={data.billingEnabled} onChange={(v) => put({ billingEnabled: v }, v ? 'Abonnements payants ouverts' : 'Abonnements payants réservés')} />
        </div>
      </Card>
      <Card title="Import de produit par lien" description="Lecture des pages produit protégées (AliExpress, Amazon…) avec un navigateur distant Firecrawl, puis IA. Chaque import consomme des crédits Firecrawl : tant que c’est fermé, seuls toi et les comptes que tu autorises (fiche du compte) le voient.">
        <div className="space-y-4">
          <Switch label="Import par lien ouvert à tous les vendeurs" checked={data.urlImport} onChange={(v) => put({ urlImport: v }, v ? 'Import par lien ouvert à tous' : 'Import par lien réservé')} />
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">Rédaction et images IA (clé KIE)</span>
            {data.ai.configured ? <Badge tone="green">configurée</Badge> : <Badge tone="amber">manquante : ajoutez KIE_API_KEY dans Dokploy</Badge>}
          </p>
          <FirecrawlKey firecrawl={data.firecrawl} onSave={(key, msg) => put({ firecrawlKey: key }, msg)} />
        </div>
      </Card>
      <Card title="Panier (en observation)" description="Plusieurs produits dans une seule commande, et catégories sur la page d’accueil des boutiques. Fermé : personne ne le voit, sauf toi et les comptes que tu ouvres dans leur fiche. Le vendeur doit ensuite l’activer dans ses réglages.">
        <Switch
          label="Panier ouvert à tous les vendeurs"
          checked={data.cartEnabled || data.cartEnv}
          disabled={data.cartEnv}
          description={data.cartEnv ? 'Ouvert par la variable CART_ENABLED du serveur.' : undefined}
          onChange={(v) => put({ cartEnabled: v }, v ? 'Panier ouvert à tous' : 'Panier réservé')}
        />
      </Card>
      <Card title="Compte d’encaissement des abonnements" description="Les abonnements sont payés sur les comptes FedaPay, FeexPay ou pawaPay connectés à cette boutique (Paramètres, Paiements).">
        <Select
          label="Boutique qui encaisse"
          value={data.billingAccount?.storeId ?? ''}
          onChange={(e) => put({ billingStoreId: e.target.value || null }, 'Compte d’encaissement enregistré')}
          options={[{ value: '', label: 'Aucune (paiement désactivé)' }, ...data.myStores.map((s) => ({ value: s.id, label: s.name }))]}
        />
        {billingStore && (
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {billingStore.accounts.length === 0 ? (
              <span className="text-red-600">Aucun compte FedaPay, FeexPay ou pawaPay connecté sur cette boutique.</span>
            ) : (
              billingStore.accounts.map((a) => (
                <Badge key={a.provider} tone={a.enabled ? 'green' : 'neutral'}>
                  {a.provider} · {a.mode === 'live' ? 'réel' : 'test'}
                </Badge>
              ))
            )}
          </div>
        )}
      </Card>
      <Card title="Derniers paiements d’abonnement">
        {payments.data?.length ? (
          <ul className="divide-y divide-line text-sm">
            {payments.data.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{p.email}</span>
                <span>
                  {p.plan} · {p.months} mois · {p.provider}
                </span>
                <span className="tabular">{fmt(p.amount)} F</span>
                <span className="text-muted">{fdate(p.createdAt, true)}</span>
                <Badge tone={p.status === 'paid' ? 'green' : p.status === 'failed' ? 'red' : 'neutral'}>{p.status === 'paid' ? 'payé' : p.status === 'failed' ? 'échoué' : 'en attente'}</Badge>
                {p.status === 'failed' && p.error && <span className="w-full text-[12px] text-red-700 dark:text-red-300">{p.error}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Aucun paiement pour l’instant.</p>
        )}
      </Card>
      <ResetAccount />
    </div>
  )
}

interface ResetPreview {
  stores: { id: string; name: string; slug: string }[]
  products: number
  orders: number
  customers: number
}

/** Remise à zéro de mon compte : mes boutiques et tout leur contenu sont effacés, le compte reste. */
function ResetAccount() {
  const toast = useToast()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const preview = useQuery({ queryKey: ['admin', 'reset-preview'], queryFn: () => api.get<ResetPreview>('/admin/me/reset'), enabled: open })
  const reset = useMutation({
    mutationFn: () => api.post<{ stores: number; files: number }>('/admin/me/reset', { confirm }),
    onSuccess: (r) => {
      writeLocal(LAST_STORE_KEY, null)
      qc.clear()
      toast.success(`Compte remis à zéro : ${r.stores} boutique${r.stores > 1 ? 's' : ''} et ${r.files} fichier${r.files > 1 ? 's' : ''} effacés`)
      window.location.assign('/')
    },
    onError: (e) => toast.error(e),
  })
  const p = preview.data
  return (
    <Card title="Remettre mon compte à zéro">
      <div className="space-y-3 text-sm">
        <p className="text-muted">
          Efface <strong className="text-fg">toutes tes boutiques</strong> et tout ce qu’elles contiennent : produits, commandes, clients, stats, équipe, réglages, moyens de paiement, photos et fichiers. Ton compte, ton mot de passe, ton accès super admin, ton abonnement et ton code de parrainage sont gardés. Les comptes des autres vendeurs ne sont pas touchés.
        </p>
        {!open ? (
          <Button variant="secondary" className="text-red-600 dark:text-red-400" onClick={() => setOpen(true)}>
            Remettre à zéro…
          </Button>
        ) : !p ? (
          <Skeleton className="h-16 rounded-lg" />
        ) : !p.stores.length ? (
          <p>Aucune boutique à effacer : ton compte est déjà vide.</p>
        ) : (
          <div className="space-y-3 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
            <p>
              Seront effacés définitivement : <strong>{p.stores.map((s) => s.name).join(', ')}</strong>, soit {fmt(p.products)} produit{p.products > 1 ? 's' : ''}, {fmt(p.orders)} commande{p.orders > 1 ? 's' : ''} et {fmt(p.customers)} client{p.customers > 1 ? 's' : ''}. Impossible de revenir en arrière.
            </p>
            <Input label="Tape EFFACER pour confirmer" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" loading={reset.isPending} disabled={confirm !== 'EFFACER'} onClick={() => reset.mutate()}>
                Tout effacer
              </Button>
              <Button variant="ghost" onClick={() => (setOpen(false), setConfirm(''))}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

/** Clé Firecrawl : enregistrée chiffrée en base (prioritaire sur la variable d'environnement). */
function FirecrawlKey({ firecrawl, onSave }: { firecrawl: PlatformSettings['firecrawl']; onSave: (key: string | null, msg: string) => void }) {
  const [key, setKey] = useState('')
  return (
    <div className="space-y-2">
      <p className="text-sm">
        Clé Firecrawl :{' '}
        {firecrawl.configured ? (
          <>
            <Badge tone="green">configurée</Badge> <code className="text-[12px]">{firecrawl.hint}</code> <span className="text-[12px] text-muted">({firecrawl.source === 'admin' ? 'enregistrée ici' : 'variable d’environnement'})</span>
          </>
        ) : (
          <Badge tone="amber">absente : les sites protégés passent par l’IA ou le texte collé</Badge>
        )}
      </p>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!key.trim()) return
          onSave(key.trim(), 'Clé Firecrawl enregistrée')
          setKey('')
        }}
      >
        <Input label="Nouvelle clé" placeholder="fc-…" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" wrapClass="min-w-64 flex-1" />
        <Button type="submit" variant="primary" disabled={!key.trim()}>
          Enregistrer
        </Button>
        {firecrawl.source === 'admin' && (
          <Button type="button" variant="ghost" onClick={() => onSave(null, 'Clé Firecrawl retirée')}>
            Retirer
          </Button>
        )}
      </form>
    </div>
  )
}

/** Clés du compte Payment Orchestrator de la plateforme (chiffrées en base, prioritaires sur les variables d'environnement). */
function PoPlatform({ po, onSave }: { po: PlatformSettings['po']; onSave: (body: unknown, msg: string) => void }) {
  const [secretKey, setSecretKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [test, setTest] = useState<string | null>(null)
  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-2 text-sm">
        {po.configured ? (
          <>
            <Badge tone="green">configuré</Badge>
            <Badge tone={po.livemode ? 'blue' : 'amber'}>{po.livemode ? 'production' : 'test'}</Badge>
            <code className="text-[12px]">{po.hint}</code>
            <span className="text-[12px] text-muted">({po.source === 'admin' ? 'enregistré ici' : 'variable d’environnement'})</span>
            {!po.webhookSecretSet && <Badge tone="amber">secret de webhook manquant</Badge>}
          </>
        ) : (
          <Badge tone="amber">non configuré : abonnements payés par l’ancien moyen</Badge>
        )}
      </p>
      <form
        className="grid gap-2 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          const body: Record<string, string> = {}
          if (secretKey.trim()) body.poSecretKey = secretKey.trim()
          if (webhookSecret.trim()) body.poWebhookSecret = webhookSecret.trim()
          if (!Object.keys(body).length) return
          onSave(body, 'Compte Payment Orchestrator enregistré')
          setSecretKey('')
          setWebhookSecret('')
        }}
      >
        <Input label="Clé secrète" placeholder="sk_test_… puis sk_live_…" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} autoComplete="new-password" data-lpignore="true" type="password" />
        <Input label="Secret de webhook" placeholder="whsec_…" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} autoComplete="new-password" data-lpignore="true" type="password" />
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
          <Button type="submit" variant="primary" disabled={!secretKey.trim() && !webhookSecret.trim()}>
            Enregistrer
          </Button>
          <Button
            type="button"
            disabled={!po.configured}
            onClick={async () => {
              setTest('…')
              const r = await api.post<{ ok: boolean; merchant?: { name: string }; livemode?: boolean; error?: string }>('/admin/po/test').catch((e) => ({ ok: false, error: String(e) }) as { ok: false; error: string })
              setTest(r.ok ? `Connecté à « ${r.merchant?.name} » (${r.livemode ? 'production' : 'test'})` : `Échec : ${r.error}`)
            }}
          >
            Tester la connexion
          </Button>
          {po.source === 'admin' && (
            <Button type="button" variant="ghost" onClick={() => onSave({ poSecretKey: null, poWebhookSecret: null }, 'Compte Payment Orchestrator retiré')}>
              Retirer
            </Button>
          )}
          {test && <span className="text-[13px] text-muted">{test}</span>}
        </div>
      </form>
      <div>
        <p className="mb-1 text-[13px] font-medium">URL de webhook à ajouter dans payment.zurisell.store (Développeurs, Webhooks)</p>
        <code className="block truncate rounded-lg bg-surface-2 px-3 py-2 text-[12.5px]" title={po.webhookUrl}>
          {po.webhookUrl}
        </code>
      </div>
    </div>
  )
}

function ContactSettings({ contact, onSave, saving }: { contact: PlatformSettings['contact']; onSave: (body: { contactEmail: string | null; contactWhatsapp: string | null; socialLinks: string[] }) => void; saving: boolean }) {
  const [email, setEmail] = useState(contact.email)
  const [whatsapp, setWhatsapp] = useState(contact.whatsapp ?? '')
  const [socials, setSocials] = useState((contact.socials ?? []).join('\n'))
  return (
    <form
      className="grid gap-3 sm:grid-cols-2 sm:items-end"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ contactEmail: email.trim() || null, contactWhatsapp: whatsapp.trim() || null, socialLinks: socials.split(/\s+/).map((x) => x.trim()).filter(Boolean) })
      }}
    >
      <Input label="Email de contact" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@zurisell.store" />
      <Input label="WhatsApp" optional inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+229 01 23 45 67" />
      <Textarea
        label="Réseaux sociaux et fiches"
        optional
        rows={3}
        wrapClass="sm:col-span-2"
        value={socials}
        onChange={(e) => setSocials(e.target.value)}
        placeholder={'https://www.facebook.com/zurisell\nhttps://www.linkedin.com/company/zurisell\nhttps://www.producthunt.com/products/zuri'}
        hint="Un lien par ligne. Affichés en pied de page et donnés aux moteurs et aux IA comme comptes officiels de Zuri."
      />
      <Button type="submit" variant="primary" loading={saving}>
        Enregistrer
      </Button>
    </form>
  )
}

function PromoForm({ promo, billingOpen, onSave }: { promo: BillingPromo; billingOpen: boolean; onSave: (p: BillingPromo, msg: string) => void }) {
  const [label, setLabel] = useState(promo.label)
  const [percent, setPercent] = useState(String(promo.percent))
  const [end, setEnd] = useState(promo.endsAt.slice(0, 10))
  const live = promo.active && new Date(promo.endsAt).getTime() > Date.now()
  const body = (active: boolean): BillingPromo => ({ active, label: label.trim() || 'Black Friday', percent: Number(percent) || 0, endsAt: new Date(`${end}T23:59:59Z`).toISOString() })
  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-2 text-sm">
        {live ? <Badge tone="green">en cours</Badge> : <Badge tone="neutral">{promo.active ? 'terminée' : 'arrêtée'}</Badge>}
        <span>
          {promo.label} : -{promo.percent} % jusqu’au {fdate(promo.endsAt)}
        </span>
        {live && !billingOpen && <Badge tone="amber">paiement des abonnements fermé : seuls les comptes autorisés la voient</Badge>}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input label="Nom de l’offre" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} />
        <Input label="Réduction (%)" type="number" min={5} max={90} value={percent} onChange={(e) => setPercent(e.target.value)} />
        <Input label="Jusqu’au (inclus)" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => onSave(body(true), 'Offre enregistrée et active')}>
          Enregistrer et activer
        </Button>
        {promo.active && (
          <Button variant="ghost" onClick={() => onSave(body(false), 'Offre arrêtée')}>
            Arrêter l’offre
          </Button>
        )}
      </div>
    </div>
  )
}
