/**
 * Éléments d'urgence (compte à rebours, stock limité, visiteurs) : pour chacun, ses réglages,
 * son emplacement sur la page, son style et sa couleur ; aperçu en direct de la page de vente.
 */
import { URGENCY_COLORS, URGENCY_PLACEMENTS, URGENCY_STYLES, type CheckoutSettings, type UrgencyPlacement } from '@zuri/shared'
import { Clock, Eye, Flame } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx, Field, Input, Segmented, Select, Switch } from '@/components/ui'
import type { Errors } from '@/lib/form'
import { NumberField } from '../products/editor/fields'

type Urgency = CheckoutSettings['urgency']
type Countdown = NonNullable<Urgency['countdown']>
type Stock = NonNullable<Urgency['limitedStock']>
type Viewers = NonNullable<Urgency['viewers']>
type Look = { placement?: UrgencyPlacement; style?: (typeof URGENCY_STYLES)[number]; color?: (typeof URGENCY_COLORS)[number] }

const PLACEMENT_LABEL: Record<UrgencyPlacement, string> = {
  top_bar: 'Bandeau tout en haut de la page',
  under_title: 'Sous le nom du produit',
  above_price: 'Au-dessus du prix',
  under_cta: 'Sous le bouton d’achat',
  above_form: 'Au-dessus du formulaire de commande',
}
const STYLE_LABEL: Record<(typeof URGENCY_STYLES)[number], string> = { soft: 'Fond doux', outline: 'Contour', solid: 'Plein', minimal: 'Texte seul', pill: 'Pastille' }
const COLOR: Record<(typeof URGENCY_COLORS)[number], { label: string; swatch: string; soft: string; outline: string; solid: string; text: string }> = {
  orange: { label: 'Orange', swatch: 'bg-amber-600', soft: 'bg-amber-50 text-amber-800', outline: 'border-amber-700 text-amber-800', solid: 'bg-amber-600 text-white', text: 'text-amber-800' },
  red: { label: 'Rouge', swatch: 'bg-red-700', soft: 'bg-red-50 text-red-700', outline: 'border-red-700 text-red-700', solid: 'bg-red-700 text-white', text: 'text-red-700' },
  accent: { label: 'Couleur de la boutique', swatch: 'bg-accent', soft: 'bg-accent/10 text-accent', outline: 'border-accent text-accent', solid: 'bg-accent text-white', text: 'text-accent' },
  green: { label: 'Vert', swatch: 'bg-emerald-700', soft: 'bg-emerald-50 text-emerald-700', outline: 'border-emerald-700 text-emerald-700', solid: 'bg-emerald-700 text-white', text: 'text-emerald-700' },
  dark: { label: 'Sombre', swatch: 'bg-gray-900', soft: 'bg-gray-100 text-gray-900', outline: 'border-gray-900 text-gray-900', solid: 'bg-gray-900 text-white', text: 'text-gray-900' },
}

/** Classe d'un élément dans l'aperçu (mêmes styles que la page de vente). */
function lookClass(l: Look) {
  const c = COLOR[l.color ?? 'orange']
  switch (l.style ?? 'soft') {
    case 'outline':
      return cx('rounded-md border-[1.5px] bg-transparent px-2 py-1', c.outline)
    case 'solid':
      return cx('rounded-md px-2 py-1', c.solid)
    case 'minimal':
      return cx('px-0 py-0.5', c.text)
    case 'pill':
      return cx('mx-auto w-fit rounded-full px-3 py-1', c.soft)
    default:
      return cx('rounded-md px-2 py-1', c.soft)
  }
}

