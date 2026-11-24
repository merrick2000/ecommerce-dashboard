/**
 * Assistant de description (import par lien et éditeur) :
 * - réécriture par l'IA selon PASA ou AIDA (méthode choisie selon le produit), texte ordonné et aéré ;
 * - images trouvées dans la description : garder, régénérer (même produit, photo propre, sans texte) ou retirer.
 * Tout se fait sur le HTML de la description ; le parent reste maître de la valeur.
 */
import { useQuery } from '@tanstack/react-query'
import { Check, ImageOff, Loader2, RefreshCw, RotateCcw, Sparkles, Undo2, Wand2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from '@/components/Toast'
import { Badge, Button, cx, Input } from '@/components/ui'
import { useStoreId } from '@/hooks/auth'
import { api } from '@/lib/api'

type Framework = 'PASA' | 'AIDA'
interface Rewrite {
  framework: Framework
  reason: string
  description: string
  images: number
}

const FRAMEWORK: Record<Framework, string> = {
  PASA: 'Problème, Agitation, Solution, Action',
  AIDA: 'Attention, Intérêt, Désir, Action',
}

/** Rendu lisible d'une description (titres, listes, citations, images). */
export const PROSE = 'prose-editor !min-h-0 text-sm [&_figure]:my-3 [&_img]:!mx-auto [&_img]:block [&_img]:max-h-72 [&_strong]:font-semibold'

const textLength = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length

/** Images de la description, dans l'ordre. */
function imagesOf(html: string): { src: string; alt: string }[] {
  if (!html.includes('<img')) return []
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const seen = new Set<string>()
  return [...doc.querySelectorAll('img')]
    .map((img) => ({ src: img.getAttribute('src') ?? '', alt: img.getAttribute('alt') ?? '' }))
    .filter((i) => /^https?:\/\//.test(i.src) && !seen.has(i.src) && seen.add(i.src))
}

function editImages(html: string, src: string, fn: (img: HTMLImageElement) => void): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('img').forEach((img) => {
    if (img.getAttribute('src') === src) fn(img)
  })
  return doc.body.innerHTML
}

const replaceSrc = (html: string, from: string, to: string) => editImages(html, from, (img) => img.setAttribute('src', to))
const removeImage = (html: string, src: string) =>
  editImages(html, src, (img) => {
    const parent = img.parentElement
    img.remove()
    // Le conteneur devenu vide (figure, paragraphe) part avec l'image.
    if (parent && parent.tagName !== 'BODY' && !parent.textContent?.trim() && !parent.querySelector('img')) parent.remove()
  })

/** Texte autour de l'image (pour dire à l'IA ce qu'elle illustre). */
function contextOf(html: string, src: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const img = [...doc.querySelectorAll('img')].find((i) => i.getAttribute('src') === src)
  if (!img) return ''
  let node: Element | null = img.closest('figure, p') ?? img
  const parts: string[] = []
  for (let k = 0; k < 2 && node; k++) {
    node = node.previousElementSibling
    const t = node?.textContent?.trim()
    if (t) parts.unshift(t)
  }
  return parts.join(' ').slice(0, 380)
}

type ImageJob = { status: 'running' } | { status: 'failed'; error: string }

export function DescriptionAI({ html, onChange, name, features = [], price = null, autoApply = false, type }: { html: string; onChange: (html: string) => void; name: string; features?: string[]; price?: number | null; autoApply?: boolean; type?: 'physical' | 'digital' }) {
  const digital = type === 'digital'
  const storeId = useStoreId()
  const toast = useToast()
  const { data: config } = useQuery({ queryKey: ['product-ai-config', storeId], queryFn: () => api.get<{ rewrite: boolean; images: boolean; reason?: 'ok' | 'no_key' | 'closed' }>(`/stores/${storeId}/products/ai/config`), staleTime: 5 * 60_000 })
  const [goal, setGoal] = useState('')
  const [writing, setWriting] = useState(false)
  const [proposal, setProposal] = useState<Rewrite | null>(null)
  const [applied, setApplied] = useState<{ framework: Framework; reason: string; previous: string } | null>(null)
  const [jobs, setJobs] = useState<Record<string, ImageJob>>({})
  /** Image régénérée → image d'origine (pour pouvoir revenir en arrière). */
  const [originals, setOriginals] = useState<Record<string, string>>({})
  const [instructions, setInstructions] = useState<Record<string, string>>({})
  const [undo, setUndo] = useState<string | null>(null)
  const alive = useRef(true)
  const latest = useRef(html)
  latest.current = html
  useEffect(() => {
    alive.current = true
    return () => void (alive.current = false)
  }, [])

  const images = useMemo(() => imagesOf(html), [html])
  const enabled = !!config?.rewrite
  const canRewrite = textLength(html) >= 20 || features.length > 0

  const rewrite = async () => {
    setWriting(true)
    try {
      const r = await api.post<Rewrite>(`/stores/${storeId}/products/ai/rewrite-description`, { name, description: latest.current, features: features.filter(Boolean), price, goal: goal.trim() || undefined, type })
      if (!alive.current) return
      if (autoApply) use(r)
      else setProposal(r)
    } catch (e) {
      if (alive.current) toast.error(e)
    } finally {
      if (alive.current) setWriting(false)
    }
  }

  const use = (r: Rewrite) => {
    setApplied({ framework: r.framework, reason: r.reason, previous: latest.current })
    setProposal(null)
    onChange(r.description)
  }

  // Import : la description copiée d'un bloc est réécrite d'office (l'original reste à un clic).
  const started = useRef(false)
  useEffect(() => {
    if (autoApply && enabled && !started.current && canRewrite) {
      started.current = true
      void rewrite()
    }
  }, [autoApply, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  const regenerate = async (src: string) => {
    const original = originals[src] ?? src
    setJobs((j) => ({ ...j, [src]: { status: 'running' } }))
    try {
      const { taskId } = await api.post<{ taskId: string }>(`/stores/${storeId}/products/ai/images/regenerate`, { imageUrl: original, name, context: contextOf(latest.current, src) || undefined, instruction: instructions[src]?.trim() || undefined, type })
      const deadline = Date.now() + 4 * 60_000
      while (alive.current && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 4000))
        const s = await api.get<{ status: 'pending' | 'done' | 'failed'; url?: string; error?: string }>(`/stores/${storeId}/products/ai/images/regenerate/${taskId}`)
        if (s.status === 'pending') continue
        if (s.status === 'failed' || !s.url) throw new Error(s.error ?? 'La génération a échoué.')
        if (!alive.current) return
        onChange(replaceSrc(latest.current, src, s.url))
        setOriginals((o) => ({ ...o, [s.url!]: original }))
        setJobs(({ [src]: _, ...rest }) => rest)
        return
      }
      if (alive.current) throw new Error('La génération prend trop de temps. Réessayez.')
    } catch (e) {
      if (alive.current) setJobs((j) => ({ ...j, [src]: { status: 'failed', error: e instanceof Error ? e.message : 'La génération a échoué.' } }))
    }
  }

  const restore = (src: string) => {
    const original = originals[src]
    if (!original) return
    onChange(replaceSrc(latest.current, src, original))
  }

  const remove = (src: string) => {
    setUndo(latest.current)
    onChange(removeImage(latest.current, src))
  }

  if (!enabled) {
    if (config?.reason !== 'no_key') return null
    return (
      <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        Rédaction IA indisponible : la clé KIE n’est pas configurée sur le serveur. Ajoutez la variable <code>KIE_API_KEY</code> dans Dokploy, puis redéployez l’API.
      </p>
    )
  }
  return (
    <div className="mt-4 space-y-4">
      {/* Réécriture */}
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Wand2 className="size-4 text-accent" /> Réécrire avec l’IA
            </p>
            <p className="mt-0.5 text-[13px] text-muted">{digital ? 'Page de vente remise en ordre : pour qui, ce que l’on obtient, le contenu, le format et l’accès, selon la méthode la plus adaptée : PASA (un blocage à lever) ou AIDA (une ambition à nourrir). Rien n’est inventé.' : 'Texte remis en ordre et aéré, selon la méthode la plus adaptée au produit : PASA (un problème à régler) ou AIDA (une envie à créer). Rien n’est inventé.'}</p>
          </div>
          <Button size="sm" variant={applied || proposal ? 'secondary' : 'primary'} onClick={rewrite} loading={writing} disabled={!canRewrite}>
            <Sparkles className="size-3.5" /> {applied || proposal ? 'Nouvelle version' : 'Réécrire'}
          </Button>
        </div>
        <Input aria-label="Objectif de la réécriture" placeholder={digital ? 'Objectif (facultatif) : ex. cible les débutants, ton motivant' : 'Objectif (facultatif) : ex. cible les chauffeurs VTC, ton rassurant'} value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={300} wrapClass="mt-3" />
        {writing && (
          <p className="mt-3 flex items-center gap-2 text-[13px] text-muted">
            <Loader2 className="size-4 animate-spin" /> Rédaction en cours, jusqu’à une minute…
          </p>
        )}
        {applied && !writing && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
            <Badge tone="green">
              <Check className="size-3" /> Méthode {applied.framework}
            </Badge>
            <span className="text-muted">{FRAMEWORK[applied.framework]}. {applied.reason}</span>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1 font-medium text-accent hover:underline"
              onClick={() => {
                onChange(applied.previous)
                setApplied(null)
              }}
            >
              <RotateCcw className="size-3.5" /> Revenir à l’original
            </button>
          </div>
        )}
        {proposal && !writing && (
          <div className="mt-3 rounded-lg border border-line bg-surface p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="green">Méthode {proposal.framework}</Badge>
              <span className="text-[13px] text-muted">{FRAMEWORK[proposal.framework]}. {proposal.reason}</span>
            </div>
            {/* HTML nettoyé par le serveur. */}
            <div className={cx(PROSE, '!p-0 max-h-96 overflow-y-auto')} dangerouslySetInnerHTML={{ __html: proposal.description }} />
            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setProposal(null)}>
                Écarter
              </Button>
              <Button size="sm" variant="primary" onClick={() => use(proposal)}>
                <Check className="size-3.5" /> Utiliser cette version
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Images de la description */}
      {images.length > 0 && (
        <div className="rounded-lg border border-line p-3 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Images de la description ({images.length})</p>
              <p className="mt-0.5 text-[13px] text-muted">{digital ? 'Gardez-les, ou régénérez-les en maquette soignée (couverture en 3D, écrans qui montrent le contenu), sans logo ni texte parasite.' : 'Gardez-les, ou régénérez celles qui portent du texte étranger, un logo ou une mauvaise qualité : même produit, photo propre, sans texte.'}</p>
            </div>
            {undo && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onChange(undo)
                  setUndo(null)
                }}
              >
                <Undo2 className="size-3.5" /> Annuler le retrait
              </Button>
            )}
          </div>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {images.map((img, i) => {
              const job = jobs[img.src]
              const regenerated = !!originals[img.src]
              return (
                <li key={img.src} className="flex gap-3 rounded-lg border border-line bg-surface-2/40 p-2">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-surface-2">
                    <img src={img.src} alt={img.alt} loading="lazy" referrerPolicy="no-referrer" className={cx('size-full object-cover', job?.status === 'running' && 'opacity-40')} />
                    {job?.status === 'running' && <Loader2 className="absolute inset-0 m-auto size-6 animate-spin text-accent" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium">
                      Image {i + 1}
                      {regenerated ? <Badge tone="green">Régénérée</Badge> : <Badge tone="neutral">Gardée</Badge>}
                    </div>
                    {job?.status === 'running' ? (
                      <p className="text-[12px] text-muted">Génération en cours, environ une minute…</p>
                    ) : (
                      <>
                        <Input aria-label={`Consigne pour l’image ${i + 1}`} placeholder={digital ? 'Consigne (facultatif) : ex. sur un téléphone et un ordinateur' : 'Consigne (facultatif) : ex. posé sur un tableau de bord'} value={instructions[img.src] ?? ''} onChange={(e) => setInstructions((x) => ({ ...x, [img.src]: e.target.value }))} maxLength={300} className="!h-8 !text-[13px]" />
                        {job?.status === 'failed' && <p className="text-[12px] text-red-600 dark:text-red-400">{job.error}</p>}
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="ghost" onClick={() => regenerate(img.src)}>
                            <RefreshCw className="size-3.5" /> {regenerated ? 'Encore' : 'Régénérer'}
                          </Button>
                          {regenerated && (
                            <Button size="sm" variant="ghost" onClick={() => restore(img.src)}>
                              <RotateCcw className="size-3.5" /> Originale
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-red-600 dark:text-red-400" onClick={() => remove(img.src)}>
                            <ImageOff className="size-3.5" /> Retirer
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
