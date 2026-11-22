import { ArrowLeft, FileSpreadsheet, Link2 } from 'lucide-react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/ui'
import { useMe, useStoreId } from '@/hooks/auth'

/** Choix du mode d'import : fichier CSV (plusieurs produits) ou adresse d'une page produit. */
export default function ImportHub() {
  const storeId = useStoreId()
  const { data: me } = useMe()
  const base = `/stores/${storeId}/products`
  const back = (
    <Link to={base} className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Produits
    </Link>
  )
  const cards = [
    // Import par lien : visible seulement quand le super admin l'a ouvert (globalement ou pour ce compte).
    ...(me?.features.urlImport ? [{
      to: `${base}/import/url`,
      icon: Link2,
      title: 'Depuis une URL',
      text: 'Collez le lien d’une page produit, physique (Shopify, AliExpress, Amazon, Jumia…) ou digital (Selar, Chariow, Gumroad, Systeme.io…) : nom, prix, images et texte sont repris automatiquement.',
      tag: 'Le plus rapide',
    }] : []),
    {
      to: `${base}/import/csv`,
      icon: FileSpreadsheet,
      title: 'Depuis un fichier CSV',
      text: 'Importez plusieurs produits d’un coup : notre modèle, un export Shopify ou votre propre tableau (Excel, Google Sheets).',
      tag: 'Plusieurs produits',
    },
  ]
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader back={back} title="Importer des produits" description="Gagnez du temps : vos produits sont créés inactifs, vous les vérifiez puis vous les activez." />
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-accent hover:shadow-sm focus-visible:outline-2 focus-visible:outline-accent">
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent/12 text-accent">
              <c.icon className="size-5" />
            </span>
            <span className="mt-4 flex items-center gap-2">
              <span className="text-base font-semibold">{c.title}</span>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">{c.tag}</span>
            </span>
            <span className="mt-1.5 block text-sm text-muted">{c.text}</span>
            <span className="mt-4 inline-block text-sm font-semibold text-accent group-hover:underline">Commencer →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
