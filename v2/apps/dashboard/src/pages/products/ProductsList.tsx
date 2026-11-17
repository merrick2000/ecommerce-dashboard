import { Copy, ImageOff, MoreVertical, Package, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ConfirmDialog, useDialogState } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, ButtonLink, cx, EmptyState, ErrorState, Input, ListSkeleton, PageHeader, Segmented, Switch } from '@/components/ui'
import { useCurrentStore } from '@/hooks/auth'
import { useDeleteProduct, useDuplicateProduct, useProducts, useToggleProductActive } from '@/hooks/resources'
import { money, num } from '@/lib/format'
import type { ProductListItem } from '@/lib/types'

function Thumb({ src, name }: { src: string | null; name: string }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken)
    return (
      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-subtle" aria-hidden>
        <ImageOff className="size-5" />
      </div>
    )
  return <img src={src} alt={name} loading="lazy" onError={() => setBroken(true)} className="size-14 shrink-0 rounded-lg bg-surface-2 object-cover" />
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

function RowMenu({ onDuplicate, onDelete, busy }: { onDuplicate: () => void; onDelete: () => void; busy?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="icon" aria-label="Plus d’actions" aria-expanded={open} onClick={() => setOpen(!open)} loading={busy}>
        {!busy && <MoreVertical className="size-4" />}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div role="menu" className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg">
            <button
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-2"
              onClick={() => {
                setOpen(false)
                onDuplicate()
              }}
            >
              <Copy className="size-4" /> Dupliquer
            </button>
            <button
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-surface-2 dark:text-red-400"
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
            >
              <Trash2 className="size-4" /> Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function ProductsList() {
  const { storeId } = useCurrentStore()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, error, isPending, refetch } = useProducts()
  const toggle = useToggleProductActive()
  const duplicate = useDuplicateProduct()
  const del = useDeleteProduct()
  const confirmDelete = useDialogState<ProductListItem>()
  const [q, setQ] = useState('')
  const [type, setType] = useState<'all' | 'physical' | 'digital'>('all')

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (data ?? []).filter((p) => (type === 'all' || p.type === type) && (!s || p.name.toLowerCase().includes(s)))
  }, [data, q, type])

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
          <ButtonLink to="new" variant="primary">
            <Plus className="size-4" /> Nouveau produit
          </ButtonLink>
        }
      />

      {data && data.length > 0 && (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 z-[1] size-4 -translate-y-1/2 text-subtle" />
            <Input type="search" placeholder="Rechercher un produit" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" aria-label="Rechercher un produit" />
          </div>
          <Segmented
            label="Type"
            value={type}
            onChange={setType}
            options={[
              { value: 'all', label: 'Tous' },
              { value: 'physical', label: 'Physiques' },
              { value: 'digital', label: 'Digitaux' },
            ]}
          />
        </div>
      )}

      {error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <ListSkeleton />
      ) : !data.length ? (
        <EmptyState
          icon={<Package className="size-5" />}
          title="Aucun produit"
          description="Créez votre premier produit : physique avec paiement à la livraison, ou digital (ebook, formation…)."
          action={
            <ButtonLink to="new" variant="primary">
              <Plus className="size-4" /> Créer un produit
            </ButtonLink>
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
                      <Badge tone={p.type === 'physical' ? 'blue' : 'violet'}>{p.type === 'physical' ? 'Physique' : 'Digital'}</Badge>
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
                <span className={cx('tabular hidden text-sm md:block', p.trackInventory && p.stock != null && p.stock <= 3 && 'font-medium text-orange-600')}>{p.type === 'digital' ? '∞' : p.trackInventory ? (p.stock == null ? 'Par variante' : num(p.stock)) : '—'}</span>
                <span className="tabular hidden text-sm md:block">{num(p.sales)}</span>
                <div className="relative z-[1] flex items-center gap-1 md:contents">
                  <Switch size="sm" checked={p.isActive} onChange={(v) => toggle.mutate({ id: p.id, isActive: v }, { onError: (e) => toast.error(e) })} ariaLabel={p.isActive ? `Désactiver ${p.name}` : `Activer ${p.name}`} />
                  <div className="flex items-center">
                    <RowMenu busy={duplicate.isPending && duplicate.variables === p.id} onDuplicate={() => onDuplicate(p)} onDelete={() => confirmDelete.show(p)} />
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
