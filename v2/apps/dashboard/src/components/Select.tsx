/**
 * Liste déroulante moderne (Radix pour le comportement, notre style Tailwind).
 * - Listes courtes : menu simple (clavier, saisie d'une lettre pour sauter, coche sur l'option choisie).
 * - Listes longues : menu avec recherche (pays, produits, membres…), insensible aux accents.
 * Même interface que l'ancien <select> : onChange reçoit un objet { target: { value } }.
 */
import * as Popover from '@radix-ui/react-popover'
import * as RSelect from '@radix-ui/react-select'
import { Command } from 'cmdk'
import { Check, ChevronDown, Search } from 'lucide-react'
import { useId, useMemo, useRef, useState, type ChangeEvent, type ChangeEventHandler, type KeyboardEvent, type ReactNode } from 'react'
import { cx, Field } from './ui'

/** meta : précision courte toujours visible (prix, stock, « inactif »), même quand le nom est coupé. */
export type SelectOption = { value: string; label: string; meta?: string; title?: string; disabled?: boolean }

type Props = {
  label?: ReactNode
  error?: string
  hint?: ReactNode
  options: SelectOption[]
  value?: string | number | readonly string[]
  defaultValue?: string
  onChange?: ChangeEventHandler<HTMLSelectElement>
  disabled?: boolean
  id?: string
  name?: string
  required?: boolean
  className?: string
  wrapClass?: string
  placeholder?: string
  /** Force la recherche (par défaut : au-delà de 8 options). */
  searchable?: boolean
  'aria-label'?: string
}

// Radix interdit la valeur vide pour une option : on la remplace en interne.
const EMPTY = '__zuri_vide__'
const SEARCH_FROM = 9

const trigger =
  'group flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border bg-surface pl-3 pr-2.5 text-left text-[15px] sm:text-sm text-fg transition-colors hover:border-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:border-accent data-[state=open]:border-accent data-[state=open]:ring-2 data-[state=open]:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60'
const panel =
  'z-[70] overflow-hidden rounded-xl border border-line bg-surface text-fg shadow-[0_12px_32px_-8px_rgb(0_0_0/0.25)] outline-none min-w-[var(--trigger-w)] max-w-[min(30rem,calc(100vw-1.5rem))] data-[state=open]:animate-[select-in_120ms_ease-out]'
const item =
  'relative flex w-full cursor-pointer select-none items-start rounded-lg py-2 pl-8 pr-3 text-[15px] sm:text-sm leading-snug outline-none whitespace-normal [overflow-wrap:anywhere] data-[highlighted]:bg-surface-2 data-[selected=true]:bg-surface-2 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Les fenêtres <dialog> sont dans la « top layer » : le menu doit s'y afficher, sinon il passe dessous. */
const containerOf = (el: HTMLElement | null) => (el?.closest('dialog[open]') as HTMLElement | null) ?? undefined

/** Échap ferme le menu sans fermer aussi la fenêtre qui le contient. */
const keepDialogOpen = (e: KeyboardEvent) => {
  if (e.key === 'Escape') e.nativeEvent.preventDefault()
}

export function Select({ label, error, hint, options, value, defaultValue, onChange, disabled, id, name, required, className, wrapClass, placeholder, searchable, 'aria-label': ariaLabel }: Props) {
  const auto = useId()
  const sid = id ?? auto
  const controlled = value !== undefined
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value ?? '')
  const current = controlled ? String(value) : inner
  const selected = options.find((o) => o.value === current)
  const emit = (v: string) => {
    if (!controlled) setInner(v)
    onChange?.({ target: { value: v, name }, currentTarget: { value: v, name } } as unknown as ChangeEvent<HTMLSelectElement>)
  }
  const useSearch = searchable ?? options.length >= SEARCH_FROM
  const props = { sid, options, current, selected, emit, disabled, error, className, placeholder, ariaLabel, name, required }

  const el = useSearch ? <SearchSelect {...props} /> : <SimpleSelect {...props} />
  // min-w-0 : dans une ligne flex ou une grille, un nom sélectionné très long ne doit jamais élargir le champ.
  if (!label && !error && !hint) return wrapClass ? <div className={cx('min-w-0', wrapClass)}>{el}</div> : el
  return (
    <Field label={label} error={error} hint={hint} htmlFor={sid} className={cx('min-w-0', wrapClass)}>
      {el}
    </Field>
  )
}

type Inner = {
  sid: string
  options: SelectOption[]
  current: string
  selected?: SelectOption
  emit: (v: string) => void
  disabled?: boolean
  error?: string
  className?: string
  placeholder?: string
  ariaLabel?: string
  name?: string
  required?: boolean
}

function TriggerLabel({ selected, placeholder }: { selected?: SelectOption; placeholder?: string }) {
  return (
    <>
      <span className={cx('min-w-0 flex-1 truncate', !selected && 'text-subtle')}>{selected?.label ?? placeholder ?? 'Choisir…'}</span>
      {selected?.meta && <span className="shrink-0 text-[13px] text-muted">{selected.meta}</span>}
      <ChevronDown className="size-4 shrink-0 text-muted transition-transform duration-150 group-data-[state=open]:rotate-180" aria-hidden />
    </>
  )
}

