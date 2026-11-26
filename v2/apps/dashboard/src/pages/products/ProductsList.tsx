import { Camera, Copy, ExternalLink, MoreVertical, Package, Pencil, Plus, Search, Sparkles, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ConfirmDialog, useDialogState } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, ButtonLink, cx, EmptyState, ErrorState, Input, ListSkeleton, PageHeader, Switch } from '@/components/ui'
import { useCan, useCurrentStore, useMe } from '@/hooks/auth'
import { ExportCatalog } from './ExportCatalog'
import { PhotoNudge } from '@/components/PhotoNudge'
import { useDeleteProduct, useDuplicateProduct, useProducts, useToggleProductActive } from '@/hooks/resources'
import { money, num } from '@/lib/format'
import type { ProductListItem } from '@/lib/types'

function Thumb({ src, name }: { src: string | null; name: string }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken)
    return (
      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-line-strong text-subtle" title="Sans photo : ajoutez-en une, elle attire les clients">
        <Camera className="size-5" aria-hidden />
        <span className="sr-only">Sans photo</span>
      </div>
    )
  return <img src={src} alt={name} loading="lazy" onError={() => setBroken(true)} className="size-14 shrink-0 rounded-lg bg-surface-2 object-contain" />
}

function Price({ p }: { p: ProductListItem }) {
  const promo = p.price.effective < p.price.regular
  return (
    <span className="tabular">
      <span className="font-semibold">{money(p.price.effective, p.price.currency)}</span>
      {promo && <span className="ml-1.5 text-[13px] text-subtle line-through">{money(p.price.regular, p.price.currency)}</span>}
    </span>
  )
}

/** Adresse publique de la page de vente (sous-domaine de la boutique). */
export const salesPageUrl = (storeSlug: string, productId: string) => `https://${storeSlug}.zurisell.store/p/${productId}?notrack`

const MENU_WIDTH = 208

/**
 * Menu d'actions d'une ligne. Affiché en position fixe (au-dessus de la page) pour ne jamais
 * être coupé par le tableau ; s'ouvre vers le haut s'il n'y a pas la place en dessous.
 */
