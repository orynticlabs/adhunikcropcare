"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Award, Eye, ImagePlus, Loader2, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import type { OryCMSCertificateDTO, OryCMSCertificateInput } from "@/lib/orycms/certificates"

const EMPTY: OryCMSCertificateInput = {
  certificateNumber: "",
  description: "",
  displayOrder: 0,
  documentUrl: "",
  expiresOn: "",
  image: null,
  issuedOn: "",
  issuingAuthority: "",
  status: "draft",
  title: "",
}

export function OryCMSCertificatesAdmin() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [certificates, setCertificates] = useState<OryCMSCertificateDTO[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<OryCMSCertificateInput>(EMPTY)
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null)

  useEffect(() => {
    let active = true
    void fetch("/api/orycms/certificates")
      .then((response) => response.json())
      .then((json: { data?: OryCMSCertificateDTO[]; error?: { message?: string }; success?: boolean }) => {
        if (!active) return
        if (json.success) setCertificates(json.data ?? [])
        else setMessage({ text: json.error?.message || "Unable to load certificates.", type: "error" })
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setMessage({ text: "Unable to load certificates.", type: "error" })
        setLoading(false)
      })
    return () => { active = false }
  }, [])

  async function load() {
    setLoading(true)
    const response = await fetch("/api/orycms/certificates")
    const json = await response.json() as { data?: OryCMSCertificateDTO[]; error?: { message?: string }; success?: boolean }
    if (json.success) setCertificates(json.data ?? [])
    else show(json.error?.message || "Unable to load certificates.", "error")
    setLoading(false)
  }

  function startCreate() {
    setEditingId(null)
    setForm(EMPTY)
    setFormOpen(true)
  }

  function startEdit(certificate: OryCMSCertificateDTO) {
    setEditingId(certificate.id)
    setForm({
      certificateNumber: certificate.certificateNumber,
      description: certificate.description,
      displayOrder: certificate.displayOrder,
      documentUrl: certificate.documentUrl,
      expiresOn: certificate.expiresOn,
      image: certificate.image,
      issuedOn: certificate.issuedOn,
      issuingAuthority: certificate.issuingAuthority,
      status: certificate.status,
      title: certificate.title,
    })
    setFormOpen(true)
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    const response = await fetch(editingId ? `/api/orycms/certificates/${editingId}` : "/api/orycms/certificates", {
      body: JSON.stringify(form),
      headers: { "content-type": "application/json" },
      method: editingId ? "PATCH" : "POST",
    })
    const json = await response.json() as { error?: { message?: string }; success?: boolean }
    setSaving(false)
    if (!json.success) return show(json.error?.message || "Unable to save certificate.", "error")
    setFormOpen(false)
    show(editingId ? "Certificate updated." : "Certificate added.", "success")
    await load()
  }

  async function remove(certificate: OryCMSCertificateDTO) {
    if (!window.confirm(`Delete ${certificate.title}?`)) return
    const response = await fetch(`/api/orycms/certificates/${certificate.id}`, { method: "DELETE" })
    const json = await response.json() as { error?: { message?: string }; success?: boolean }
    if (!json.success) return show(json.error?.message || "Unable to delete certificate.", "error")
    setCertificates((current) => current.filter((item) => item.id !== certificate.id))
    show("Certificate deleted.", "success")
  }

  async function upload(file?: File) {
    if (!file) return
    if (!file.type.startsWith("image/")) return show("Upload a JPG, PNG, WebP, GIF, or SVG image.", "error")
    if (file.size > 10 * 1024 * 1024) return show("Certificate image must be 10 MB or smaller.", "error")
    setUploading(true)
    const body = new FormData()
    body.append("file", file)
    body.append("mediaName", form.title.trim() || file.name)
    body.append("purpose", "certificate")
    const response = await fetch("/api/orycms/media", { body, method: "POST" })
    const json = await response.json() as { data?: { asset_id?: string; original_filename?: string; secure_url?: string }; error?: { message?: string }; success?: boolean }
    setUploading(false)
    if (!json.success || !json.data?.secure_url) return show(json.error?.message || "Upload failed.", "error")
    setForm((current) => ({ ...current, image: { id: json.data?.asset_id, name: json.data?.original_filename, url: json.data?.secure_url ?? "" } }))
    show("Certificate image uploaded.", "success")
  }

  function show(text: string, type: "error" | "success") {
    setMessage({ text, type })
    window.setTimeout(() => setMessage(null), 3500)
  }

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/collections", label: "Collections" }, { href: "/admin/collections/certificates", label: "Certificates" }]} />
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Company certificates</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Upload, order, and publish verified certificates on the storefront.</p>
        </div>
        <button type="button" onClick={startCreate} className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background">
          <Plus className="h-3.5 w-3.5" /> Add certificate
        </button>
      </div>

      {message ? <div className={`rounded-lg border px-4 py-3 text-[13px] ${message.type === "success" ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>{message.text}</div> : null}

      {loading ? (
        <div className="grid min-h-64 place-items-center rounded-xl border border-border bg-surface"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : certificates.length === 0 ? (
        <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <div><Award className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No company certificates yet</p><p className="mt-1 text-xs text-muted-foreground">Add the first certificate and publish it when ready.</p></div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {certificates.map((certificate) => (
            <article key={certificate.id} className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
              <div className="relative aspect-[4/3] bg-surface-muted">
                {certificate.image?.url ? <Image src={certificate.image.url} alt={certificate.title} fill sizes="(max-width: 1280px) 50vw, 33vw" className="object-contain p-3" /> : <ImagePlus className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />}
                <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${certificate.status === "published" ? "bg-success text-white" : "bg-background text-muted-foreground"}`}>{certificate.status}</span>
              </div>
              <div className="p-4">
                <div className="text-sm font-semibold">{certificate.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{certificate.issuingAuthority}</div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-muted-foreground">Order {certificate.displayOrder}</span>
                  <div className="flex gap-2">
                    {certificate.documentUrl ? <a href={certificate.documentUrl} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg border border-border" aria-label="View document"><Eye className="h-3.5 w-3.5" /></a> : null}
                    <button type="button" onClick={() => startEdit(certificate)} className="grid h-8 w-8 place-items-center rounded-lg border border-border" aria-label="Edit certificate"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => void remove(certificate)} className="grid h-8 w-8 place-items-center rounded-lg border border-destructive/30 text-destructive" aria-label="Delete certificate"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {formOpen ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-background/85 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="mx-auto my-6 w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-surface shadow-pop">
            <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-base font-semibold">{editingId ? "Edit certificate" : "Add certificate"}</h2><p className="mt-0.5 text-xs text-muted-foreground">Published entries appear on the storefront Certifications page.</p></div><button type="button" onClick={() => setFormOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-accent"><X className="h-4 w-4" /></button></div>
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <Field label="Certificate title"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={INPUT} placeholder="ISO 9001:2015" /></Field>
              <Field label="Issuing authority"><input required value={form.issuingAuthority} onChange={(e) => setForm({ ...form, issuingAuthority: e.target.value })} className={INPUT} placeholder="Certification body" /></Field>
              <Field label="Certificate number"><input value={form.certificateNumber} onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })} className={INPUT} /></Field>
              <Field label="Document URL"><input type="url" value={form.documentUrl} onChange={(e) => setForm({ ...form, documentUrl: e.target.value })} className={INPUT} placeholder="https://...pdf" /></Field>
              <Field label="Issue date"><input type="date" value={form.issuedOn} onChange={(e) => setForm({ ...form, issuedOn: e.target.value })} className={INPUT} /></Field>
              <Field label="Expiry date"><input type="date" value={form.expiresOn} onChange={(e) => setForm({ ...form, expiresOn: e.target.value })} className={INPUT} /></Field>
              <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })} className={INPUT}><option value="draft">Draft</option><option value="published">Published</option></select></Field>
              <Field label="Display order"><input type="number" min="0" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} className={INPUT} /></Field>
              <Field label="Description" className="sm:col-span-2"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${INPUT} min-h-24 py-2`} /></Field>
              <div className="sm:col-span-2"><div className="mb-1.5 text-[12.5px] font-medium">Certificate image</div><div className="flex flex-col gap-3 rounded-xl border border-dashed border-border bg-surface-muted p-4 sm:flex-row sm:items-center">{form.image?.url ? <Image src={form.image.url} alt="Certificate preview" width={144} height={112} className="h-28 w-36 rounded-lg bg-white object-contain p-2" /> : <div className="grid h-28 w-36 place-items-center rounded-lg bg-surface"><ImagePlus className="h-7 w-7 text-muted-foreground" /></div>}<div><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} /><button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium disabled:opacity-60">{uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}{uploading ? "Uploading..." : "Upload image"}</button><p className="mt-2 text-[11px] text-muted-foreground">JPG, PNG, WebP, GIF, or SVG. Maximum 10 MB.</p></div></div></div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border bg-surface-muted px-5 py-4"><button type="button" onClick={() => setFormOpen(false)} className="h-9 rounded-lg border border-border bg-surface px-4 text-[12.5px]">Cancel</button><button type="submit" disabled={saving || uploading} className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-[12.5px] font-medium text-background disabled:opacity-60">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Save certificate</button></div>
          </form>
        </div>
      ) : null}
    </section>
  )
}

const INPUT = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-border-strong"
function Field({ children, className = "", label }: { children: React.ReactNode; className?: string; label: string }) { return <label className={className}><span className="mb-1.5 block text-[12.5px] font-medium">{label}</span>{children}</label> }
