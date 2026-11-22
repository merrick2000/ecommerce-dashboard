/**
 * Composants de base, volontairement petits (pas de kit UI) :
 * accessibles (labels, focus visibles), utilisables au pouce sur mobile.
 */
import { AlertTriangle, Loader2, X } from 'lucide-react'
import {
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type Ref,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Link } from 'react-router'
import type { Tone } from '@/lib/labels'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

// ─── Bouton ──────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-strong shadow-sm',
  secondary: 'bg-surface text-fg border border-line-strong hover:bg-surface-2',
  ghost: 'text-fg hover:bg-surface-2',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
}
const SIZE: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-xl',
  icon: 'h-10 w-10 rounded-lg',
}

export function buttonClass(variant: Variant = 'secondary', size: Size = 'md', className?: string) {
  return cx(
    'inline-flex shrink-0 select-none items-center justify-center font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50',
    VARIANT[variant],
    SIZE[size],
    className,
  )
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean; ref?: Ref<HTMLButtonElement> }) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest} disabled={loading || rest.disabled} aria-busy={loading || undefined}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function ButtonLink({ to, variant = 'secondary', size = 'md', className, children }: { to: string; variant?: Variant; size?: Size; className?: string; children: ReactNode }) {
  return (
    <Link to={to} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  )
}

// ─── Champs ──────────────────────────────────────────────────────────────────

const control =
  'w-full rounded-lg border bg-surface px-3 text-[15px] sm:text-sm text-fg placeholder:text-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-60'

export function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
  className,
  optional,
}: {
  label?: ReactNode
  error?: string
  hint?: ReactNode
  children: ReactNode
  htmlFor?: string
  className?: string
  optional?: boolean
}) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-fg">
          {label}
          {optional && <span className="ml-1 font-normal text-subtle">(facultatif)</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[13px] text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12.5px] text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode; error?: string; hint?: ReactNode; optional?: boolean; suffix?: ReactNode; wrapClass?: string }

export function Input({ label, error, hint, optional, suffix, wrapClass, className, id, ...rest }: InputProps) {
  const auto = useId()
  const inputId = id ?? auto
  const input = (
    <div className="relative">
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cx(control, 'h-10', error ? 'border-red-500' : 'border-line-strong', suffix ? 'pr-14' : '', className)}
        {...rest}
      />
      {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[13px] text-muted">{suffix}</span>}
    </div>
  )
  if (!label && !error && !hint) return wrapClass ? <div className={wrapClass}>{input}</div> : input
  return (
    <Field label={label} error={error} hint={hint} htmlFor={inputId} optional={optional} className={wrapClass}>
      {input}
    </Field>
  )
}

export function Textarea({
  label,
  error,
  hint,
  optional,
  className,
  id,
  wrapClass,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: ReactNode; error?: string; hint?: ReactNode; optional?: boolean; wrapClass?: string }) {
  const auto = useId()
  const tid = id ?? auto
  return (
    <Field label={label} error={error} hint={hint} htmlFor={tid} optional={optional} className={wrapClass}>
      <textarea id={tid} aria-invalid={error ? true : undefined} className={cx(control, 'min-h-20 py-2', error ? 'border-red-500' : 'border-line-strong', className)} {...rest} />
    </Field>
  )
}

export function Select({
  label,
  error,
  hint,
  options,
  className,
  id,
  wrapClass,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: ReactNode; error?: string; hint?: ReactNode; options: { value: string; label: string; title?: string }[]; wrapClass?: string }) {
  const auto = useId()
  const sid = id ?? auto
  const el = (
    <select
      id={sid}
      aria-invalid={error ? true : undefined}
      // Nom complet au survol, utile quand le libellé est raccourci.
      title={options.find((o) => o.value === String(rest.value ?? ''))?.title}
      className={cx(control, 'h-10 pr-8', error ? 'border-red-500' : 'border-line-strong', className)}
      {...rest}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} title={o.title}>
          {o.label}
        </option>
      ))}
    </select>
  )
  if (!label && !error && !hint) return wrapClass ? <div className={wrapClass}>{el}</div> : el
  return (
    <Field label={label} error={error} hint={hint} htmlFor={sid} className={wrapClass}>
      {el}
    </Field>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  size = 'md',
  ariaLabel,
}: {
  ariaLabel?: string
  checked: boolean
  onChange: (v: boolean) => void
  label?: ReactNode
  description?: ReactNode
  disabled?: boolean
  size?: 'sm' | 'md'
}) {
  const id = useId()
  const btn = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
        checked ? 'bg-accent' : 'bg-line-strong',
      )}
    >
      <span
        className={cx(
          'inline-block rounded-full bg-white shadow transition-transform',
          size === 'sm' ? 'size-4' : 'size-5',
          checked ? (size === 'sm' ? 'translate-x-4.5' : 'translate-x-5.5') : 'translate-x-0.5',
        )}
      />
    </button>
  )
  if (!label) return btn
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] text-muted">{description}</span>}
      </label>
      {btn}
    </div>
  )
}

