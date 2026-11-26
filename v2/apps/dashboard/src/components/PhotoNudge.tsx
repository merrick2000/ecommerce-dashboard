/**
 * Rappel discret : des produits sans photo. Une photo donne envie d'acheter et rassure ;
 * l'encart propose d'en ajouter une, puis se fait oublier 7 jours si on le ferme.
 */
import { Camera, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { buttonClass } from '@/components/ui'
import { useCan, useStoreId } from '@/hooks/auth'
import { useProducts } from '@/hooks/resources'
import { readLocal, writeLocal } from '@/lib/storage'

const WEEK = 7 * 24 * 3600_000

export function PhotoNudge() {
  const storeId = useStoreId()
  const canEdit = useCan('products.edit')
  const key = `photo-nudge:${storeId}`
  const [hiddenUntil, setHiddenUntil] = useState(() => Number(readLocal(key) ?? 0))
  const hidden = hiddenUntil > Date.now()
  const { data } = useProducts(canEdit && !hidden)
  if (!canEdit || hidden || !data) return null
  const missing = data.filter((p) => !p.thumbnail)
  if (!missing.length) return null
  const n = missing.length
  const first = missing.find((p) => p.isActive) ?? missing[0]!
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3" role="status">
      <Camera className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">{n === 1 ? `« ${first.name} » n’a pas encore de photo` : `${n} produits n’ont pas encore de photo`}</p>
        <p className="mt-0.5 text-muted">Une photo donne envie d’acheter et rassure vos clients. Une photo prise au téléphone suffit, ça prend une minute.</p>
        <Link to={`/stores/${storeId}/products/${first.id}`} className={`${buttonClass('secondary', 'sm')} mt-2`}>
          Ajouter une photo
        </Link>
      </div>
      <button
        type="button"
        onClick={() => {
          const until = Date.now() + WEEK
          writeLocal(key, String(until))
          setHiddenUntil(until)
        }}
        className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
        aria-label="Me le rappeler plus tard"
        title="Me le rappeler plus tard"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
