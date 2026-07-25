"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, Plus, Save, Trash2, Upload, Video, X } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import type { OryCMSReelVideoDTO } from "@/lib/orycms/reel-videos"

type Message = { text: string; type: "error" | "success" }

const MAX_ORYCMS_REELS = 10

const EMPTY = {
  displayOrder: 0,
  status: "published",
  title: "",
}

export function OryCMSReelsAdmin() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<Message | null>(null)
  const [pendingDelete, setPendingDelete] = useState<OryCMSReelVideoDTO | null>(null)
  const [reels, setReels] = useState<OryCMSReelVideoDTO[]>([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const response = await fetch("/api/orycms/reels")
    const json = await response.json() as { data?: OryCMSReelVideoDTO[]; error?: { message?: string }; success?: boolean }
    if (json.success) setReels(json.data ?? [])
    else setMessage({ text: json.error?.message || "Unable to load reels.", type: "error" })
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  function startCreate() {
    if (reels.length >= MAX_ORYCMS_REELS) {
      show(`You can upload up to ${MAX_ORYCMS_REELS} reels. Delete an existing reel before adding a new one.`, "error")
      return
    }
    setFile(null)
    setForm(EMPTY)
    setFormOpen(true)
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (reels.length >= MAX_ORYCMS_REELS) return show(`You can upload up to ${MAX_ORYCMS_REELS} reels. Delete an existing reel before adding a new one.`, "error")
    if (!file) return show("Upload a reel video first.", "error")
    if (!file.type.startsWith("video/")) return show("Upload an MP4, MOV, WebM, or M4V video.", "error")
    if (file.size > 50 * 1024 * 1024) return show("Reel video must be 50 MB or smaller.", "error")

    setSaving(true)
    const body = new FormData()
    body.append("file", file)
    body.append("title", form.title)
    body.append("status", form.status)
    body.append("displayOrder", String(form.displayOrder))

    const response = await fetch("/api/orycms/reels", { body, method: "POST" })
    const json = await response.json() as { error?: { message?: string }; success?: boolean }
    setSaving(false)

    if (!json.success) return show(json.error?.message || "Unable to upload reel.", "error")
    setFormOpen(false)
    show("Reel uploaded.", "success")
    await load()
  }

  async function remove() {
    if (!pendingDelete) return
    const reel = pendingDelete
    const response = await fetch(`/api/orycms/reels/${reel.id}`, { method: "DELETE" })
    const json = await response.json() as { error?: { message?: string }; success?: boolean }
    if (!json.success) return show(json.error?.message || "Unable to delete reel.", "error")
    setReels((current) => current.filter((item) => item.id !== reel.id))
    setPendingDelete(null)
    show("Reel deleted.", "success")
  }

  function show(text: string, type: Message["type"]) {
    setMessage({ text, type })
    window.setTimeout(() => setMessage(null), 3500)
  }

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/collections", label: "Collections" }, { href: "/admin/collections/reels", label: "Reels" }]} />
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Reels videos</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Upload Cloudinary videos for the storefront reels area.</p>
        </div>
        <button type="button" onClick={startCreate} disabled={reels.length >= MAX_ORYCMS_REELS} className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background disabled:cursor-not-allowed disabled:opacity-50">
          <Plus className="h-3.5 w-3.5" /> Upload video
        </button>
      </div>

      {message ? <div className={`rounded-lg border px-4 py-3 text-[13px] ${message.type === "success" ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>{message.text}</div> : null}
      {reels.length >= MAX_ORYCMS_REELS ? (
        <div className="rounded-lg border border-border bg-surface px-4 py-3 text-[13px] text-muted-foreground">
          You have reached the {MAX_ORYCMS_REELS} reel limit. Delete an existing reel to upload a new one.
        </div>
      ) : null}

      {loading ? (
        <div className="grid min-h-64 place-items-center rounded-xl border border-border bg-surface"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : reels.length === 0 ? (
        <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <div><Video className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No reels uploaded yet</p><p className="mt-1 text-xs text-muted-foreground">Upload a published video to show it in the storefront reels area.</p></div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {reels.map((reel) => (
            <article key={reel.id} className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
              <div className="relative aspect-[9/16] bg-surface-muted">
                <video src={reel.videoUrl} poster={reel.posterUrl || undefined} className="h-full w-full object-cover" controls playsInline />
                <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${reel.status === "published" ? "bg-success text-white" : "bg-background text-muted-foreground"}`}>{reel.status}</span>
              </div>
              <div className="p-4">
                <div className="text-sm font-semibold">{reel.title}</div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-muted-foreground">Order {reel.displayOrder}</span>
                  <button type="button" onClick={() => setPendingDelete(reel)} className="grid h-8 w-8 place-items-center rounded-lg border border-destructive/30 text-destructive" aria-label="Delete reel">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {formOpen ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-white p-4">
          <form onSubmit={save} className="mx-auto my-6 w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-base font-semibold">Upload reel video</h2><p className="mt-0.5 text-xs text-muted-foreground">Published videos appear in the storefront reels area.</p></div><button type="button" onClick={() => setFormOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-accent"><X className="h-4 w-4" /></button></div>
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <Field label="Title"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={INPUT} placeholder="Field Story 01" /></Field>
              <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={INPUT}><option value="published">Published</option><option value="draft">Draft</option></select></Field>
              <Field label="Display order"><input type="number" min="0" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} className={INPUT} /></Field>
              <div className="sm:col-span-2"><div className="mb-1.5 text-[12.5px] font-medium">Reel video</div><div className="flex flex-col gap-3 rounded-xl border border-dashed border-border bg-surface-muted p-4 sm:flex-row sm:items-center"><div className="grid h-28 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface"><Video className="h-7 w-7 text-muted-foreground" /></div><div><input ref={fileRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /><button type="button" disabled={saving} onClick={() => fileRef.current?.click()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium disabled:opacity-60">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}{file ? "Change video" : "Select video"}</button><p className="mt-2 text-[11px] text-muted-foreground">MP4, MOV, WebM, or M4V. Maximum 50 MB.</p>{file ? <p className="mt-1 text-[11px] text-muted-foreground">{file.name}</p> : null}</div></div></div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border bg-white px-5 py-4"><button type="button" onClick={() => setFormOpen(false)} className="h-9 rounded-lg border border-border bg-white px-4 text-[12.5px]">Cancel</button><button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-[12.5px] font-medium text-background disabled:opacity-60">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Upload video</button></div>
          </form>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-white p-5 shadow-pop">
            <h2 className="text-base font-semibold">Delete reel?</h2>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
              Are you sure you want to delete <span className="font-medium text-foreground">{pendingDelete.title}</span>? This reel will be removed from the storefront reels area.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className="h-9 rounded-lg border border-border bg-white px-4 text-[12.5px]">
                Cancel
              </button>
              <button type="button" onClick={() => void remove()} className="h-9 rounded-lg bg-destructive px-4 text-[12.5px] font-medium text-white">
                Delete reel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

const INPUT = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-border-strong"
function Field({ children, className = "", label }: { children: React.ReactNode; className?: string; label: string }) { return <label className={className}><span className="mb-1.5 block text-[12.5px] font-medium">{label}</span>{children}</label> }
