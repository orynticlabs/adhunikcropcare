"use client"

import { useEffect, useRef, useState } from "react"
import type React from "react"
import { CheckCircle2, ImageIcon, KeyRound, Loader2, Save, Search, Upload, X } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { cn } from "@/lib/utils"
import { playOryCMSToastSound } from "@/lib/orycms/toast-sound"

type AdminProfile = {
  createdAt: string
  email: string
  fullName: string
  lastLoginAt: string | null
  mobileNumber: string
  profilePhoto: string | null
  role: string
  status: "active" | "inactive"
  username: string
}

type MediaAsset = {
  id: string
  original_filename: string | null
  secure_url: string
}

type Toast = { id: number; message: string; tone: "success" | "error" }

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "svg", "gif"]

export function OryCMSAdminProfilePage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [password, setPassword] = useState({ confirmPassword: "", currentPassword: "", password: "" })
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    void loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    try {
      const profile = await jsonFetch<AdminProfile>("/api/orycms/profile")
      setForm(profile)
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to load profile.", "error")
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    if (!form) return
    setSaving(true)
    try {
      const profile = await jsonFetch<AdminProfile>("/api/orycms/profile", {
        body: JSON.stringify({
          fullName: form.fullName,
          mobileNumber: form.mobileNumber,
          profilePhoto: form.profilePhoto,
          username: form.username,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      setForm(profile)
      window.dispatchEvent(new Event("orycms-profile-updated"))
      toast("Profile saved.", "success")
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save profile.", "error")
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await jsonFetch<null>("/api/orycms/profile/password", {
        body: JSON.stringify(password),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      setPassword({ confirmPassword: "", currentPassword: "", password: "" })
      toast("Password changed.", "success")
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to change password.", "error")
    } finally {
      setSaving(false)
    }
  }

  async function uploadPhoto(file: File | undefined) {
    if (!file || !form) return
    const error = validateFile(file)
    if (error) {
      toast(error, "error")
      return
    }

    setUploading(true)
    try {
      const uploaded = await uploadMedia(file, form.fullName || file.name)
      setForm({ ...form, profilePhoto: uploaded.secure_url })
      toast("Profile photo uploaded. Save profile to keep it.", "success")
    } catch (error) {
      toast(error instanceof Error ? error.message : "Upload failed.", "error")
    } finally {
      setUploading(false)
    }
  }

  function toast(message: string, tone: Toast["tone"]) {
    const id = Date.now()
    playOryCMSToastSound()
    setToasts((items) => [...items, { id, message, tone }])
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3500)
  }

  return (
    <section className="mx-auto max-w-[1200px] space-y-6 px-6 py-6 lg:px-8">
      <div>
        <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/profile", label: "Profile" }]} />
        <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">Profile</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
          Manage your OryCMS account details, avatar, and password.
        </p>
      </div>

      {loading || !form ? (
        <div className="grid min-h-[360px] place-items-center rounded-xl border border-border bg-surface text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Loading profile…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form onSubmit={saveProfile} className="space-y-5 rounded-xl border border-border bg-surface p-5 shadow-xs">
            <div className="flex flex-wrap items-center gap-4 border-b border-border pb-5">
              <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border border-border bg-surface-muted text-[18px] font-semibold">
                {form.profilePhoto ? (
                  <img src={form.profilePhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(form)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold">{form.fullName || form.email}</div>
                <div className="mt-1 text-[12.5px] text-muted-foreground">{form.email}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => inputRef.current?.click()} className="h-9 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90">
                    {uploading ? <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-2 inline h-3.5 w-3.5" />}
                    Upload Photo
                  </button>
                  <button type="button" onClick={() => setMediaOpen(true)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:bg-accent">
                    <ImageIcon className="mr-2 inline h-3.5 w-3.5" />
                    Select from Media
                  </button>
                  <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.svg,.gif,image/*" className="hidden" onChange={(event) => void uploadPhoto(event.target.files?.[0])} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field required label="Full Name" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />
              <Field label="Mobile Number" value={form.mobileNumber} onChange={(value) => setForm({ ...form, mobileNumber: value })} />
              <Field label="Username" value={form.username} onChange={(value) => setForm({ ...form, username: value })} />
              <Field disabled label="Email" value={form.email} onChange={() => undefined} />
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="h-9 rounded-lg bg-foreground px-4 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60">
                {saving ? <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 inline h-3.5 w-3.5" />}
                Save Profile
              </button>
            </div>
          </form>

          <div className="space-y-5">
            <Panel title="Account">
              <Info label="Role" value={form.role} />
              <Info label="Status" value={label(form.status)} />
              <Info label="Last Login" value={form.lastLoginAt ? dateTime(form.lastLoginAt) : "Never"} />
              <Info label="Created" value={dateTime(form.createdAt)} />
            </Panel>

            <form onSubmit={changePassword} className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <h2 className="mb-4 flex items-center gap-2 text-[14px] font-semibold">
                <KeyRound className="h-4 w-4" />
                Change Password
              </h2>
              <div className="space-y-3">
                <Field required label="Current Password" type="password" value={password.currentPassword} onChange={(value) => setPassword({ ...password, currentPassword: value })} />
                <Field required label="New Password" type="password" value={password.password} onChange={(value) => setPassword({ ...password, password: value })} />
                <Field required label="Confirm Password" type="password" value={password.confirmPassword} onChange={(value) => setPassword({ ...password, confirmPassword: value })} />
              </div>
              <button type="submit" disabled={saving} className="mt-4 h-9 w-full rounded-lg bg-foreground px-4 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60">
                Change Password
              </button>
            </form>
          </div>
        </div>
      )}

      {mediaOpen && form ? (
        <MediaPicker
          onClose={() => setMediaOpen(false)}
          onSelect={(url) => {
            setForm({ ...form, profilePhoto: url })
            setMediaOpen(false)
          }}
          toast={toast}
        />
      ) : null}
      <ToastStack toasts={toasts} />
    </section>
  )
}

function MediaPicker({ onClose, onSelect, toast }: { onClose: () => void; onSelect: (url: string) => void; toast: (message: string, tone: Toast["tone"]) => void }) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await jsonFetch<MediaAsset[]>(`/api/orycms/media?search=${encodeURIComponent(query)}`)
        if (!cancelled) setAssets(data)
      } catch (error) {
        toast(error instanceof Error ? error.message : "Failed to load media.", "error")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    const timer = window.setTimeout(load, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, toast])

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-background/85 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-white text-foreground shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between gap-4 border-b border-border bg-white px-5 py-4">
          <h2 className="text-[16px] font-semibold">Select Profile Photo</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-b border-border bg-white p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search media…" className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-[13px] outline-none" />
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto bg-white p-4">
          {loading ? (
            <div className="grid h-48 place-items-center text-sm text-muted-foreground">Loading media…</div>
          ) : assets.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {assets.map((asset) => (
                <button key={asset.id} type="button" onClick={() => onSelect(asset.secure_url)} className="group overflow-hidden rounded-xl border border-border bg-surface text-left transition-colors hover:border-border-strong">
                  <div className="grid aspect-square place-items-center bg-surface-muted">
                    <img src={asset.secure_url} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="truncate px-3 py-2 text-[12px] text-muted-foreground group-hover:text-foreground">{asset.original_filename ?? "Media image"}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid h-48 place-items-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
              No media found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ disabled, label, onChange, required, type = "text", value }: { disabled?: boolean; label: string; onChange: (value: string) => void; required?: boolean; type?: string; value: string }) {
  return (
    <label className="block text-[12.5px] font-medium">
      {label}{required ? " *" : ""}
      <input disabled={disabled} required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none disabled:bg-surface-muted disabled:text-muted-foreground" />
    </label>
  )
}

function Panel({ children, title }: { children: React.ReactNode; title: string }) {
  return <div className="rounded-xl border border-border bg-surface p-5 shadow-xs"><h2 className="mb-4 text-[14px] font-semibold">{title}</h2>{children}</div>
}

function Info({ label: key, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 py-1.5 text-[13px]"><span className="text-muted-foreground">{key}</span><span className="text-right font-medium">{value}</span></div>
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="fixed bottom-4 right-4 z-[100] space-y-2">{toasts.map((toast) => <div key={toast.id} className={cn("flex items-center gap-2 rounded-xl border bg-surface px-4 py-3 text-[13px] shadow-lg", toast.tone === "success" ? "border-success/30 text-success" : "border-destructive/30 text-destructive")}>{toast.tone === "success" ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}{toast.message}</div>)}</div>
}

async function jsonFetch<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...init })
  const json = await response.json() as { success: boolean; data: T; error?: { message: string } }
  if (!response.ok || !json.success) throw new Error(json.error?.message ?? "Request failed.")
  return json.data
}

function uploadMedia(file: File, mediaName: string) {
  return new Promise<{ secure_url: string }>((resolve, reject) => {
    const request = new XMLHttpRequest()
    const form = new FormData()
    form.append("file", file)
    form.append("mediaName", mediaName)
    request.onerror = () => reject(new Error("Upload failed."))
    request.onload = () => {
      const json = JSON.parse(request.responseText || "{}") as { success: boolean; data?: { secure_url: string }; error?: { message: string } }
      if (request.status >= 200 && request.status < 300 && json.success && json.data) resolve(json.data)
      else reject(new Error(json.error?.message ?? "Upload failed."))
    }
    request.open("POST", "/api/orycms/media")
    request.send(form)
  })
}

function validateFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
  if (!ALLOWED_EXTENSIONS.includes(extension)) return `Only ${ALLOWED_EXTENSIONS.join(", ")} files are allowed.`
  if (file.size > MAX_FILE_SIZE) return "Maximum size is 10 MB."
  return null
}

function initials(user: Pick<AdminProfile, "email" | "fullName">) {
  return (user.fullName || user.email).split(/\s|@/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "AD"
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}
