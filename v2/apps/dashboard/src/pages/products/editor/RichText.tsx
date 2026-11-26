/**
 * Éditeur riche de la description (HTML).
 * - Barre d'outils collée en haut de l'écran pendant le défilement : jamais besoin de remonter.
 * - Menu flottant sur le texte sélectionné (gras, couleur, lien, titre…), là où l'on travaille.
 * Les styles produits (couleur, surlignage, alignement) passent le nettoyage HTML du serveur.
 */
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { BackgroundColor, Color, TextStyle } from '@tiptap/extension-text-style'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  ChevronDown,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Dialog } from '@/components/Dialog'
import { CtaContext, CtaSlot, INSERT_CTA_EVENT, type CtaLabel } from './ctaSlot'
import { useToast } from '@/components/Toast'
import { Button, cx } from '@/components/ui'
import { useStoreId } from '@/hooks/auth'
import { uploadImage } from '@/hooks/resources'

const TEXT_COLORS = [
  { label: 'Noir', value: '#1c1917' },
  { label: 'Gris', value: '#57534e' },
  { label: 'Rouge', value: '#b91c1c' },
  { label: 'Orange', value: '#c2410c' },
  { label: 'Ambre', value: '#b45309' },
  { label: 'Vert', value: '#15803d' },
  { label: 'Bleu', value: '#1d4ed8' },
  { label: 'Violet', value: '#7e22ce' },
]
const HIGHLIGHTS = [
  { label: 'Jaune', value: '#fef08a' },
  { label: 'Vert', value: '#bbf7d0' },
  { label: 'Bleu', value: '#bfdbfe' },
  { label: 'Rose', value: '#fecdd3' },
  { label: 'Violet', value: '#e9d5ff' },
  { label: 'Orange', value: '#fed7aa' },
]

/** Image avec taille (largeur en %) et alignement, gardés dans le HTML : style="width:50%" et data-align. */
const SIZES = [25, 50, 75, 100] as const
const SizedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const m = /width:\s*(25|50|75|100)%/.exec(el.getAttribute('style') ?? '')
          return m ? Number(m[1]) : null
        },
        renderHTML: (attrs) => (attrs.width && attrs.width !== 100 ? { style: `width:${attrs.width}%` } : {}),
      },
      align: {
        default: null,
        parseHTML: (el) => {
          const a = el.getAttribute('data-align')
          return a === 'left' || a === 'right' || a === 'center' ? a : null
        },
        renderHTML: (attrs) => (attrs.align && attrs.align !== 'center' ? { 'data-align': attrs.align } : {}),
      },
    }
  },
})

/** Menu sur une image sélectionnée : taille et alignement. */
function ImageMenu({ editor }: { editor: Editor }) {
  const attrs = useEditorState({ editor, selector: ({ editor: e }) => ({ width: (e.getAttributes('image').width as number | null) ?? 100, align: (e.getAttributes('image').align as string | null) ?? 'center' }) })
  const setAttr = (v: Record<string, unknown>) => editor.chain().focus().updateAttributes('image', v).run()
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="imageMenu"
      shouldShow={({ editor: e }) => e.isEditable && e.isActive('image')}
      appendTo={() => document.body}
      options={{ strategy: 'fixed', placement: 'top', offset: 8, flip: true, shift: { padding: 8 } }}
      className="z-50 flex items-center gap-0.5 rounded-lg border border-line bg-surface p-1 shadow-lg"
    >
      {SIZES.map((w) => (
        <button
          key={w}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setAttr({ width: w === 100 ? null : w })}
          aria-pressed={attrs.width === w}
          title={w === 100 ? 'Pleine largeur' : `Largeur ${w} %`}
          className={cx('h-8 rounded-md px-2 text-[12px] font-semibold text-muted hover:bg-surface-2 hover:text-fg', attrs.width === w && 'bg-accent/10 text-accent hover:bg-accent/15 hover:text-accent')}
        >
          {w === 100 ? 'Pleine' : `${w} %`}
        </button>
      ))}
      <Sep />
      <Tool label="Image à gauche" active={attrs.align === 'left'} onClick={() => setAttr({ align: 'left' })}>
        <AlignLeft className="size-4" />
      </Tool>
      <Tool label="Image centrée" active={attrs.align === 'center'} onClick={() => setAttr({ align: null })}>
        <AlignCenter className="size-4" />
      </Tool>
      <Tool label="Image à droite" active={attrs.align === 'right'} onClick={() => setAttr({ align: 'right' })}>
        <AlignRight className="size-4" />
      </Tool>
    </BubbleMenu>
  )
}