function SimpleSelect({ sid, options, current, selected, emit, disabled, error, className, placeholder, ariaLabel, name, required }: Inner) {
  const ref = useRef<HTMLButtonElement>(null)
  const [container, setContainer] = useState<HTMLElement | undefined>()
  return (
    <RSelect.Root
      value={current === '' ? EMPTY : current}
      onValueChange={(v) => emit(v === EMPTY ? '' : v)}
      onOpenChange={(o) => o && setContainer(containerOf(ref.current))}
      disabled={disabled}
      name={name}
      required={required}
    >
      <RSelect.Trigger
        ref={ref}
        id={sid}
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        title={selected?.title ?? (selected && selected.label.length > 30 ? selected.label : undefined)}
        className={cx(trigger, error ? 'border-red-500' : 'border-line-strong', className)}
      >
        <TriggerLabel selected={selected} placeholder={placeholder} />
      </RSelect.Trigger>
      <RSelect.Portal container={container}>
        <RSelect.Content
          position="popper"
          sideOffset={4}
          collisionPadding={12}
          onKeyDown={keepDialogOpen}
          className={panel}
          style={{ ['--trigger-w' as string]: 'var(--radix-select-trigger-width)' }}
        >
          <RSelect.Viewport className="max-h-[min(20rem,var(--radix-select-content-available-height))] p-1">
            {options.map((o) => (
              <RSelect.Item key={o.value} value={o.value === '' ? EMPTY : o.value} disabled={o.disabled} title={o.title} className={cx(item, 'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50')}>
                <RSelect.ItemIndicator className="absolute left-2.5 top-2.5">
                  <Check className="size-4 text-accent" strokeWidth={2.5} />
                </RSelect.ItemIndicator>
                <span className="flex min-w-0 flex-col">
                  <RSelect.ItemText>
                    <span className="line-clamp-3">{o.label}</span>
                  </RSelect.ItemText>
                  {o.meta && <span className="text-[12.5px] text-muted">{o.meta}</span>}
                </span>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  )
}

function SearchSelect({ sid, options, current, selected, emit, disabled, error, className, placeholder, ariaLabel, name }: Inner) {
  const ref = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hl, setHl] = useState('')
  const [container, setContainer] = useState<HTMLElement | undefined>()
  const shown = useMemo(() => {
    const n = norm(q.trim())
    return n ? options.filter((o) => norm(o.label).includes(n)) : options
  }, [q, options])

  return (
    <Popover.Root
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setContainer(containerOf(ref.current))
          setHl(current || EMPTY)
        } else setQ('')
        setOpen(o)
      }}
    >
      <Popover.Trigger
        ref={ref}
        id={sid}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        title={selected?.title ?? (selected && selected.label.length > 30 ? selected.label : undefined)}
        className={cx(trigger, error ? 'border-red-500' : 'border-line-strong', className)}
      >
        <TriggerLabel selected={selected} placeholder={placeholder} />
      </Popover.Trigger>
      {name && <input type="hidden" name={name} value={current} />}
      <Popover.Portal container={container}>
        <Popover.Content
          align="start"
          sideOffset={4}
          collisionPadding={12}
          onKeyDown={keepDialogOpen}
          className={cx(panel, 'w-[var(--trigger-w)]')}
          style={{ ['--trigger-w' as string]: 'var(--radix-popover-trigger-width)' }}
        >
          <Command shouldFilter={false} loop className="flex flex-col" value={hl} onValueChange={setHl}>
            <div className="flex items-center gap-2 border-b border-line px-3">
              <Search className="size-4 shrink-0 text-muted" aria-hidden />
              <Command.Input
                value={q}
                onValueChange={(v) => {
                  setQ(v)
                  const n = norm(v.trim())
                  const first = n ? options.find((o) => !o.disabled && norm(o.label).includes(n)) : undefined
                  setHl(first ? first.value || EMPTY : current || EMPTY)
                }}
                placeholder="Rechercher…"
                className="h-10 w-full bg-transparent text-[15px] sm:text-sm text-fg placeholder:text-subtle outline-none"
              />
            </div>
            <Command.List className="max-h-[min(18rem,calc(var(--radix-popover-content-available-height)-3rem))] overflow-y-auto overscroll-contain p-1">
              <Command.Empty className="px-3 py-6 text-center text-sm text-muted">Aucun résultat</Command.Empty>
              {shown.map((o) => (
                <Command.Item
                  key={o.value}
                  value={o.value || EMPTY}
                  disabled={o.disabled}
                  title={o.title}
                  onSelect={() => {
                    emit(o.value)
                    setOpen(false)
                    setQ('')
                  }}
                  className={item}
                >
                  {o.value === current && <Check className="absolute left-2.5 top-2.5 size-4 text-accent" strokeWidth={2.5} />}
                  <span className="flex min-w-0 flex-col">
                    <span className={cx('line-clamp-3', o.value === current && 'font-medium')}>{o.label}</span>
                    {o.meta && <span className="text-[12.5px] text-muted">{o.meta}</span>}
                  </span>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
