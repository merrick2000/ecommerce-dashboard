/**
 * Exporter le catalogue : lien du flux produits (Google Shopping, Facebook, Instagram, TikTok) à copier,
 * et fichiers au format d'import de Shopify et de WooCommerce. Tout est généré depuis les fiches produits.
 */
import { Copy, Download, Share2 } from 'lucide-react'
import { useState } from 'react'
import { Dialog } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Button, buttonClass } from '@/components/ui'
import { useCurrentStore } from '@/hooks/auth'
import { storefrontUrl } from '@/lib/storefront'

export function ExportCatalog() {
  const [open, setOpen] = useState(false)
  const toast = useToast()
  const store = useCurrentStore().store
  if (!store) return null
  const feed = `${storefrontUrl(store.slug)}/feeds/google.xml`
  const file = (format: 'shopify' | 'woocommerce') => `/api/stores/${store.id}/products/export.csv?format=${format}`
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Share2 className="size-4" /> <span className="hidden sm:inline">Exporter</span>
      </Button>
      {open && (
        <Dialog open onClose={() => setOpen(false)} title="Exporter vos produits" size="sm">
          <div className="space-y-5 text-sm">
            <section className="space-y-2">
              <p className="font-semibold">Google Shopping, Facebook et Instagram</p>
              <p className="text-muted">Collez ce lien dans Google Merchant Center ou dans le gestionnaire de catalogue Meta. Vos produits, prix et stocks s’y mettent à jour tout seuls.</p>
              <div className="flex gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-surface-2 px-3 py-2 text-[12.5px]">{feed}</code>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await navigator.clipboard?.writeText(feed)
                    toast.success('Lien copié')
                  }}
                >
                  <Copy className="size-4" /> Copier
                </Button>
              </div>
            </section>
            <section className="space-y-2">
              <p className="font-semibold">Fichier pour une autre plateforme</p>
              <p className="text-muted">Un fichier prêt à importer, avec photos, prix, variantes et stock.</p>
              <div className="flex flex-wrap gap-2">
                <a href={file('shopify')} download className={buttonClass('secondary', 'md')}>
                  <Download className="size-4" /> Pour Shopify
                </a>
                <a href={file('woocommerce')} download className={buttonClass('secondary', 'md')}>
                  <Download className="size-4" /> Pour WooCommerce
                </a>
              </div>
            </section>
          </div>
        </Dialog>
      )}
    </>
  )
}