function RowMenu({ editHref, viewHref, onDuplicate, onDelete, busy, canEdit = true }: { editHref: string; viewHref: string | null; onDuplicate: () => void; onDelete: () => void; busy?: boolean; canEdit?: boolean }) {
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null)
  const button = useRef<HTMLButtonElement>(null)
  const close = () => setPos(null)

  useEffect(() => {
    if (!pos) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [pos])

  const toggle = () => {
    if (pos) return close()
    const r = button.current?.getBoundingClientRect()
    if (!r) return
    const left = Math.max(8, Math.min(r.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8))
    const spaceBelow = window.innerHeight - r.bottom
    setPos(spaceBelow < 200 ? { bottom: window.innerHeight - r.top + 4, left } : { top: r.bottom + 4, left })
  }

  const item = 'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-surface-2'
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Button ref={button} variant="ghost" size="icon" aria-label="Plus d’actions" aria-haspopup="menu" aria-expanded={!!pos} onClick={toggle} loading={busy}>
        {!busy && <MoreVertical className="size-4" />}
      </Button>
      {pos && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden />
          <div role="menu" style={{ ...pos, width: MENU_WIDTH }} className="fixed z-50 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-xl">
            <Link role="menuitem" to={editHref} className={item} onClick={close}>
              <Pencil className="size-4" /> {canEdit ? 'Modifier' : 'Voir'}
            </Link>
            {viewHref && (
              <a role="menuitem" href={viewHref} target="_blank" rel="noreferrer" className={item} onClick={close}>
                <ExternalLink className="size-4" /> Voir la page de vente
              </a>
            )}
            {canEdit && (
              <>
            <button
              role="menuitem"
              className={item}
              onClick={() => {
                close()
                onDuplicate()
              }}
            >
              <Copy className="size-4" /> Dupliquer
            </button>
            <div className="my-1 h-px bg-line" />
            <button
              role="menuitem"
              className={cx(item, 'text-red-600 dark:text-red-400')}
              onClick={() => {
                close()
                onDelete()
              }}
            >
              <Trash2 className="size-4" /> Supprimer
            </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function ProductsList() {
  const { storeId, store } = useCurrentStore()
  const canEdit = useCan('products.edit')
  const { data: me } = useMe()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, error, isPending, refetch } = useProducts()
  const toggle = useToggleProductActive()
  const duplicate = useDuplicateProduct()
  const del = useDeleteProduct()
  const confirmDelete = useDialogState<ProductListItem>()
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (data ?? []).filter((p) => !s || p.name.toLowerCase().includes(s))
  }, [data, q])

  const onDuplicate = (p: ProductListItem) =>
    duplicate.mutate(p.id, {
      onSuccess: (copy) => {
        toast.success('Produit dupliqué (inactif)')
        navigate(String(copy.id))
      },
      onError: (e) => toast.error(e),
    })

  return (
    <>
      <PageHeader
        title="Produits"
        actions={
          canEdit && (
            <div className="flex flex-wrap gap-2">
              <ButtonLink to="import">
                <Upload className="size-4" /> Importer
              </ButtonLink>
              <ExportCatalog />
              <ButtonLink to="new" variant="primary">
                <Plus className="size-4" /> Nouveau produit
              </ButtonLink>
            </div>
          )
        }
      />

      {data && data.length > 0 && <PhotoNudge />}
      {data && data.length > 0 && (
        <div className="mb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 z-[1] size-4 -translate-y-1/2 text-subtle" />
            <Input type="search" placeholder="Rechercher un produit" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" aria-label="Rechercher un produit" />
          </div>
        </div>
      )}

      {error && !data ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <ListSkeleton />
      ) : !data.length ? (
        <EmptyState
          icon={<Package className="size-5" />}
          title="Aucun produit"
          description="Créez votre premier produit : physique avec paiement à la livraison, ou digital (ebook, formation…)."
          action={
            canEdit && (
              <div className="flex flex-wrap justify-center gap-2">
                {me?.features.urlImport && (
                  <ButtonLink to="import/url">
                    <Sparkles className="size-4" /> Importer depuis un lien avec l’IA
                  </ButtonLink>
                )}
                <ButtonLink to="new" variant="primary">
                  <Plus className="size-4" /> Créer un produit
                </ButtonLink>
              </div>
            )
          }
        />
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Aucun produit ne correspond à la recherche.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {/* En-tête de tableau, desktop uniquement */}
          <div className="hidden grid-cols-[1fr_140px_90px_90px_70px_48px] gap-4 border-b border-line px-4 py-2.5 text-[12px] font-medium text-muted md:grid">
            <span>Produit</span>
            <span>Prix</span>
            <span>Stock</span>
            <span>Ventes</span>
            <span>Actif</span>
            <span />
          </div>
          <ul className="divide-y divide-line">
            {rows.map((p) => (
              <li key={p.id} className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 hover:bg-surface-2/60 md:grid-cols-[1fr_140px_90px_90px_70px_48px] md:gap-4">
                <div className="contents md:flex md:min-w-0 md:items-center md:gap-3">
                  <Thumb src={p.thumbnail} name={p.name} />
                  <div className="min-w-0">
                    <Link to={String(p.id)} className="block truncate font-medium after:absolute after:inset-0 hover:underline md:after:hidden">
                      {p.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {!p.isActive && <Badge>Inactif</Badge>}
                      {p.pending > 0 && <Badge tone="amber">{p.pending} à traiter</Badge>}
                      <span className="text-[13px] md:hidden">
                        <Price p={p} />
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-subtle md:hidden">
                      {num(p.sales)} vente(s)
                      {p.trackInventory && p.stock != null && ` · stock ${num(p.stock)}`}
                    </p>
                  </div>
                </div>
                <span className="hidden text-sm md:block">
                  <Price p={p} />
                </span>
                <span className={cx('tabular hidden text-sm md:block', p.trackInventory && p.stock != null && p.stock <= 3 && 'font-medium text-orange-600')}>{p.type === 'digital' ? '∞' : p.trackInventory ? (p.stock == null ? 'Par variante' : num(p.stock)) : '-'}</span>
                <span className="tabular hidden text-sm md:block">{num(p.sales)}</span>
                <div className="relative z-[1] flex items-center gap-1 md:contents">
                  <Switch size="sm" disabled={!canEdit} checked={p.isActive} onChange={(v) => toggle.mutate({ id: p.id, isActive: v }, { onError: (e) => toast.error(e) })} ariaLabel={p.isActive ? `Désactiver ${p.name}` : `Activer ${p.name}`} />
                  <div className="flex items-center">
                    <RowMenu busy={duplicate.isPending && duplicate.variables === p.id} editHref={`/stores/${storeId}/products/${p.id}`} viewHref={store ? salesPageUrl(store.slug, p.id) : null} onDuplicate={() => onDuplicate(p)} onDelete={() => confirmDelete.show(p)} canEdit={canEdit} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete.open}
        onClose={confirmDelete.close}
        title="Supprimer ce produit ?"
        message={
          <>
            <strong className="text-fg">{confirmDelete.value?.name}</strong> sera supprimé définitivement. Les commandes passées restent consultables.
          </>
        }
        confirmLabel="Supprimer"
        danger
        loading={del.isPending}
        onConfirm={() =>
          confirmDelete.value &&
          del.mutate(confirmDelete.value.id, {
            onSuccess: () => {
              toast.success('Produit supprimé')
              confirmDelete.close()
            },
            onError: (e) => toast.error(e),
          })
        }
      />
    </>
  )
}
