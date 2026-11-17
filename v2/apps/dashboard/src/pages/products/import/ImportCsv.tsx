import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, FileSpreadsheet, ImageOff, RefreshCw, Upload, XCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { useToast } from '@/components/Toast'
import { Badge, Button, ButtonLink, Card, Checkbox, cx, PageHeader, Select, Switch } from '@/components/ui'
import { useCurrentStore } from '@/hooks/auth'
import { refreshAfterProductChange } from '@/hooks/resources'
import { api, errorMessage } from '@/lib/api'
import { money } from '@/lib/format'

/** Formes renvoyées par l'API (apps/api/src/routes/product-import.ts). */
interface Candidate {
  index: number
  lines: number[]
  name: string
  type: 'physical' | 'digital'
  price: number | null
  compareAtPrice: number | null
  description: string
  images: string[]
  variantLabel: string | null
  variants: { name: string; price: number | null; stock: number | null; sku: string | null }[]
  stock: number | null
  sku: string | null
  isActive: boolean | null
  payment: 'cod' | 'native' | 'integration' | null
  errors: string[]
  warnings: string[]
}
type Mapping = Partial<Record<string, number>>
interface Preview {
  headers: string[]
  mapping: Mapping
  format: 'shopify' | 'zuri' | 'generic'
  products: Candidate[]
  total: number
  needsMapping: boolean
  fields: Record<string, string>
}
interface CommitResult {
  index: number
  ok: boolean
  id?: string
  name: string
  error?: string
  warnings: string[]
}

const MAX_BYTES = 5 * 1024 * 1024
/** Produits envoyés par appel : les images sont téléchargées côté serveur, on garde des appels courts. */
const BATCH = 5
const FORMAT_LABEL = { shopify: 'Export Shopify', zuri: 'Modèle Zuri', generic: 'Tableau personnalisé' } as const

/** UTF-8, sinon Windows-1252 (CSV enregistré par Excel). */
function decode(buf: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    return new TextDecoder('windows-1252').decode(buf)
  }
}

function Thumb({ src }: { src?: string }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken)
    return (
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-subtle">
        <ImageOff className="size-4" />
      </span>
    )
  return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="size-11 shrink-0 rounded-lg bg-surface-2 object-contain" />
}

