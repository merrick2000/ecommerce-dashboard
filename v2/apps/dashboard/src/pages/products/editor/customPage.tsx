/**
 * Page HTML libre : le vendeur colle une page complète (ChatGPT, Lovable, un autre constructeur…)
 * qui remplace le modèle. Les repères {{formulaire}}, {{prix}}… deviennent les vrais éléments Zuri.
 * L'API nettoie le HTML (scripts, formulaires étrangers retirés) ; l'original reste éditable ici.
 */
import { CUSTOM_PAGE_TOKENS } from '@zuri/shared'
import { Code2, ExternalLink, FileUp, RefreshCw } from 'lucide-react'
import { useRef, useState } from 'react'
import { useToast } from '@/components/Toast'
import { Button, Card, cx, Switch } from '@/components/ui'
import { useCurrentStore } from '@/hooks/auth'
import { storefrontProductUrl } from '@/lib/storefront'
import type { SectionProps } from './sections'

const TOKEN_HELP: Record<(typeof CUSTOM_PAGE_TOKENS)[number], string> = {
  formulaire: 'Formulaire de commande (packs, livraison, order bump, offres)',
  bouton: 'Bouton qui descend au formulaire',
  prix: 'Prix de vente',
  prix_barre: 'Ancien prix barré',
  nom: 'Nom du produit',
  boutique: 'Nom de la boutique',
  pack: 'Contenu du pack',
  urgence: 'Compte à rebours, stock limité (réglages de la boutique)',
  whatsapp: 'Bouton WhatsApp',
}

const STARTER = `<section style="max-width:720px;margin:0 auto;padding:32px 16px;text-align:center">
  <h1 style="font-size:32px;margin-bottom:12px">{{nom}}</h1>
  <p style="font-size:20px">Seulement <strong>{{prix}}</strong> {{prix_barre}}</p>
  {{bouton}}
</section>

{{formulaire}}
`

export function CustomPageSection({ form, set, productId, saved }: SectionProps & { productId: string | null; saved: boolean }) {
  const toast = useToast()
  const { store } = useCurrentStore()
  const area = useRef<HTMLTextAreaElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const [reload, setReload] = useState(0)
  const page = form.content.customPage
  const on = !!page?.enabled
  const source = page?.source ?? ''
  const setPage = (patch: Partial<NonNullable<typeof page>>) =>
    set({ content: { ...form.content, customPage: { enabled: false, source: '', html: '', css: '', fonts: [], tailwind: false, ...page, ...patch } } })

  const insert = (token: string) => {
    const el = area.current
    const text = `{{${token}}}`
    if (!el) return setPage({ source: source + text })
    const start = el.selectionStart ?? source.length
    const end = el.selectionEnd ?? source.length
    setPage({ source: source.slice(0, start) + text + source.slice(end) })
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + text.length, start + text.length)
    })
  }
  const load = async (f: File | undefined) => {
    if (!f) return
    if (f.size > 400_000) return toast.error('Fichier trop lourd (400 Ko maximum)')
    setPage({ source: await f.text(), enabled: true })
    toast.success('Page chargée : vérifie les repères puis enregistre')
  }
  const url = productId && store ? `${storefrontProductUrl(store.slug, productId)}?notrack&v=${reload}` : null
  const missingForm = on && source.trim() && !/\{\{\s*(formulaire|commande)\s*\}\}/i.test(source)

  return (
    <Card
      title="Page HTML libre"
      description="Colle une page complète faite ailleurs (ChatGPT, Lovable, un constructeur de pages). Elle remplace le modèle ; Zuri y ajoute son formulaire, ses prix et son suivi."
    >
      <Switch
        checked={on}
        onChange={(v) => setPage({ enabled: v, source: source || (v ? STARTER : '') })}
        label="Utiliser ma propre page HTML"
        description={on ? 'Les sections ci-dessous (en-tête, description, points forts…) ne sont plus affichées.' : 'Sinon, la page est construite avec le modèle et les sections ci-dessous.'}
      />
      {on && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => file.current?.click()}>
              <FileUp className="size-4" /> Importer un fichier .html
            </Button>
            <input ref={file} type="file" accept=".html,.htm,text/html" className="hidden" onChange={(e) => void load(e.target.files?.[0])} />
            <span className="text-[12px] text-muted">ou colle le code ci-dessous</span>
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-medium">Repères (clic pour insérer à l’endroit du curseur)</p>
            <div className="flex flex-wrap gap-1.5">
              {CUSTOM_PAGE_TOKENS.map((t) => (
                <button key={t} type="button" title={TOKEN_HELP[t]} onClick={() => insert(t)} className="rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-[12px] hover:border-accent">
                  {`{{${t}}}`}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <Code2 className="pointer-events-none absolute top-2.5 right-3 size-4 text-subtle" />
            <textarea
              ref={area}
              aria-label="Code HTML de la page"
              value={source}
              onChange={(e) => setPage({ source: e.target.value })}
              spellCheck={false}
              rows={18}
              maxLength={400_000}
              className="w-full rounded-lg border border-line-strong bg-surface p-3 font-mono text-[12.5px] leading-relaxed outline-none focus:border-accent"
              placeholder="<section>…</section>"
            />
            <p className="mt-1 text-right text-[11px] text-muted">{Math.round(source.length / 1000)} Ko / 400 Ko</p>
          </div>
          {missingForm && <p className="rounded-lg bg-amber-50 p-3 text-[13px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">Pas de repère {'{{formulaire}}'} : le formulaire de commande sera ajouté à la fin de ta page.</p>}
          <ul className="list-disc space-y-1 pl-5 text-[12.5px] text-muted">
            <li>Gardés : mise en page, styles, images, vidéos YouTube, polices Google, Tailwind.</li>
            <li>Retirés pour la sécurité de tes clients : scripts, formulaires étrangers, iframes non vidéo. Les liens vers #commander descendent au formulaire.</li>
            <li>Le pixel, le suivi des visites, l’order bump et les offres après commande fonctionnent comme sur le modèle.</li>
          </ul>
          {url && !form.isActive && <p className="text-[13px] text-muted">L’aperçu s’affiche quand le produit est en vente (onglet Général).</p>}
          {url && form.isActive && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Aperçu {saved ? '' : <span className="text-[12px] font-normal text-amber-700 dark:text-amber-400">(enregistre pour voir tes derniers changements)</span>}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setReload((r) => r + 1)}>
                    <RefreshCw className="size-3.5" /> Actualiser
                  </Button>
                  <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-3 text-sm hover:bg-surface-2">
                    <ExternalLink className="size-3.5" /> Ouvrir
                  </a>
                </div>
              </div>
              <iframe key={reload} title="Aperçu de la page" src={url} className={cx('h-[640px] w-full rounded-xl border border-line bg-white')} loading="lazy" />
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