const toLocalInput = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function UrgencyEditor({ value, onChange, errors }: { value: Urgency; onChange: (u: Urgency) => void; errors: Errors }) {
  const u = value ?? {}
  const cd = u.countdown
  const st = u.limitedStock
  const vw = u.viewers
  const setCd = (p: Partial<Countdown>) => onChange({ ...u, countdown: { minutes: 15, mode: 'visitor', format: 'clock', placement: 'under_cta', style: 'soft', color: 'orange', enabled: false, ...cd, ...p } })
  const setSt = (p: Partial<Stock>) => onChange({ ...u, limitedStock: { remaining: 12, showBar: false, placement: 'under_cta', style: 'soft', color: 'orange', enabled: false, ...st, ...p } })
  const setVw = (p: Partial<Viewers>) => onChange({ ...u, viewers: { base: 8, vary: true, placement: 'under_cta', style: 'soft', color: 'orange', enabled: false, ...vw, ...p } })

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-muted">Chaque élément se place où vous voulez sur la page, avec son style et sa couleur. Un produit peut aussi les masquer ou afficher son propre stock (onglet Page de vente du produit).</p>

      <Item icon={<Clock className="size-4" />} title="Compte à rebours" on={!!cd?.enabled} onToggle={(enabled) => setCd({ enabled })}>
        {cd && (
          <>
            <Segmented
              label="Jusqu’à quand"
              value={cd.mode ?? 'visitor'}
              onChange={(mode) => setCd({ mode })}
              options={[
                { value: 'visitor', label: 'Durée par visiteur' },
                { value: 'daily', label: 'Minuit, chaque jour' },
                { value: 'date', label: 'Date précise' },
              ]}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {(cd.mode ?? 'visitor') === 'visitor' && <NumberField label="Durée pour chaque visiteur" value={cd.minutes} onChange={(v) => setCd({ minutes: v ?? 15 })} suffix="min" error={errors['urgency.countdown.minutes']} hint="Elle ne repart pas si le visiteur revient." />}
              {cd.mode === 'date' && (
                <Input
                  label="Fin de l’offre"
                  type="datetime-local"
                  value={toLocalInput(cd.endsAt)}
                  onChange={(e) => setCd({ endsAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  error={errors['urgency.countdown.endsAt'] ?? (!cd.endsAt ? 'Choisissez la date de fin' : undefined)}
                />
              )}
              <Input label="Texte" optional placeholder="L’offre expire dans" value={cd.label ?? ''} maxLength={80} onChange={(e) => setCd({ label: e.target.value || undefined })} />
            </div>
            <Segmented label="Affichage du temps" value={cd.format ?? 'clock'} onChange={(format) => setCd({ format })} options={[{ value: 'clock', label: '00:18:15' }, { value: 'blocks', label: 'Cases 00 h 18 min 15 s' }]} />
            <p className="text-[12px] text-muted">Une fois l’heure passée, le compte à rebours disparaît : on n’invente pas une nouvelle offre.</p>
            <LookFields look={cd} onChange={(l) => setCd(l)} />
          </>
        )}
      </Item>

      <Item icon={<Flame className="size-4" />} title="Stock limité" on={!!st?.enabled} onToggle={(enabled) => setSt({ enabled })}>
        {st && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField label="Pièces restantes affichées" value={st.remaining} onChange={(v) => setSt({ remaining: v ?? 1 })} error={errors['urgency.limitedStock.remaining']} />
              <Input label="Texte" optional placeholder="Plus que {n} en stock" value={st.label ?? ''} maxLength={80} onChange={(e) => setSt({ label: e.target.value || undefined })} hint="{n} est remplacé par le nombre." />
            </div>
            <Switch checked={!!st.showBar} onChange={(showBar) => setSt({ showBar })} label="Barre de stock" description="Une jauge presque vide sous le texte." />
            {st.showBar && <NumberField label="Stock de départ (pour la jauge)" value={st.total ?? null} onChange={(v) => setSt({ total: v ?? undefined })} wrapClass="sm:max-w-xs" hint={`Vide : ${st.remaining * 4}.`} />}
            <LookFields look={st} onChange={(l) => setSt(l)} />
          </>
        )}
      </Item>

      <Item icon={<Eye className="size-4" />} title="Visiteurs en ce moment" on={!!vw?.enabled} onToggle={(enabled) => setVw({ enabled })}>
        {vw && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField label="Nombre affiché" value={vw.base} onChange={(v) => setVw({ base: v ?? 1 })} error={errors['urgency.viewers.base']} />
              <Input label="Texte" optional placeholder="{n} personnes regardent ce produit" value={vw.label ?? ''} maxLength={80} onChange={(e) => setVw({ label: e.target.value || undefined })} hint="{n} est remplacé par le nombre." />
            </div>
            <Switch checked={vw.vary !== false} onChange={(vary) => setVw({ vary })} label="Faire varier le nombre" description="Il bouge un peu toutes les quelques secondes, autour de votre nombre." />
            <LookFields look={vw} onChange={(l) => setVw(l)} />
          </>
        )}
      </Item>

      {(cd?.enabled || st?.enabled || vw?.enabled) && <PagePreview u={u} />}
    </div>
  )
}

function Item({ icon, title, on, onToggle, children }: { icon: ReactNode; title: string; on: boolean; onToggle: (v: boolean) => void; children: ReactNode }) {
  return (
    <div className={cx('rounded-xl border', on ? 'border-line-strong' : 'border-line')}>
      <div className="flex items-center gap-3 px-3.5 py-3">
        <span className={cx('grid size-8 place-items-center rounded-lg', on ? 'bg-accent/10 text-accent' : 'bg-surface-2 text-muted')}>{icon}</span>
        <div className="min-w-0 flex-1">
          <Switch checked={on} onChange={onToggle} label={title} />
        </div>
      </div>
      {on && <div className="space-y-4 border-t border-line px-3.5 py-4">{children}</div>}
    </div>
  )
}