export default function ImportCsv() {
  const { storeId, store } = useCurrentStore()
  const currency = store?.currency ?? 'XOF'
  const toast = useToast()
  const qc = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const base = `/stores/${storeId}`
  const [fileName, setFileName] = useState<string | null>(null)
  const [text, setText] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [mapping, setMapping] = useState<Mapping>({})
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [activate, setActivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [results, setResults] = useState<CommitResult[] | null>(null)
  const [open, setOpen] = useState<number | null>(null)

  const runPreview = async (csv: string, map?: Mapping) => {
    setLoading(true)
    setError(null)
    try {
      const p = await api.post<Preview>(`/stores/${storeId}/products/import/csv/preview`, { text: csv, mapping: map })
      setPreview(p)
      setMapping(p.mapping)
      // Par défaut : tous les produits sans erreur sont cochés.
      setSelected(new Set(p.products.filter((x) => !x.errors.length).map((x) => x.index)))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const pick = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_BYTES) return setError('Fichier trop lourd (5 Mo maximum).')
    if (!/\.(csv|txt)$/i.test(file.name) && !file.type.includes('csv') && !file.type.startsWith('text/')) {
      return setError('Enregistrez votre tableau au format CSV (Excel : Fichier, Enregistrer sous, CSV UTF-8).')
    }
    const csv = decode(await file.arrayBuffer())
    setFileName(file.name)
    setText(csv)
    setResults(null)
    await runPreview(csv)
    if (input.current) input.current.value = ''
  }

  const downloadTemplate = async () => {
    try {
      const res = await fetch(`/api/stores/${storeId}/products/import/csv/template`, { credentials: 'include' })
      if (!res.ok) throw new Error()
      const url = URL.createObjectURL(await res.blob())
      const a = document.createElement('a')
      a.href = url
      a.download = 'modele-import-zuri.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Téléchargement du modèle impossible')
    }
  }

  const products = preview?.products ?? []
  const importable = products.filter((p) => !p.errors.length)
  const chosen = products.filter((p) => selected.has(p.index) && !p.errors.length)

  const runImport = async () => {
    if (!chosen.length) return
    const all: CommitResult[] = []
    setProgress({ done: 0, total: chosen.length })
    for (let i = 0; i < chosen.length; i += BATCH) {
      const items = chosen.slice(i, i + BATCH).map(({ lines: _l, errors: _e, warnings: _w, isActive: _a, ...rest }) => rest)
      try {
        const r = await api.post<{ results: CommitResult[] }>(`/stores/${storeId}/products/import/csv/commit`, { items, activate })
        all.push(...r.results)
      } catch (e) {
        // Lot en échec (réseau…) : on le note et on continue avec les suivants.
        for (const it of items) all.push({ index: it.index, ok: false, name: it.name, error: errorMessage(e), warnings: [] })
      }
      setProgress({ done: Math.min(i + BATCH, chosen.length), total: chosen.length })
    }
    setResults(all)
    setProgress(null)
    refreshAfterProductChange(qc, storeId)
    const ok = all.filter((r) => r.ok).length
    if (ok) toast.success(`${ok} produit${ok > 1 ? 's' : ''} importé${ok > 1 ? 's' : ''}`)
  }

  const back = (
    <Link to={`${base}/products/import`} className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Importer
    </Link>
  )

  // ─── Résultat ───
  if (results) {
    const created = results.filter((r) => r.ok)
    const failed = results.filter((r) => !r.ok)
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader back={back} title="Import terminé" />
        <Card>
          <div className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/40">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{created.length}</p>
                <p className="text-sm text-muted">créé{created.length > 1 ? 's' : ''}{activate ? ' et activé' + (created.length > 1 ? 's' : '') : ' (inactifs)'}</p>
              </div>
              <div className="rounded-xl bg-surface-2 p-4">
                <p className="text-2xl font-bold">{products.length - chosen.length}</p>
                <p className="text-sm text-muted">ignoré{products.length - chosen.length > 1 ? 's' : ''}</p>
              </div>
              <div className={cx('rounded-xl p-4', failed.length ? 'bg-red-50 dark:bg-red-950/40' : 'bg-surface-2')}>
                <p className={cx('text-2xl font-bold', failed.length > 0 && 'text-red-700 dark:text-red-400')}>{failed.length}</p>
                <p className="text-sm text-muted">en erreur</p>
              </div>
            </div>
            {created.length > 0 && (
              <ul className="divide-y divide-line rounded-xl border border-line">
                {created.map((r) => (
                  <li key={r.index} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    <Link to={`${base}/products/${r.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                      {r.name}
                    </Link>
                    {r.warnings.length > 0 && <span className="text-xs text-amber-700 dark:text-amber-400">{r.warnings.join(' · ')}</span>}
                  </li>
                ))}
              </ul>
            )}
            {failed.length > 0 && (
              <ul className="divide-y divide-line rounded-xl border border-red-200 dark:border-red-900">
                {failed.map((r) => (
                  <li key={r.index} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                    <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{r.name || 'Sans nom'}</span>
                      <span className="block text-xs text-red-700 dark:text-red-400">{r.error}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <ButtonLink to={`${base}/products`} variant="primary">
                Voir mes produits
              </ButtonLink>
              <Button
                onClick={() => {
                  setResults(null)
                  setPreview(null)
                  setText(null)
                  setFileName(null)
                }}
              >
                Importer un autre fichier
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const columnField = (col: number) => Object.entries(mapping).find(([, c]) => c === col)?.[0] ?? ''
  const setColumnField = (col: number, field: string) => {
    const next: Mapping = {}
    for (const [f, c] of Object.entries(mapping)) if (c !== col && f !== field && c !== undefined) next[f] = c
    if (field) next[field] = col
    setMapping(next)
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader back={back} title="Importer depuis un fichier CSV" description="Modèle Zuri, export Shopify ou votre propre tableau. Les produits sont créés inactifs par défaut." />

      <div className="space-y-4">
        <Card>
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                void pick(e.dataTransfer.files[0])
              }}
              disabled={loading || !!progress}
              className="flex flex-1 items-center gap-4 rounded-xl border border-dashed border-line-strong bg-surface-2/50 p-5 text-left transition hover:border-accent"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                {loading ? <RefreshCw className="size-5 animate-spin" /> : <FileSpreadsheet className="size-5" />}
              </span>
              <span>
                <span className="block text-sm font-semibold">{fileName ?? 'Choisir ou déposer un fichier CSV'}</span>
                <span className="block text-xs text-muted">{loading ? 'Analyse du fichier…' : 'CSV séparé par « , » ou « ; », 5 Mo et 500 produits maximum'}</span>
              </span>
            </button>
            <Button variant="ghost" onClick={downloadTemplate}>
              <Download className="size-4" /> Télécharger le modèle
            </Button>
            <input ref={input} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
          </div>
          {error && (
            <p role="alert" className="mx-5 mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}
        </Card>

        {preview && (
          <Card
            title="Correspondance des colonnes"
            description={preview.needsMapping ? 'Indiquez au moins la colonne du nom et celle du prix.' : `${FORMAT_LABEL[preview.format]} détecté. Ajustez si une colonne a été mal reconnue.`}
            actions={
              <Button size="sm" onClick={() => text && runPreview(text, mapping)} loading={loading} disabled={mapping.name === undefined || mapping.price === undefined}>
                <RefreshCw className="size-3.5" /> Appliquer
              </Button>
            }
          >
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {preview.headers.map((h, col) => (
                <Select
                  key={`${h}-${col}`}
                  label={h || `Colonne ${col + 1}`}
                  value={columnField(col)}
                  onChange={(e) => setColumnField(col, e.target.value)}
                  options={[{ value: '', label: 'Ignorer' }, ...Object.entries(preview.fields).map(([value, label]) => ({ value, label }))]}
                />
              ))}
            </div>
          </Card>
        )}

        {products.length > 0 && (
          <Card
            title={`${products.length} produit${products.length > 1 ? 's' : ''} détecté${products.length > 1 ? 's' : ''}`}
            description={`${importable.length} prêt${importable.length > 1 ? 's' : ''}, ${products.length - importable.length} en erreur`}
            actions={
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={chosen.length === importable.length && importable.length > 0}
                  onChange={(v) => setSelected(new Set(v ? importable.map((p) => p.index) : []))}
                  label="Tout sélectionner"
                />
                Tout
              </label>
            }
          >
            <ul className="divide-y divide-line">
              {products.map((p) => {
                const status = p.errors.length ? 'error' : p.warnings.length ? 'warn' : 'ok'
                const expanded = open === p.index
                return (
                  <li key={p.index} className={cx('px-4 py-3 sm:px-5', status === 'error' && 'bg-red-50/40 dark:bg-red-950/20')}>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selected.has(p.index) && status !== 'error'}
                        onChange={(v) =>
                          setSelected((s) => {
                            const n = new Set(s)
                            if (v) n.add(p.index)
                            else n.delete(p.index)
                            return n
                          })
                        }
                        label={`Importer ${p.name || 'ce produit'}`}
                      />
                      <Thumb src={p.images[0]} />
                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpen(expanded ? null : p.index)} aria-expanded={expanded}>
                        <span className="block truncate text-sm font-semibold">{p.name || <span className="text-muted">Sans nom</span>}</span>
                        <span className="block text-xs text-muted">
                          {p.type === 'digital' ? 'Digital' : 'Physique'} · {p.variants.length ? `${p.variants.length} variante${p.variants.length > 1 ? 's' : ''}` : 'sans variante'} · {p.images.length} image{p.images.length > 1 ? 's' : ''} · ligne{p.lines.length > 1 ? 's' : ''} {p.lines.join(', ')}
                        </span>
                      </button>
                      <span className="tabular hidden text-sm font-semibold sm:block">
                        {p.price != null ? money(p.price, currency) : '-'}
                        {p.compareAtPrice != null && <s className="ml-1.5 text-xs font-normal text-muted">{money(p.compareAtPrice, currency)}</s>}
                      </span>
                      {status === 'error' ? (
                        <Badge tone="red">Erreur</Badge>
                      ) : status === 'warn' ? (
                        <Badge tone="amber">À vérifier</Badge>
                      ) : (
                        <Badge tone="green">Prêt</Badge>
                      )}
                    </div>
                    {(expanded || status === 'error') && (p.errors.length > 0 || p.warnings.length > 0 || p.variants.length > 0) && (
                      <div className="mt-2 ml-[4.75rem] space-y-1 text-xs">
                        {p.errors.map((e) => (
                          <p key={e} className="flex items-center gap-1.5 text-red-700 dark:text-red-400">
                            <XCircle className="size-3.5" /> {e}
                          </p>
                        ))}
                        {p.warnings.map((w) => (
                          <p key={w} className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="size-3.5" /> {w}
                          </p>
                        ))}
                        {expanded && p.variants.length > 0 && (
                          <p className="text-muted">
                            {p.variantLabel} : {p.variants.map((v) => (v.price != null ? `${v.name} (${money(v.price, currency)})` : v.name)).join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
        )}

        {products.length > 0 && (
          <Card>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex-1">
                <Switch checked={activate} onChange={setActivate} label="Activer directement" description="Sinon, les produits sont créés inactifs : vous les vérifiez avant de les mettre en vente." />
              </div>
              <Button variant="primary" size="lg" onClick={runImport} disabled={!chosen.length || !!progress} loading={!!progress}>
                <Upload className="size-4" /> Importer {chosen.length} produit{chosen.length > 1 ? 's' : ''}
              </Button>
            </div>
            {progress && (
              <div className="px-5 pb-5" role="status" aria-live="polite">
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">Import en cours, images comprises…</span>
                  <span className="tabular text-muted">
                    {progress.done} / {progress.total} produits importés
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${Math.max(4, (progress.done / progress.total) * 100)}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted">Gardez cette page ouverte jusqu’à la fin.</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