function Tool({ onClick, active, label, children, disabled }: { onClick: () => void; active?: boolean; label: string; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      className={cx('flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-40', active && 'bg-accent/10 text-accent hover:bg-accent/15 hover:text-accent')}
    >
      {children}
    </button>
  )
}

const Sep = () => <span className="mx-0.5 h-5 w-px shrink-0 bg-line" aria-hidden />

/** Petit menu de couleurs (texte ou surlignage). */
function Swatches({ label, icon, colors, current, onPick, onClear, clearLabel }: { label: string; icon: ReactNode; colors: { label: string; value: string }[]; current: string | null; onPick: (c: string) => void; onClear: () => void; clearLabel: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        title={label}
        aria-expanded={open}
        className={cx('flex h-8 items-center gap-0.5 rounded-md px-1.5 text-muted hover:bg-surface-2 hover:text-fg', current && 'text-fg')}
      >
        <span className="relative flex flex-col items-center">
          {icon}
          <span className="mt-px h-[3px] w-4 rounded-full" style={{ background: current ?? 'transparent' }} />
        </span>
        <ChevronDown className="size-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-40 mt-1 w-44 rounded-lg border border-line bg-surface p-2 shadow-lg" role="menu">
          <div className="grid grid-cols-4 gap-1.5">
            {colors.map((c) => (
              <button
                key={c.value}
                type="button"
                role="menuitem"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(c.value)
                  setOpen(false)
                }}
                title={c.label}
                aria-label={c.label}
                className={cx('size-8 rounded-md ring-1 ring-black/10 ring-inset hover:scale-105', current === c.value && 'ring-2 ring-accent')}
                style={{ background: c.value }}
              />
            ))}
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onClear()
              setOpen(false)
            }}
            className="mt-2 w-full rounded-md px-2 py-1 text-left text-[13px] text-muted hover:bg-surface-2 hover:text-fg"
          >
            {clearLabel}
          </button>
        </div>
      )}
    </div>
  )
}

function useFormatState(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      paragraph: e.isActive('paragraph') && !e.isActive('bulletList') && !e.isActive('orderedList') && !e.isActive('blockquote'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      ul: e.isActive('bulletList'),
      ol: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
      left: e.isActive({ textAlign: 'left' }),
      center: e.isActive({ textAlign: 'center' }),
      right: e.isActive({ textAlign: 'right' }),
      color: (e.getAttributes('textStyle').color as string | undefined) ?? null,
      highlight: (e.getAttributes('textStyle').backgroundColor as string | undefined) ?? null,
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })
}

function useActions(editor: Editor) {
  const storeId = useStoreId()
  const toast = useToast()
  const file = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const chain = () => editor.chain().focus()
  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Adresse du lien (laisser vide pour retirer)', prev ?? 'https://')
    if (url === null) return
    if (!url.trim() || url === 'https://') chain().extendMarkRange('link').unsetLink().run()
    else if (/^(https?:\/\/|mailto:|tel:)/.test(url.trim())) chain().extendMarkRange('link').setLink({ href: url.trim() }).run()
    else toast.error('Lien http(s), mailto: ou tel: attendu')
  }
  const onImage = async (f: File | undefined) => {
    if (!f) return
    setUploading(true)
    try {
      const r = await uploadImage(storeId, f, 'content')
      chain().setImage({ src: r.url ?? r.key }).run()
    } catch (e) {
      toast.error(e)
    } finally {
      setUploading(false)
      if (file.current) file.current.value = ''
    }
  }
  const imageInput = <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => void onImage(e.target.files?.[0])} />
  return { chain, setLink, pickImage: () => file.current?.click(), uploading, imageInput }
}

