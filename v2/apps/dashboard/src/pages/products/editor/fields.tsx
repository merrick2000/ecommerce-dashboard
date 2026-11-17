import { ArrowDown, ArrowUp, ImagePlus, Link2, Loader2, Trash2, Upload, X } from 'lucide-react'
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
  /**
   * idle : rien en cours. uploading : envoi (progress 0..1, puis 1 = optimisation serveur).
   * finalizing : envoyé, on attend que l'image définitive soit chargée avant de retirer l'indicateur.
   */
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'finalizing'>('idle')
  const [progress, setProgress] = useState(0)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [urlMode, setUrlMode] = useState(false)
  const [url, setUrl] = useState('')
  const busy = phase !== 'idle'

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview)
  }, [localPreview])

  // Empêche de quitter la page en plein envoi (l'image serait perdue).
  useEffect(() => {
    if (!busy) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [busy])

  const finish = () => {
    setPhase('idle')
    setProgress(0)
    setLocalPreview(null)
    if (input.current) input.current.value = ''
  }

  const pick = async (file: File | undefined) => {
    if (!file || busy) return
    if (!file.type.startsWith('image/')) return setUploadError('Choisissez un fichier image (JPG, PNG, WebP).')
    if (file.size > 15 * 1024 * 1024) return setUploadError('Image trop lourde : 15 Mo maximum.')
    setUploadError(null)
    // Aperçu immédiat de la photo choisie, pendant tout l'envoi.
    setLocalPreview(URL.createObjectURL(file))
    setProgress(0)
    setPhase('uploading')
    let finalUrl: string
    try {
      const r = await uploadImage(storeId, file, preset, setProgress)
      finalUrl = r.url ?? r.key
    } catch (e) {
      setUploadError(errorMessage(e))
      return finish()
    }
    // On garde l'indicateur jusqu'à ce que l'image définitive (CDN) soit prête à s'afficher.
    setPhase('finalizing')
    await new Promise<void>((resolve) => {
      if (!/^https?:\/\//.test(finalUrl)) return resolve()
      const img = new Image()
      const done = () => resolve()
      img.onload = done
      img.onerror = done
      setTimeout(done, 15_000)
      img.src = finalUrl
    })
    onChange(finalUrl)
    toast.success('Image ajoutée')
    finish()
  }

  const shown = localPreview ?? value
  return (
    <Field label={label} hint={hint} error={error ?? uploadError ?? undefined}>
      <div
        className={cx('relative overflow-hidden rounded-xl border border-dashed border-line-strong bg-surface-2', aspect === 'video' ? 'aspect-video' : 'aspect-square max-w-48')}
        aria-busy={busy}
      >
        {shown ? (
          <>
            <PreviewImage src={shown} dimmed={busy} />
            {busy && <UploadOverlay progress={phase === 'finalizing' ? null : progress} />}
            {!busy && (
              <button type="button" onClick={() => onChange(null)} className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80" aria-label="Retirer l’image">
                <X className="size-4" />
              </button>
            )}
          </>
        ) : (
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="flex size-full flex-col items-center justify-center gap-1.5 text-sm text-muted hover:text-fg">
            <ImagePlus className="size-6" />
            Choisir une image
            <span className="text-xs">JPG, PNG ou WebP · 15 Mo max</span>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
      <div className="flex flex-wrap gap-2">
        {value && !busy && (
          <Button size="sm" onClick={() => input.current?.click()} disabled={busy}>
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
export function PreviewImage({ src, dimmed }: { src: string; dimmed?: boolean }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  useEffect(() => setState('loading'), [src])
  return (
    <>
      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-2" aria-hidden>
          <Loader2 className="size-6 animate-spin text-muted" />
        </div>
      )}
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
        className={cx('size-full object-contain transition-opacity', state === 'ok' ? 'opacity-100' : 'opacity-0', dimmed && 'opacity-60')}
      />
    </>
  )
}

/**
 * Indicateur posé sur l'aperçu pendant l'envoi : bien visible, au centre, et bloque les clics
 * (on ne relance pas l'envoi deux fois). progress null = étape finale (optimisation, affichage).
 */
export function UploadOverlay({ progress }: { progress: number | null }) {
  const pct = Math.round((progress ?? 0) * 100)
  const finishing = progress === null || progress >= 1
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 px-4 text-white backdrop-blur-[1px]" role="status" aria-live="polite">
      <Loader2 className="size-8 animate-spin" />
      <p className="text-sm font-semibold">{finishing ? 'Finalisation de l’image…' : `Envoi de l’image… ${pct} %`}</p>
      <div className="h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-white/25">
        <div className={cx('h-full rounded-full bg-accent transition-[width] duration-200', finishing && 'animate-pulse')} style={{ width: `${finishing ? 100 : pct}%` }} />
      </div>
      <p className="text-xs text-white/80">Ne fermez pas la page</p>
    </div>
  )
}
