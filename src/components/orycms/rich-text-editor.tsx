"use client"

import { useEffect } from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Rich text editor used for product long-form content. Outputs HTML that the
 * storefront renders directly, so the same authored formatting (headings, lists,
 * tables, images, alignment) appears verbatim on the product page.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const editor = useEditor({
    // Avoids an SSR hydration mismatch for the contentEditable surface.
    immediatelyRender: false,
    extensions: [
      // StarterKit already bundles Underline and Link — configure them here rather
      // than importing separately (double-registration warns and misbehaves).
      StarterKit.configure({
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" } },
      }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "orycms-richtext min-h-[220px] rounded-b-lg border border-t-0 border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-border-strong",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // TipTap represents an empty doc as "<p></p>"; normalize to "" so required checks work.
      onChange(html === "<p></p>" ? "" : html)
    },
  })

  // Keep the editor in sync when the value is replaced externally (e.g. after load/save).
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const incoming = value || ""
    if (incoming !== current && incoming !== (current === "<p></p>" ? "" : current)) {
      editor.commands.setContent(incoming, { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) {
    return <div className="min-h-[260px] rounded-lg border border-border bg-surface-muted/40" aria-hidden />
  }

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} data-placeholder={placeholder} />
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  function addLink() {
    const previous = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Link URL", previous ?? "https://")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  function addImage() {
    const url = window.prompt("Image URL")
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  function addTable() {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-border bg-surface-muted px-2 py-1.5">
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1"><Heading1 className="h-3.5 w-3.5" /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 className="h-3.5 w-3.5" /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 className="h-3.5 w-3.5" /></Btn>
      <Divider />
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="h-3.5 w-3.5" /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="h-3.5 w-3.5" /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><UnderlineIcon className="h-3.5 w-3.5" /></Btn>
      <Divider />
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list"><List className="h-3.5 w-3.5" /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></Btn>
      <Divider />
      <Btn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left"><AlignLeft className="h-3.5 w-3.5" /></Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center"><AlignCenter className="h-3.5 w-3.5" /></Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right"><AlignRight className="h-3.5 w-3.5" /></Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify"><AlignJustify className="h-3.5 w-3.5" /></Btn>
      <Divider />
      <Btn onClick={addLink} active={editor.isActive("link")} title="Link"><Link2 className="h-3.5 w-3.5" /></Btn>
      <Btn onClick={addImage} title="Image"><ImageIcon className="h-3.5 w-3.5" /></Btn>
      <Btn onClick={addTable} title="Table"><TableIcon className="h-3.5 w-3.5" /></Btn>
      <Divider />
      <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 className="h-3.5 w-3.5" /></Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 className="h-3.5 w-3.5" /></Btn>
    </div>
  )
}

function Btn({ children, onClick, active, title }: { children: React.ReactNode; onClick: () => void; active?: boolean; title: string }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        "grid h-7 w-7 place-items-center rounded transition-colors hover:bg-accent",
        active ? "bg-foreground text-background hover:bg-foreground" : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" />
}
