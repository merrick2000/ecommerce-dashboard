import { ArrowDown, ArrowUp, ImagePlus, Link2, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useToast } from '@/components/Toast'
import { Button, cx, Field, Input } from '@/components/ui'
import { useStoreId } from '@/hooks/auth'
import { uploadImage } from '@/hooks/resources'
import { errorMessage } from '@/lib/api'

/**
 * Champ numérique : garde le texte saisi localement (« 15 000 », « 12, ») et
 * émet un nombre (ou null si vide). Évite les sauts de curseur des <input type=number>.
 */
export function NumberField({
  value,
  onChange,
  label,
  error,
  hint,
  suffix,
  placeholder,
  integer = true,
  optional,
  wrapClass,
  ariaLabel,
}: {
  value: number | null | undefined
  onChange: (v: number | null) => void
  label?: ReactNode
  error?: string
  hint?: ReactNode
  suffix?: ReactNode
  placeholder?: string
  integer?: boolean
  optional?: boolean
  wrapClass?: string
  ariaLabel?: string
}) {
  const fmt = (v: number | null | undefined) => (v == null ? '' : String(v))
  const [text, setText] = useState(fmt(value))
  const last = useRef(value)
  useEffect(() => {
    if (value !== last.current) {
      last.current = value
      setText(fmt(value))
    }
  }, [value])
  return (
    <Input
      label={label}
      error={error}
      hint={hint}
      suffix={suffix}
      optional={optional}
      wrapClass={wrapClass}
      aria-label={ariaLabel}
      inputMode={integer ? 'numeric' : 'decimal'}
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        const raw = e.target.value
        setText(raw)
        const cleaned = raw.replace(/[\s  ]/g, '').replace(',', '.')
        const n = cleaned === '' ? null : Number(cleaned)
        if (n === null || Number.isFinite(n)) {
          last.current = n
          onChange(n)
        }
      }}
    />
  )
}

/** Liste éditable générique (FAQ, témoignages, points forts…) avec réordonnancement. */
export function ListEditor<T>({
  items,
  onChange,
  render,
  create,
  addLabel,
  max,
  empty,
}: {
  items: T[]
  onChange: (items: T[]) => void
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode
  create: () => T
  addLabel: string
  max?: number
  empty?: string
}) {
  const move = (i: number, d: -1 | 1) => {
    const next = [...items]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    onChange(next)
  }
  return (
    <div className="space-y-2.5">
      {items.length === 0 && empty && <p className="text-sm text-muted">{empty}</p>}
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface-2/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-medium text-subtle">#{i + 1}</span>
            <div className="flex gap-0.5">
              <Button size="sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter">
                <ArrowUp className="size-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Descendre">
                <ArrowDown className="size-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Supprimer" className="text-red-600 dark:text-red-400">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          {render(item, (patch) => onChange(items.map((x, k) => (k === i ? { ...x, ...patch } : x))), i)}
        </div>
      ))}
      {(max === undefined || items.length < max) && (
        <Button size="sm" onClick={() => onChange([...items, create()])}>
          + {addLabel}
        </Button>
      )}
    </div>
  )
}

type Preset = 'cover' | 'thumbnail' | 'content' | 'gallery'