function LookFields({ look, onChange }: { look: Look; onChange: (l: Look) => void }) {
  return (
    <div className="grid gap-3 rounded-lg bg-surface-2/60 p-3 sm:grid-cols-[1.4fr_1fr]">
      <Select label="Emplacement" value={look.placement ?? 'under_cta'} onChange={(e) => onChange({ placement: e.target.value as UrgencyPlacement })} options={URGENCY_PLACEMENTS.map((p) => ({ value: p, label: PLACEMENT_LABEL[p] }))} />
      <Select label="Style" value={look.style ?? 'soft'} onChange={(e) => onChange({ style: e.target.value as Look['style'] })} options={URGENCY_STYLES.map((s) => ({ value: s, label: STYLE_LABEL[s] }))} />
      <Field label="Couleur" className="sm:col-span-2">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur">
          {URGENCY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={(look.color ?? 'orange') === c}
              onClick={() => onChange({ color: c })}
              className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px]', (look.color ?? 'orange') === c ? 'border-accent ring-1 ring-accent' : 'border-line hover:bg-surface')}
            >
              <span className={cx('size-3 rounded-full', COLOR[c].swatch)} />
              {COLOR[c].label}
            </button>
          ))}
        </div>
      </Field>
    </div>
  )
}

/** Maquette de la page de vente : chaque élément actif à son emplacement. */
function PagePreview({ u }: { u: Urgency }) {
  const items: { at: UrgencyPlacement; node: ReactNode }[] = []
  if (u.countdown?.enabled)
    items.push({
      at: u.countdown.placement ?? 'under_cta',
      node: (
        <div className={cx('flex flex-wrap items-center justify-center gap-1.5 text-[11.5px] font-semibold', lookClass(u.countdown))}>
          <Clock className="size-3.5" /> {u.countdown.label || 'L’offre expire dans'}
          {u.countdown.format === 'blocks' ? (
            <span className="inline-flex gap-0.5">
              {['00 h', '18 min', '15 s'].map((x) => (
                <span key={x} className={cx('rounded px-1', u.countdown?.style === 'solid' ? 'bg-white/20' : cx(COLOR[u.countdown?.color ?? 'orange'].solid))}>
                  {x}
                </span>
              ))}
            </span>
          ) : (
            <span className="tabular-nums font-extrabold">00:18:15</span>
          )}
        </div>
      ),
    })
  if (u.limitedStock?.enabled) {
    const n = u.limitedStock.remaining
    const pct = Math.max(4, Math.min(100, Math.round((n / Math.max(u.limitedStock.total ?? n * 4, n)) * 100)))
    items.push({
      at: u.limitedStock.placement ?? 'under_cta',
      node: (
        <div className={cx('text-center text-[11.5px] font-semibold', lookClass(u.limitedStock))}>
          <span className="inline-flex items-center gap-1.5">
            <Flame className="size-3.5" /> {u.limitedStock.label ? u.limitedStock.label.replace(/\{n\}/gi, String(n)) : `Plus que ${n} en stock`}
          </span>
          {u.limitedStock.showBar && (
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-current/20">
              <span className="block h-full rounded-full bg-current" style={{ width: `${pct}%` }} />
            </span>
          )}
        </div>
      ),
    })
  }
  if (u.viewers?.enabled)
    items.push({
      at: u.viewers.placement ?? 'under_cta',
      node: (
        <div className={cx('flex items-center justify-center gap-1.5 text-[11.5px] font-semibold', lookClass(u.viewers))}>
          <span className={cx('size-1.5 rounded-full', u.viewers.style === 'solid' ? 'bg-white' : 'bg-red-500')} />
          {u.viewers.label ? u.viewers.label.replace(/\{n\}/gi, String(u.viewers.base)) : `${u.viewers.base} personnes regardent ce produit`}
        </div>
      ),
    })
  const at = (p: UrgencyPlacement) => {
    const list = items.filter((i) => i.at === p)
    return list.length ? <div className={cx('space-y-1', p === 'top_bar' ? '' : 'my-1.5')}>{list.map((i, k) => <div key={k} className={p === 'top_bar' ? '[&>div]:rounded-none' : ''}>{i.node}</div>)}</div> : null
  }
  return (
    <div>
      <p className="mb-2 text-sm font-medium">Aperçu de la page</p>
      <div className="mx-auto max-w-[340px] overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        {at('top_bar')}
        <div className="space-y-2 p-3">
          <div className="aspect-[16/9] rounded-lg bg-surface-2" />
          <div>
            <div className="h-3.5 w-3/4 rounded bg-fg/80" />
            {at('under_title')}
          </div>
          {at('above_price')}
          <div className="h-4 w-1/3 rounded bg-fg/70" />
          <div className="rounded-lg bg-accent py-2 text-center text-[12px] font-semibold text-white">Acheter maintenant</div>
          {at('under_cta')}
          <div className="rounded-lg border border-dashed border-line p-2">
            {at('above_form')}
            <div className="space-y-1.5">
              <div className="h-6 rounded bg-surface-2" />
              <div className="h-6 rounded bg-surface-2" />
              <div className="h-7 rounded bg-fg/80" />
            </div>
            <p className="mt-1 text-center text-[10.5px] text-muted">Formulaire de commande</p>
          </div>
        </div>
      </div>
    </div>
  )
}
