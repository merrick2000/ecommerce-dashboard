/**
 * Bouton de la description placé dans le texte : un bloc qu'on fait glisser à l'endroit voulu.
 * Enregistré comme <div data-cta-slot="id"></div> ; la page de vente y affiche le vrai bouton.
 */
import { mergeAttributes, Node, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { GripVertical, X } from 'lucide-react'
import { createContext, useContext } from 'react'
import { cx } from '@/components/ui'

export type CtaLabel = { id: string; text: string }

/** Boutons du produit (pour afficher leur texte dans l'éditeur). */
export const CtaContext = createContext<CtaLabel[]>([])

/** Événement pour placer un bouton à l'endroit du curseur (bouton « Placer dans le texte » de la liste). */
export const INSERT_CTA_EVENT = 'zuri:insert-cta'

export const newCtaId = () => Math.random().toString(36).slice(2, 10).padEnd(8, '0')

function CtaSlotView({ node, deleteNode, selected }: NodeViewProps) {
  const ctas = useContext(CtaContext)
  const cta = ctas.find((c) => c.id === node.attrs.id)
  return (
    <NodeViewWrapper
      data-drag-handle
      contentEditable={false}
      className={cx('my-3 flex cursor-grab items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-2 active:cursor-grabbing', selected ? 'border-accent bg-accent/5' : 'border-line-strong')}
      title="Glissez pour déplacer ce bouton dans le texte"
    >
      <GripVertical className="size-4 shrink-0 text-muted" aria-hidden />
      <span className={cx('rounded-md px-4 py-1.5 text-sm font-semibold', cta ? 'bg-accent text-white' : 'bg-surface-2 text-muted line-through')}>{cta ? cta.text || 'Bouton' : 'Bouton supprimé'}</span>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => deleteNode()}
        className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
        aria-label="Retirer ce bouton du texte"
        title="Retirer du texte (le bouton reste dans la liste)"
      >
        <X className="size-4" />
      </button>
    </NodeViewWrapper>
  )
}

export const CtaSlot = Node.create({
  name: 'ctaSlot',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-cta-slot'),
        renderHTML: (attrs) => ({ 'data-cta-slot': attrs.id }),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-cta-slot]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(CtaSlotView)
  },
})