/** Envoi d'image vers /uploads/image, avec repli « coller une URL » (utile si S3 indisponible). */
export function ImageUpload({
  value,
  onChange,
  preset,
  label,
  hint,
  aspect = 'square',
  error,
}: {
  value: string | null
  onChange: (v: string | null) => void
  preset: Preset
  label: string
  hint?: string
  aspect?: 'square' | 'video'
  error?: string
}) {
  const storeId = useStoreId()
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  /** null = inactif ; 0..1 = envoi ; 1 = envoyé, le serveur optimise l'image. */
  const [progress, setProgress] = useState<number | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [urlMode, setUrlMode] = useState(false)
  const [url, setUrl] = useState('')
  const busy = progress !== null

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview)
  }, [localPreview])

  const pick = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setUploadError('Choisissez un fichier image (JPG, PNG, WebP).')
    if (file.size > 15 * 1024 * 1024) return setUploadError('Image trop lourde : 15 Mo maximum.')
    setUploadError(null)
    // Aperçu immédiat de la photo choisie, pendant l'envoi.
    setLocalPreview(URL.createObjectURL(file))
    setProgress(0)
    try {
      const r = await uploadImage(storeId, file, preset, setProgress)
      onChange(r.url ?? r.key)
      toast.success('Image envoyée')
    } catch (e) {
      setUploadError(errorMessage(e))
    } finally {
      setProgress(null)
      setLocalPreview(null)
      if (input.current) input.current.value = ''
    }
  }

  const shown = localPreview ?? value
  return (
    <Field label={label} hint={hint} error={error ?? uploadError ?? undefined}>
      <div className={cx('relative overflow-hidden rounded-xl border border-dashed border-line-strong bg-surface-2', aspect === 'video' ? 'aspect-video' : 'aspect-square max-w-48')}>
        {shown ? (
          <>
            <PreviewImage src={shown} dimmed={busy} />
            {busy && <UploadOverlay progress={progress} />}
            {!busy && (
              <button type="button" onClick={() => onChange(null)} className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80" aria-label="Retirer l’image">
                <X className="size-4" />
              </button>
            )}
          </>
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="flex size-full flex-col items-center justify-center gap-1.5 text-sm text-muted hover:text-fg">
            <ImagePlus className="size-6" />
            Choisir une image
            <span className="text-xs">JPG, PNG ou WebP · 15 Mo max</span>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
      <div className="flex flex-wrap gap-2">
        {value && !busy && (
          <Button size="sm" onClick={() => input.current?.click()}>
            <Upload className="size-3.5" /> Remplacer
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setUrlMode(!urlMode)} disabled={busy}>
          <Link2 className="size-3.5" /> Coller une URL
        </Button>
      </div>
      {urlMode && (
        <div className="flex gap-2">
          <Input aria-label="URL de l’image" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button
            onClick={() => {
              if (/^https?:\/\//.test(url.trim())) {
                onChange(url.trim())
                setUrl('')
                setUrlMode(false)
              } else toast.error('URL http(s) attendue')
            }}
          >
            OK
          </Button>
        </div>
      )}
    </Field>
  )
}

/** Image avec état de chargement et message clair si elle ne peut pas s'afficher. */
function PreviewImage({ src, dimmed }: { src: string; dimmed?: boolean }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  useEffect(() => setState('loading'), [src])
  return (
    <>
      {state === 'loading' && <div className="absolute inset-0 animate-pulse bg-surface-2" aria-hidden />}
      {state === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3 text-center text-xs text-muted">
          <ImagePlus className="size-5" />
          Image indisponible pour le moment
        </div>
      )}
      <img
        src={src}
        alt=""
        onLoad={() => setState('ok')}
        onError={() => setState('error')}
        className={cx('size-full object-cover transition-opacity', state === 'ok' ? 'opacity-100' : 'opacity-0', dimmed && 'opacity-60')}
      />
    </>
  )
}

/** Barre de progression posée sur l'aperçu pendant l'envoi. */
export function UploadOverlay({ progress }: { progress: number | null }) {
  const pct = Math.round((progress ?? 0) * 100)
  const optimizing = (progress ?? 0) >= 1
  return (
    <div className="absolute inset-x-0 bottom-0 bg-black/65 px-3 py-2 text-white" role="status" aria-live="polite">
      <div className="mb-1 flex justify-between text-xs font-medium">
        <span>{optimizing ? 'Optimisation…' : 'Envoi…'}</span>
        {!optimizing && <span>{pct} %</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
        <div className={cx('h-full rounded-full bg-accent transition-[width] duration-200', optimizing && 'animate-pulse')} style={{ width: `${optimizing ? 100 : pct}%` }} />
      </div>
    </div>
  )
}
