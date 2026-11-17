import Image from '@tiptap/extension-image'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Quote, Redo2, Undo2 } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { useToast } from '@/components/Toast'
import { cx } from '@/components/ui'
import { useStoreId } from '@/hooks/auth'
import { uploadImage } from '@/hooks/resources'

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
      className={cx('flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-40', active && 'bg-surface-2 text-fg')}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const storeId = useStoreId()
  const toast = useToast()
  const file = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      ul: e.isActive('bulletList'),
      ol: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })
  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Adresse du lien (laisser vide pour retirer)', prev ?? 'https://')
    if (url === null) return
    if (!url.trim() || url === 'https://') editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else if (/^https?:\/\//.test(url.trim())) editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
    else toast.error('Lien http(s) attendu')
  }
  const onImage = async (f: File | undefined) => {
    if (!f) return
    setUploading(true)
    try {
      const r = await uploadImage(storeId, f, 'content')
      editor.chain().focus().setImage({ src: r.url ?? r.key }).run()
    } catch (e) {
      toast.error(e)
    } finally {
      setUploading(false)
      if (file.current) file.current.value = ''
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-1.5 py-1" role="toolbar" aria-label="Mise en forme">
      <Tool label="Gras" active={s.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="size-4" />
      </Tool>
      <Tool label="Italique" active={s.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="size-4" />
      </Tool>
      <span className="mx-1 h-5 w-px bg-line" />
      <Tool label="Titre" active={s.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="size-4" />
      </Tool>
      <Tool label="Sous-titre" active={s.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="size-4" />
      </Tool>
      <Tool label="Liste à puces" active={s.ul} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="size-4" />
      </Tool>
      <Tool label="Liste numérotée" active={s.ol} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="size-4" />
      </Tool>
      <Tool label="Citation" active={s.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="size-4" />
      </Tool>
      <span className="mx-1 h-5 w-px bg-line" />
      <Tool label="Lien" active={s.link} onClick={setLink}>
        <Link2 className="size-4" />
      </Tool>
      <Tool label="Insérer une image" onClick={() => file.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
      </Tool>
      <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => void onImage(e.target.files?.[0])} />
      <span className="ml-auto flex">
        <Tool label="Annuler" disabled={!s.canUndo} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="size-4" />
        </Tool>
        <Tool label="Rétablir" disabled={!s.canRedo} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="size-4" />
        </Tool>
      </span>
    </div>
  )
}

/** Éditeur riche (HTML). La valeur initiale n'est lue qu'au montage. */
export default function RichText({ value, onChange, placeholder, label }: { value: string; onChange: (html: string) => void; placeholder?: string; label: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true, protocols: ['http', 'https'] } }),
      Image.configure({ inline: false }),
    ],
    content: value,
    immediatelyRender: true,
    editorProps: {
      attributes: { class: 'prose-editor text-[15px] sm:text-sm', 'aria-label': label, role: 'textbox', 'aria-multiline': 'true', 'data-placeholder': placeholder ?? '' },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  })
  if (!editor) return null
  return (
    <div className="overflow-hidden rounded-lg border border-line-strong bg-surface focus-within:ring-2 focus-within:ring-accent/40">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
