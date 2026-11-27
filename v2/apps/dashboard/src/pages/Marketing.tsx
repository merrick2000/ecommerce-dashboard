/**
 * Marketing : tout ce qui pousse à commander, au même endroit.
 * Popups, codes promo, preuve sociale et urgence, relances, pixels publicitaires.
 */
import { useSearchParams } from 'react-router'
import { cx, PageHeader } from '@/components/ui'
import { useCan, usePermissions } from '@/hooks/auth'
import { PromoCodesPanel } from './PromoCodes'
import { CheckoutSettingsForm } from './settings/CheckoutSettings'
import { TrackingSettings } from './settings/TrackingSettings'

const TABS = [
  { id: 'popups', label: 'Popups', hint: 'Un message au bon moment : quand le visiteur veut partir, hésite, a commencé à commander.', perm: 'store.settings' },
  { id: 'promos', label: 'Codes promo', hint: 'Les réductions à donner dans vos popups, relances, publicités ou à vos influenceurs.', perm: 'marketing.edit' },
  { id: 'proof', label: 'Preuve sociale et urgence', hint: 'Ventes récentes, compte à rebours, stock limité, visiteurs en ce moment.', perm: 'store.settings' },
  { id: 'recovery', label: 'Relances', hint: 'Les visiteurs qui ont laissé leurs coordonnées sans commander.', perm: 'store.settings' },
  { id: 'pixels', label: 'Pixels et publicité', hint: 'Facebook, TikTok : mesurez vos publicités et retrouvez vos visiteurs.', perm: 'store.settings' },
] as const
type TabId = (typeof TABS)[number]['id']
/** Pour le menu : visible dès qu'un onglet l'est. */
export const MARKETING_PERMS = [...new Set(TABS.map((t) => t.perm))]

export default function Marketing() {
  const [params, setParams] = useSearchParams()
  const permissions = usePermissions()
  const canEdit = useCan('store.settings')
  const tabs = TABS.filter((t) => permissions.includes(t.perm))
  const current = tabs.find((t) => t.id === params.get('tab')) ?? tabs[0]
  const tab = (current?.id ?? 'popups') as TabId

  return (
    <>
      <PageHeader title="Marketing" description={current?.hint} />
      <div className="scrollbar-none -mx-4 mb-5 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Outils marketing">
        <div className="flex w-max gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setParams({ tab: t.id }, { replace: true })}
              className={cx('relative px-3 py-3 text-sm font-medium whitespace-nowrap', tab === t.id ? 'text-fg' : 'text-muted hover:text-fg')}
            >
              {t.label}
              {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
            </button>
          ))}
        </div>
      </div>
      {!canEdit && tab !== 'promos' && <p className="mb-4 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">Lecture seule : seuls le propriétaire et les administrateurs peuvent modifier ces réglages.</p>}
      <div role="tabpanel" className={tab === 'promos' ? '' : 'max-w-3xl'}>
        {tab === 'popups' && <CheckoutSettingsForm key="popups" canEdit={canEdit} section="popups" />}
        {tab === 'promos' && <PromoCodesPanel embedded />}
        {tab === 'proof' && <CheckoutSettingsForm key="proof" canEdit={canEdit} section="proof" />}
        {tab === 'recovery' && <CheckoutSettingsForm key="recovery" canEdit={canEdit} section="recovery" />}
        {tab === 'pixels' && <TrackingSettings canEdit={canEdit} />}
      </div>
    </>
  )
}
