import { useSearchParams } from 'react-router'
import { cx, PageHeader } from '@/components/ui'
import { useCan, usePermissions } from '@/hooks/auth'
import { CheckoutSettingsForm } from './CheckoutSettings'
import { IntegrationsSettings } from './IntegrationsSettings'
import { PaymentsSettings } from './PaymentsSettings'
import { StoreSettings } from './StoreSettings'
import { TrackingSettings } from './TrackingSettings'

const TABS = [
  { id: 'store', label: 'Boutique', perm: 'store.settings' },
  { id: 'checkout', label: 'Page de vente', perm: 'store.settings' },
  { id: 'tracking', label: 'Suivi publicitaire', perm: 'store.settings' },
  { id: 'payments', label: 'Paiements', perm: 'payments.manage' },
  { id: 'integrations', label: 'Intégrations', perm: 'integrations.manage' },
] as const
type TabId = (typeof TABS)[number]['id']

export default function Settings() {
  const [params, setParams] = useSearchParams()
  const permissions = usePermissions()
  const canEdit = useCan('store.settings')
  // Onglets visibles selon les permissions (un admin ne voit pas Paiements ni Intégrations).
  const tabs = TABS.filter((t) => permissions.includes(t.perm))
  const tab = (tabs.find((t) => t.id === params.get('tab'))?.id ?? tabs[0]?.id ?? 'store') as TabId

  return (
    <>
      <PageHeader title="Paramètres" />
      <div className="scrollbar-none -mx-4 mb-5 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Sections des paramètres">
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
