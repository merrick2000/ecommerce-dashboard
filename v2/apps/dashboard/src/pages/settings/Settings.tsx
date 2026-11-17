import { useSearchParams } from 'react-router'
import { cx, PageHeader } from '@/components/ui'
import { useCurrentStore } from '@/hooks/auth'
import { CheckoutSettingsForm } from './CheckoutSettings'
import { IntegrationsSettings } from './IntegrationsSettings'
import { PaymentsSettings } from './PaymentsSettings'
import { StoreSettings } from './StoreSettings'
import { TrackingSettings } from './TrackingSettings'

const TABS = [
  { id: 'store', label: 'Boutique' },
  { id: 'checkout', label: 'Page de vente' },
  { id: 'tracking', label: 'Suivi publicitaire' },
  { id: 'payments', label: 'Paiements' },
  { id: 'integrations', label: 'Intégrations' },
] as const
type TabId = (typeof TABS)[number]['id']

export default function Settings() {
  const [params, setParams] = useSearchParams()
  const { role } = useCurrentStore()
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'store') as TabId
  const canEdit = role === 'owner' || role === 'admin'

  return (
    <>
      <PageHeader title="Paramètres" />
      <div className="scrollbar-none -mx-4 mb-5 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Sections des paramètres">
        <div className="flex w-max gap-1">
          {TABS.map((t) => (
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
      {!canEdit && tab !== 'payments' && tab !== 'integrations' && (
        <p className="mb-4 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">Lecture seule : seuls le propriétaire et les administrateurs peuvent modifier ces réglages.</p>
      )}
      <div role="tabpanel" className="max-w-3xl">
        {tab === 'store' && <StoreSettings canEdit={canEdit} />}
        {tab === 'checkout' && <CheckoutSettingsForm canEdit={canEdit} />}
        {tab === 'tracking' && <TrackingSettings canEdit={canEdit} />}
        {tab === 'payments' && <PaymentsSettings />}
        {tab === 'integrations' && <IntegrationsSettings />}
      </div>
    </>
  )
}
