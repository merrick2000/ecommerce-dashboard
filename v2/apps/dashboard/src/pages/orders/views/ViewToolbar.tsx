import type { ReactNode } from 'react'
import { Columns3, LayoutGrid, List, Rows3, Table2 } from 'lucide-react'
import { Checkbox, cx, Segmented } from '@/components/ui'
import { TABLE_COLUMNS, type ColumnKey, type OrdersPrefs, type OrdersView } from './prefs'

const VIEW_OPTIONS: { value: OrdersView; label: ReactNode; title: string }[] = [
  { value: 'cards', title: 'Cartes', label: <LayoutGrid className="size-4" /> },
  { value: 'compact', title: 'Liste compacte', label: <List className="size-4" /> },
  { value: 'table', title: 'Tableau', label: <Table2 className="size-4" /> },
]

/** Choix de la vue (Cartes / Liste / Tableau) et, pour le tableau, colonnes et densité. */
export function ViewToolbar({ prefs, setPrefs, tableAvailable }: { prefs: OrdersPrefs; setPrefs: (p: OrdersPrefs) => void; tableAvailable: boolean }) {
  const options = VIEW_OPTIONS.filter((o) => o.value !== 'table' || tableAvailable).map((o) => ({
    value: o.value,
    label: (
      <span className="inline-flex items-center gap-1.5" title={o.title}>
        {o.label}
        <span className="hidden md:inline">{o.title}</span>
      </span>
    ),
  }))
  const effective = prefs.view === 'table' && !tableAvailable ? 'compact' : prefs.view
  const toggleColumn = (key: ColumnKey, visible: boolean) => {
    const hidden = visible ? prefs.hidden.filter((k) => k !== key) : [...prefs.hidden, key]
    // Toujours au moins le client visible.
    if (TABLE_COLUMNS.every((c) => hidden.includes(c.key))) return
    setPrefs({ ...prefs, hidden })
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented label="Affichage" value={effective} onChange={(view) => setPrefs({ ...prefs, view })} options={options} />
      {effective === 'table' && (
        <>
          <details className="relative">
            <summary className="flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 text-[13px] font-medium hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
              <Columns3 className="size-4" /> Colonnes
            </summary>
            <div className="absolute right-0 z-20 mt-1 w-56 space-y-1.5 rounded-xl border border-line-strong bg-surface p-3 shadow-xl">
              {TABLE_COLUMNS.map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={!prefs.hidden.includes(c.key)} onChange={(v) => toggleColumn(c.key, v)} label={c.label} />
                  {c.label}
                </label>
              ))}
            </div>
          </details>
          <button
            type="button"
            onClick={() => setPrefs({ ...prefs, density: prefs.density === 'compact' ? 'comfortable' : 'compact' })}
            className={cx('flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 text-[13px] font-medium hover:bg-surface-2')}
            aria-pressed={prefs.density === 'compact'}
            title="Densité des lignes"
          >
            <Rows3 className="size-4" /> {prefs.density === 'compact' ? 'Compacte' : 'Confortable'}
          </button>
        </>
      )}
    </div>
  )
}