export function Checkbox({ checked, onChange, label, className }: { checked: boolean; onChange: (v: boolean) => void; label: string; className?: string }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className={cx('size-[18px] shrink-0 cursor-pointer rounded accent-amber-600', className)}
    />
  )
}

/** Choix exclusif sous forme de boutons segmentés (radio accessibles). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  label: string
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cx('inline-flex rounded-lg border border-line-strong bg-surface-2 p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors',
            value === o.value ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Saisie de liste (villes, badges…) : Entrée ou virgule pour ajouter. */
export function TagInput({ value, onChange, placeholder, label, hint, error }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; label?: string; hint?: string; error?: string }) {
  const [draft, setDraft] = useState('')
  const id = useId()
  const add = () => {
    const parts = draft
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length) onChange([...value, ...parts.filter((p) => !value.includes(p))])
    setDraft('')
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
  }
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <div className={cx('flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border bg-surface px-2 py-1.5 focus-within:ring-2 focus-within:ring-accent/40', error ? 'border-red-500' : 'border-line-strong')}>
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-surface-2 py-0.5 pr-1 pl-2 text-[13px]">
            {t}
            <button type="button" aria-label={`Retirer ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="rounded p-0.5 text-muted hover:text-fg">
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <input id={id} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} onBlur={add} placeholder={value.length ? '' : placeholder} className="h-7 min-w-24 flex-1 bg-transparent px-1 text-[15px] outline-none placeholder:text-subtle sm:text-sm" />
      </div>
    </Field>
  )
}

// ─── Affichage ───────────────────────────────────────────────────────────────

const TONE: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted ring-line-strong',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900',
  blue: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-900',
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900',
  red: 'bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900',
  violet: 'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900',
  orange: 'bg-orange-50 text-orange-800 ring-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-900',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium whitespace-nowrap ring-1 ring-inset', TONE[tone], className)}>{children}</span>
}

export function Card({ children, className, title, actions, description }: { children: ReactNode; className?: string; title?: ReactNode; actions?: ReactNode; description?: ReactNode }) {
  return (
    <section className={cx('rounded-xl border border-line bg-surface', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={title || actions ? 'p-4 sm:p-5' : ''}>{children}</div>
    </section>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-md bg-surface-2', className)} aria-hidden />
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx('size-5 animate-spin text-muted', className)} aria-label="Chargement" />
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      {icon && <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">{icon}</div>}
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = error instanceof Error ? error.message : 'Une erreur est survenue'
  const forbidden = typeof error === 'object' && error !== null && 'status' in error && (error as { status: number }).status === 403
  return (
    <div role="alert" className="flex flex-col items-center rounded-xl border border-red-200 bg-red-50/60 px-6 py-10 text-center dark:border-red-900/60 dark:bg-red-950/20">
      <AlertTriangle className="mb-2 size-6 text-red-600 dark:text-red-400" />
      <p className="font-medium">{forbidden ? 'Accès réservé' : 'Chargement impossible'}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{forbidden ? 'Cette section est réservée au propriétaire ou aux administrateurs de la boutique.' : msg}</p>
      {onRetry && !forbidden && (
        <Button className="mt-4" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  )
}

export function PageHeader({ title, description, actions, back }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back}
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className="tabular mt-0.5 font-semibold whitespace-normal [overflow-wrap:anywhere]">{value}</dd>
      {sub && <dd className="text-[12px] text-subtle">{sub}</dd>}
    </div>
  )
}
