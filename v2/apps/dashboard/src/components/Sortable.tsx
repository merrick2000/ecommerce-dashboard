/**
 * Glisser-déposer réutilisable (souris, doigt, clavier), sans dépendance.
 * La liste se réordonne en direct sous le pointeur ; le suivi se fait sur la fenêtre
 * (déplacer l'élément tenu ferait perdre une capture de pointeur).
 *
 * Usage :
 *   const sort = useSortable(items, setItems)
 *   <ul ref={sort.listRef}>{items.map((it, i) => <li {...sort.itemProps(i)}><DragHandle {...sort.handleProps(i, 'Nom')} /> …</li>)}</ul>
 *
 * mode « grid » : pour une grille (galerie), la cible est l'élément dont le centre est le plus proche.
 */
import { GripVertical } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { cx } from './ui'

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list
  const next = [...list]
  const [it] = next.splice(from, 1)
  next.splice(to, 0, it!)
  return next
}

export function useSortable<T>(
  items: T[],
  onChange: (next: T[]) => void,
  opts: { mode?: 'list' | 'grid'; disabled?: boolean; /** Appelé une fois le déplacement terminé (pour enregistrer). */ onEnd?: (final: T[]) => void } = {},
) {
  const listRef = useRef<HTMLElement | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const latest = useRef({ items, onChange, dragIndex, moved: false, onEnd: opts.onEnd })
  latest.current = { ...latest.current, items, onChange, dragIndex, onEnd: opts.onEnd }

  useEffect(() => {
    if (dragIndex === null) return
    const move = (e: PointerEvent) => {
      const list = listRef.current
      const cur = latest.current
      if (!list || cur.dragIndex === null) return
      e.preventDefault()
      // Défilement automatique près des bords de l'écran.
      if (e.clientY < 70) window.scrollBy(0, -14)
      else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 14)
      const els = [...list.querySelectorAll<HTMLElement>(':scope > [data-sort-index]')]
      let target = cur.dragIndex
      if (opts.mode === 'grid') {
        let best = Infinity
        for (const el of els) {
          const r = el.getBoundingClientRect()
          const d = (e.clientX - (r.left + r.width / 2)) ** 2 + (e.clientY - (r.top + r.height / 2)) ** 2
          if (d < best) {
            best = d
            target = Number(el.dataset.sortIndex)
          }
        }
      } else {
        target = 0
        for (const el of els) {
          if (Number(el.dataset.sortIndex) === cur.dragIndex) continue
          const r = el.getBoundingClientRect()
          if (e.clientY > r.top + r.height / 2) target++
        }
      }
      if (target === cur.dragIndex) return
      const next = moveItem(cur.items, cur.dragIndex, target)
      cur.onChange(next)
      // Plusieurs mouvements peuvent arriver avant le prochain rendu : on garde la liste à jour ici.
      latest.current.items = next
      latest.current.dragIndex = target
      latest.current.moved = true
      setDragIndex(target)
    }
    const end = () => {
      setDragIndex(null)
      if (latest.current.moved) latest.current.onEnd?.(latest.current.items)
      latest.current.moved = false
    }
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragIndex === null])

  return {
    listRef: (el: HTMLElement | null) => {
      listRef.current = el
    },
    dragging: dragIndex !== null,
    dragIndex,
    itemProps: (i: number) => ({
      'data-sort-index': i,
      'data-dragging': dragIndex === i ? 'true' : undefined,
    }),
    handleProps: (i: number, label: string) => ({
      dragging: dragIndex === i,
      disabled: opts.disabled,
      label,
      onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
        if (opts.disabled || (e.pointerType === 'mouse' && e.button !== 0)) return
        e.preventDefault()
        latest.current.dragIndex = i
        latest.current.moved = false
        setDragIndex(i)
      },
      // Clavier : poignée focalisée + flèches (haut/bas, et gauche/droite en grille).
      onKeyDown: (e: ReactKeyboardEvent<HTMLButtonElement>) => {
        const back = e.key === 'ArrowUp' || (opts.mode === 'grid' && e.key === 'ArrowLeft')
        const fwd = e.key === 'ArrowDown' || (opts.mode === 'grid' && e.key === 'ArrowRight')
        if (!back && !fwd) return
        e.preventDefault()
        const to = i + (back ? -1 : 1)
        if (to < 0 || to >= items.length) return
        const next = moveItem(items, i, to)
        onChange(next)
        opts.onEnd?.(next)
        requestAnimationFrame(() => listRef.current?.querySelector<HTMLButtonElement>(`:scope > [data-sort-index="${to}"] [data-drag-handle]`)?.focus())
      },
    }),
  }
}

/** Classe à appliquer à l'élément en cours de déplacement. */
export const draggingClass = 'relative z-10 rounded-lg bg-surface shadow-lg ring-2 ring-accent'

export function DragHandle({
  dragging,
  disabled,
  label,
  onPointerDown,
  onKeyDown,
  className,
}: {
  dragging: boolean
  disabled?: boolean
  label: string
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void
  onKeyDown: (e: ReactKeyboardEvent<HTMLButtonElement>) => void
  className?: string
}) {
  return (
    <button
      type="button"
      data-drag-handle
      disabled={disabled}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      aria-label={`Déplacer ${label} (flèches du clavier)`}
      title="Glisser pour déplacer"
      className={cx(
        'touch-none rounded-md p-1 text-subtle hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-40',
        dragging ? 'cursor-grabbing text-accent' : 'cursor-grab',
        className,
      )}
    >
      <GripVertical className="size-4" />
    </button>
  )
}