function Toolbar({ editor, images = [] }: { editor: Editor; images?: string[] }) {
  const [picker, setPicker] = useState(false)
  const s = useFormatState(editor)
  const a = useActions(editor)
  return (
    <div
      className="scrollbar-none sticky top-[6.3rem] z-10 flex items-center gap-0.5 overflow-x-auto rounded-t-lg border-b border-line bg-surface/95 px-1.5 py-1 backdrop-blur lg:top-[2.8rem] sm:flex-wrap sm:overflow-visible"
      role="toolbar"
      aria-label="Mise en forme"
    >
      <Tool label="Annuler" disabled={!s.canUndo} onClick={() => a.chain().undo().run()}>
        <Undo2 className="size-4" />
      </Tool>
      <Tool label="Rétablir" disabled={!s.canRedo} onClick={() => a.chain().redo().run()}>
        <Redo2 className="size-4" />
      </Tool>
      <Sep />
      <Tool label="Texte normal" active={s.paragraph && !s.h2 && !s.h3} onClick={() => a.chain().setParagraph().run()}>
        <Pilcrow className="size-4" />
      </Tool>
      <Tool label="Titre" active={s.h2} onClick={() => a.chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="size-4" />
      </Tool>
      <Tool label="Sous-titre" active={s.h3} onClick={() => a.chain().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="size-4" />
      </Tool>
      <Sep />
      <Tool label="Gras" active={s.bold} onClick={() => a.chain().toggleBold().run()}>
        <Bold className="size-4" />
      </Tool>
      <Tool label="Italique" active={s.italic} onClick={() => a.chain().toggleItalic().run()}>
        <Italic className="size-4" />
      </Tool>
      <Tool label="Souligné" active={s.underline} onClick={() => a.chain().toggleUnderline().run()}>
        <Underline className="size-4" />
      </Tool>
      <Tool label="Barré" active={s.strike} onClick={() => a.chain().toggleStrike().run()}>
        <Strikethrough className="size-4" />
      </Tool>
      <Swatches label="Couleur du texte" icon={<Baseline className="size-4" />} colors={TEXT_COLORS} current={s.color} onPick={(c) => a.chain().setColor(c).run()} onClear={() => a.chain().unsetColor().run()} clearLabel="Couleur par défaut" />
      <Swatches label="Surligner" icon={<Highlighter className="size-4" />} colors={HIGHLIGHTS} current={s.highlight} onPick={(c) => a.chain().setBackgroundColor(c).run()} onClear={() => a.chain().unsetBackgroundColor().run()} clearLabel="Sans surlignage" />
      <Sep />
      <Tool label="Aligner à gauche" active={s.left} onClick={() => a.chain().setTextAlign('left').run()}>
        <AlignLeft className="size-4" />
      </Tool>
      <Tool label="Centrer" active={s.center} onClick={() => a.chain().setTextAlign('center').run()}>
        <AlignCenter className="size-4" />
      </Tool>
      <Tool label="Aligner à droite" active={s.right} onClick={() => a.chain().setTextAlign('right').run()}>
        <AlignRight className="size-4" />
      </Tool>
      <Sep />
      <Tool label="Liste à puces" active={s.ul} onClick={() => a.chain().toggleBulletList().run()}>
        <List className="size-4" />
      </Tool>
      <Tool label="Liste numérotée" active={s.ol} onClick={() => a.chain().toggleOrderedList().run()}>
        <ListOrdered className="size-4" />
      </Tool>
      <Tool label="Citation" active={s.quote} onClick={() => a.chain().toggleBlockquote().run()}>
        <Quote className="size-4" />
      </Tool>
      <Tool label="Séparateur" onClick={() => a.chain().setHorizontalRule().run()}>
        <Minus className="size-4" />
      </Tool>
      <Sep />
      <Tool label="Lien" active={s.link} onClick={a.setLink}>
        <Link2 className="size-4" />
      </Tool>
      <Tool label="Insérer une image" onClick={() => (images.length ? setPicker(true) : a.pickImage())} disabled={a.uploading}>
        {a.uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
      </Tool>
      <Tool label="Effacer la mise en forme" onClick={() => a.chain().unsetAllMarks().clearNodes().run()}>
        <RemoveFormatting className="size-4" />
      </Tool>
      {a.imageInput}
      {picker && (
        <Dialog open onClose={() => setPicker(false)} title="Insérer une image" size="sm">
          <div className="space-y-4">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                setPicker(false)
                a.pickImage()
              }}
            >
              <ImagePlus className="size-4" /> Importer une nouvelle image
            </Button>
            <div>
              <p className="mb-2 text-sm font-medium">Ou choisir une photo du produit</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => {
                      a.chain().setImage({ src }).run()
                      setPicker(false)
                    }}
                    className="aspect-square overflow-hidden rounded-lg border border-line bg-surface-2 hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
                    aria-label="Insérer cette photo"
                  >
                    <img src={src} alt="" loading="lazy" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}

/** Menu au-dessus du texte sélectionné. */
function SelectionMenu({ editor }: { editor: Editor }) {
  const s = useFormatState(editor)
  const a = useActions(editor)
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e, state }) => e.isEditable && !state.selection.empty && !e.isActive('image') && !e.isActive('ctaSlot')}
      appendTo={() => document.body}
      options={{ strategy: 'fixed', placement: 'top', offset: 8, flip: true, shift: { padding: 8 } }}
      className="z-50 flex items-center gap-0.5 rounded-lg border border-line bg-surface p-1 shadow-lg"
    >
      <Tool label="Gras" active={s.bold} onClick={() => a.chain().toggleBold().run()}>
        <Bold className="size-4" />
      </Tool>
      <Tool label="Italique" active={s.italic} onClick={() => a.chain().toggleItalic().run()}>
        <Italic className="size-4" />
      </Tool>
      <Tool label="Souligné" active={s.underline} onClick={() => a.chain().toggleUnderline().run()}>
        <Underline className="size-4" />
      </Tool>
      <Tool label="Barré" active={s.strike} onClick={() => a.chain().toggleStrike().run()}>
        <Strikethrough className="size-4" />
      </Tool>
      <Swatches label="Couleur du texte" icon={<Baseline className="size-4" />} colors={TEXT_COLORS} current={s.color} onPick={(c) => a.chain().setColor(c).run()} onClear={() => a.chain().unsetColor().run()} clearLabel="Couleur par défaut" />
      <Swatches label="Surligner" icon={<Highlighter className="size-4" />} colors={HIGHLIGHTS} current={s.highlight} onPick={(c) => a.chain().setBackgroundColor(c).run()} onClear={() => a.chain().unsetBackgroundColor().run()} clearLabel="Sans surlignage" />
      <Sep />
      <Tool label="Titre" active={s.h2} onClick={() => a.chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="size-4" />
      </Tool>
      <Tool label="Sous-titre" active={s.h3} onClick={() => a.chain().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="size-4" />
      </Tool>
      <Tool label="Lien" active={s.link} onClick={a.setLink}>
        <Link2 className="size-4" />
      </Tool>
      <Tool label="Effacer la mise en forme" onClick={() => a.chain().unsetAllMarks().run()}>
        <RemoveFormatting className="size-4" />
      </Tool>
    </BubbleMenu>
  )
}

/** Éditeur riche (HTML). Une valeur changée de l'extérieur (réécriture IA, image retirée) est reprise sans recréer l'éditeur. */
export default function RichText({ value, onChange, placeholder, label, images, ctas }: { value: string; onChange: (html: string) => void; placeholder?: string; label: string; /** Photos déjà dans le produit, proposées à l'insertion d'une image. */ images?: string[]; /** Boutons du produit, à placer dans le texte par glisser-déposer. */ ctas?: CtaLabel[] }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true, protocols: ['http', 'https', 'mailto', 'tel'] } }),
      SizedImage.configure({ inline: false }),
      CtaSlot,
      TextStyle,
      Color,
      BackgroundColor,
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right'] }),
    ],
    content: value,
    immediatelyRender: true,
    editorProps: {
      attributes: { class: 'prose-editor text-[15px] sm:text-sm', 'aria-label': label, role: 'textbox', 'aria-multiline': 'true', 'data-placeholder': placeholder ?? '' },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  })
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (value === editor.getHTML() || (!value && editor.isEmpty)) return
    editor.commands.setContent(value, { emitUpdate: false })
  }, [value, editor])
  // « Placer dans le texte » depuis la liste des boutons : à l'endroit du curseur (sinon à la fin).
  useEffect(() => {
    if (!editor || !ctas) return
    const onInsert = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (!id || editor.isDestroyed) return
      let exists = false
      editor.state.doc.descendants((n) => {
        if (n.type.name === 'ctaSlot' && n.attrs.id === id) exists = true
      })
      if (exists) return
      editor.chain().focus().insertContent({ type: 'ctaSlot', attrs: { id } }).run()
      editor.view.dom.closest('.rounded-lg')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
    window.addEventListener(INSERT_CTA_EVENT, onInsert)
    return () => window.removeEventListener(INSERT_CTA_EVENT, onInsert)
  }, [editor, ctas])
  if (!editor) return null
  return (
    <div className="rounded-lg border border-line-strong bg-surface focus-within:ring-2 focus-within:ring-accent/40">
      <Toolbar editor={editor} images={images} />
      <CtaContext.Provider value={ctas ?? []}>
        <EditorContent editor={editor} />
      </CtaContext.Provider>
      <SelectionMenu editor={editor} />
      <ImageMenu editor={editor} />
    </div>
  )
}
