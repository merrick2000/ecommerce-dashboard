/**
 * « API et IA » : clés personnelles pour piloter Zuri depuis Claude, ChatGPT, Cursor ou une automatisation,
 * via le serveur MCP (outils en anglais) ou l'API REST. Une clé n'a jamais plus de droits que son propriétaire.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, Check, Copy, KeyRound, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog, useDialogState } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, cx, EmptyState, ErrorState, Input, ListSkeleton, PageHeader, Select } from '@/components/ui'
import { useCurrentStore } from '@/hooks/auth'
import { api, errorMessage } from '@/lib/api'
import { relative } from '@/lib/format'

interface ApiKeyRow {
  id: number
  name: string
  prefix: string
  scope: 'read' | 'write'
  storeId: string | null
  storeName: string | null
  lastUsedAt: string | null
  createdAt: string
}

const MCP_URL = `${window.location.origin}/api/mcp`
const KEY = ['api-keys'] as const

function CopyBlock({ text, label }: { text: string; label?: string }) {
  const toast = useToast()
  const [done, setDone] = useState(false)
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border border-line bg-surface-2 p-3 pr-12 text-[12.5px] leading-relaxed whitespace-pre-wrap break-all">{text}</pre>
      <button
        type="button"
        aria-label={label ?? 'Copier'}
        onClick={() => {
          void navigator.clipboard?.writeText(text).then(() => {
            setDone(true)
            toast.success('Copié')
            setTimeout(() => setDone(false), 1500)
          })
        }}
        className="absolute top-2 right-2 rounded-md border border-line bg-surface p-1.5 text-muted hover:text-fg"
      >
        {done ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  )
}

const CLIENTS = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    help: 'Dans un terminal :',
    snippet: (k: string) => `claude mcp add --transport http zuri ${MCP_URL} --header "Authorization: Bearer ${k}"`,
  },
  {
    id: 'claude-desktop',
    label: 'Claude Desktop',
    help: 'Réglages > Développeur > Modifier la configuration, ajoute ce bloc puis redémarre Claude (Node.js requis) :',
    snippet: (k: string) =>
      JSON.stringify({ mcpServers: { zuri: { command: 'npx', args: ['-y', 'mcp-remote', MCP_URL, '--header', `Authorization: Bearer ${k}`] } } }, null, 2),
  },
  {
    id: 'cursor',
    label: 'Cursor, Windsurf, VS Code',
    help: 'Fichier mcp.json (Cursor : Settings > MCP) :',
    snippet: (k: string) => JSON.stringify({ mcpServers: { zuri: { url: MCP_URL, headers: { Authorization: `Bearer ${k}` } } } }, null, 2),
  },
  {
    id: 'rest',
    label: 'API REST, n8n, Make',
    help: 'Toutes les routes du tableau de bord acceptent la clé, par exemple :',
    snippet: (k: string) => `curl ${window.location.origin}/api/auth/me \\\n  -H "Authorization: Bearer ${k}"`,
  },
] as const

/** Exemples pour une boutique digitale : paiements, accès, paniers. */
const DIGITAL_EXAMPLES = [
  'Fais-moi le récap des ventes du mois : taux de paiement, raisons des refus, opérateurs utilisés.',
  'Liste les paiements refusés de cette semaine et envoie le lien de paiement à chacun par email.',
  'Awa dit qu’elle n’a pas reçu son ebook : renvoie-lui l’accès à awa.diop@gmail.com.',
  'Relance par email tous les paniers abandonnés d’hier.',
  'Crée un pack « Formation + coaching » à 25 000 FCFA avec une offre complémentaire après l’achat.',
  'Crée le code BLACKFRIDAY à -30 % valable jusqu’à dimanche.',
]

const EXAMPLES = [
  'Fais-moi le récap des ventes de la semaine dernière comparé à la semaine d’avant, par produit.',
  'Quelles commandes sont à appeler depuis plus de 24 h ? Classe-les par ville.',
  'Importe ce produit depuis ce lien, réécris la page de vente pour des femmes à Abidjan, prix 15 000 FCFA, et mets-le en vente.',
  'Ajoute 3 questions fréquentes sur la livraison et un pack de 2 à la fiche « Perruque lisse ».',
  'Quel closer a le meilleur taux de confirmation ce mois-ci ?',
  'Crée le code TABASKI à -15 % valable jusqu’à dimanche.',
]

export default function ApiKeys() {
  const { store, storeId } = useCurrentStore()
  const toast = useToast()
  const qc = useQueryClient()
  const keys = useQuery({ queryKey: KEY, queryFn: () => api.get<ApiKeyRow[]>('/api-keys') })
  const [name, setName] = useState('Claude')
  const [scope, setScope] = useState<'write' | 'read'>('write')
  const [where, setWhere] = useState<'store' | 'all'>('store')
  const [created, setCreated] = useState<string | null>(null)
  const [client, setClient] = useState<(typeof CLIENTS)[number]['id']>('claude-code')
  const revoke = useDialogState<ApiKeyRow>()

  const create = useMutation({
    mutationFn: () => api.post<{ key: string }>('/api-keys', { name: name.trim() || 'Clé', scope, storeId: where === 'store' && store ? storeId : null }),
    onSuccess: (r) => {
      setCreated(r.key)
      void qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/api-keys/${id}`),
    onSuccess: () => {
      toast.success('Clé révoquée : elle ne fonctionne plus')
      revoke.close()
      void qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const shownKey = created ?? 'zk_live_TA_CLE'
  const current = CLIENTS.find((c) => c.id === client)!

  return (
    <div>
      <PageHeader
        title="API et IA"
        description="Pilote ta boutique depuis Claude, ChatGPT, Cursor ou tes automatisations : créer et modifier des fiches produit, suivre les commandes, sortir tes récaps de ventes sur n’importe quelle période."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <div className="space-y-4">
          <Card title="1. Crée une clé" description="Une clé agit en ton nom, avec exactement tes droits. Garde-la secrète comme un mot de passe.">
            {created ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Clé créée. Copie-la maintenant : elle ne sera plus jamais affichée.</p>
                <CopyBlock text={created} label="Copier la clé" />
                <Button size="sm" variant="ghost" onClick={() => setCreated(null)}>
                  C’est fait, j’ai copié la clé
                </Button>
              </div>
            ) : (
              <form
                className="grid gap-3 sm:grid-cols-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  create.mutate()
                }}
              >
                <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Claude, n8n…" />
                <Select
                  label="Boutiques"
                  value={where}
                  onChange={(e) => setWhere(e.target.value as 'store' | 'all')}
                  options={[
                    { value: 'store', label: store ? `Seulement ${store.name}` : 'Cette boutique' },
                    { value: 'all', label: 'Toutes mes boutiques' },
                  ]}
                />
                <Select
                  label="Droits"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as 'write' | 'read')}
                  options={[
                    { value: 'write', label: 'Lecture et modifications' },
                    { value: 'read', label: 'Lecture seule (stats, commandes)' },
                  ]}
                />
                <div className="sm:col-span-3">
                  <Button type="submit" variant="primary" loading={create.isPending}>
                    <KeyRound className="size-4" /> Créer la clé
                  </Button>
                </div>
              </form>
            )}
          </Card>

          <Card title="2. Branche ton IA" description={`Adresse du serveur MCP : ${MCP_URL}`}>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {CLIENTS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setClient(c.id)}
                  className={cx('rounded-full border px-3 py-1 text-[13px] font-medium', client === c.id ? 'border-accent bg-accent-soft text-fg' : 'border-line text-muted hover:text-fg')}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="mb-2 text-[13px] text-muted">{current.help}</p>
            <CopyBlock text={current.snippet(shownKey)} />
            {!created && <p className="mt-2 text-[12px] text-muted">Remplace zk_live_TA_CLE par ta clé (affichée une seule fois à sa création).</p>}
          </Card>

          <Card title="Mes clés">
            {keys.isPending ? (
              <ListSkeleton rows={2} />
            ) : keys.error ? (
              <ErrorState error={keys.error} onRetry={() => void keys.refetch()} />
            ) : !keys.data.length ? (
              <EmptyState icon={<KeyRound className="size-5" />} title="Aucune clé pour le moment" description="Crée une clé ci-dessus pour connecter ton assistant." />
            ) : (
              <ul className="divide-y divide-line">
                {keys.data.map((k) => (
                  <li key={k.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {k.name}
                        <Badge tone={k.scope === 'write' ? 'amber' : 'neutral'}>{k.scope === 'write' ? 'Lecture et modifications' : 'Lecture seule'}</Badge>
                        <Badge>{k.storeName ?? 'Toutes les boutiques'}</Badge>
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted">
                        <code>{k.prefix}…</code> · créée {relative(k.createdAt)} · {k.lastUsedAt ? `utilisée ${relative(k.lastUsedAt)}` : 'jamais utilisée'}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => revoke.show(k)}>
                      <Trash2 className="size-3.5" /> Révoquer
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Ce que tu peux demander">
            <ul className="space-y-2.5">
              {(store?.kind === 'digital' ? DIGITAL_EXAMPLES : EXAMPLES).map((x) => (
                <li key={x} className="flex gap-2 text-[13px]">
                  <Bot className="mt-0.5 size-4 shrink-0 text-accent" />
                  <span>« {x} »</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Sécurité">
            <ul className="list-disc space-y-1.5 pl-4 text-[13px] text-muted">
              <li>La clé a tes droits, jamais plus : un closer ne voit que ses produits, sans montants s’il n’y a pas accès.</li>
              <li>Pas d’accès aux clés de paiement, à l’abonnement ni aux autres clés.</li>
              <li>Les suppressions demandent une confirmation explicite.</li>
              <li>Chaque action faite par l’IA apparaît dans l’Activité avec la mention « via API ».</li>
              <li>Une clé perdue se révoque en un clic.</li>
            </ul>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={revoke.open}
        onClose={revoke.close}
        onConfirm={() => revoke.value && remove.mutate(revoke.value.id)}
        title="Révoquer cette clé ?"
        message={`« ${revoke.value?.name ?? ''} » cessera immédiatement de fonctionner. Les assistants qui l’utilisent devront recevoir une nouvelle clé.`}
        confirmLabel="Révoquer"
        danger
        loading={remove.isPending}
      />
    </div>
  )
}
