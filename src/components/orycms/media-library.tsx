"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  CloudUpload,
  ImageIcon,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { cn } from "@/lib/utils"
import { playOryCMSToastSound } from "@/lib/orycms/toast-sound"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "svg", "gif"]
const ALLOWED_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/svg+xml",
  "image/webp",
])

type MediaAsset = {
  asset_id: string
  bytes: number
  created_at: string
  format: string
  height: number | null
  id: string
  original_filename: string | null
  public_id: string
  secure_url: string
  width: number | null
}

type PendingUpload = {
  file: File
  id: string
  mediaName: string
}

type UploadItem = {
  id: string
  name: string
  progress: number
  status: "uploading" | "done" | "error"
}

type ToastItem = {
  id: string
  message: string
  type: "success" | "error"
}

export function OryCMSMediaLibrary() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [deleteCandidate, setDeleteCandidate] = useState<MediaAsset | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([])
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<MediaAsset | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [uploads, setUploads] = useState<UploadItem[]>([])

  const pushToast = useCallback((message: string, type: ToastItem["type"]) => {
    const id = crypto.randomUUID()

    playOryCMSToastSound()
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3500)
  }, [])

  const loadMedia = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)

      const response = await fetch(`/api/orycms/media?search=${encodeURIComponent(query.trim())}`, {
        signal,
      })
      const json = (await response.json()) as {
        success: boolean
        data?: MediaAsset[]
        error?: { message: string }
      }

      if (json.success) {
        setAssets(json.data ?? [])
      } else {
        pushToast(json.error?.message ?? "Failed to load media.", "error")
      }

      setLoading(false)
    },
    [pushToast, query],
  )

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      loadMedia(controller.signal).catch((error: unknown) => {
        if ((error as Error).name !== "AbortError") {
          setLoading(false)
          pushToast("Failed to load media.", "error")
        }
      })
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [loadMedia, pushToast])

  const totalBytes = useMemo(
    () => assets.reduce((total, asset) => total + asset.bytes, 0),
    [assets],
  )

  function queueFiles(fileList: FileList | File[]) {
    const validFiles: PendingUpload[] = []

    for (const file of Array.from(fileList)) {
      const validationError = validateFile(file)

      if (validationError) {
        pushToast(`${file.name}: ${validationError}`, "error")
        continue
      }

      validFiles.push({
        file,
        id: crypto.randomUUID(),
        mediaName: file.name,
      })
    }

    if (validFiles.length) setPendingUploads(validFiles)
  }

  async function startPendingUploads() {
    const files = pendingUploads

    setPendingUploads([])

    for (const pending of files) {
      const uploadId = crypto.randomUUID()

      setUploads((current) => [
        ...current,
        { id: uploadId, name: pending.mediaName, progress: 1, status: "uploading" },
      ])

      try {
        const asset = await uploadFile(pending.file, pending.mediaName, (progress) => {
          setUploads((current) =>
            current.map((item) => (item.id === uploadId ? { ...item, progress } : item)),
          )
        })

        setUploads((current) =>
          current.map((item) =>
            item.id === uploadId ? { ...item, progress: 100, status: "done" } : item,
          ),
        )
        await loadMedia()
        setSelected(asset)
        pushToast(`${pending.mediaName} uploaded.`, "success")
      } catch (error) {
        setUploads((current) =>
          current.map((item) => (item.id === uploadId ? { ...item, status: "error" } : item)),
        )
        pushToast(error instanceof Error ? error.message : "Upload failed.", "error")
      }
    }

    window.setTimeout(() => {
      setUploads((current) => current.filter((item) => item.status === "uploading"))
    }, 2000)
  }

  async function copyUrl(asset: MediaAsset) {
    await navigator.clipboard.writeText(asset.secure_url)
    pushToast("Image URL copied.", "success")
  }

  async function deleteAsset(asset: MediaAsset) {
    const response = await fetch(`/api/orycms/media/${asset.id}`, { method: "DELETE" })
    const json = (await response.json()) as { success: boolean; error?: { message: string } }

    if (json.success) {
      setAssets((current) => current.filter((item) => item.id !== asset.id))
      setSelected((current) => (current?.id === asset.id ? null : current))
      setDeleteCandidate(null)
      pushToast("Image deleted.", "success")
    } else {
      pushToast(json.error?.message ?? "Delete failed.", "error")
    }
  }

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/media", label: "Media" }]} />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">Media</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
            Upload Cloudinary images, copy reusable URLs, and manage product/content visuals.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Media
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.svg,.gif,image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
        className="hidden"
        onChange={(event) => {
          queueFiles(event.target.files ?? [])
          event.target.value = ""
        }}
      />

      <div
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          queueFiles(event.dataTransfer.files)
        }}
        className={cn(
          "rounded-xl border border-dashed bg-surface p-6 shadow-xs transition-colors",
          dragging ? "border-chart-3 bg-accent/60" : "border-border",
        )}
      >
        <div className="flex flex-col items-center justify-center rounded-lg bg-surface-muted/60 px-4 py-10 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-surface text-muted-foreground">
            <CloudUpload className="h-5 w-5" />
          </div>
          <div className="mt-4 text-[14px] font-semibold">Drag images here or choose files</div>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Supports JPG, JPEG, PNG, WEBP, SVG, GIF up to {formatBytes(MAX_FILE_SIZE)}.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 h-8 rounded-lg border border-border bg-surface px-3 text-[12px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Select from computer
          </button>
        </div>
      </div>

      {uploads.length > 0 ? (
        <div className="space-y-2 rounded-xl border border-border bg-surface p-3 shadow-xs">
          {uploads.map((upload) => (
            <div key={upload.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-[12.5px]">
                <span className="truncate">{upload.name}</span>
                <span className="num text-muted-foreground">
                  {upload.status === "done"
                    ? "100%"
                    : upload.status === "error"
                      ? "Failed"
                      : `${upload.progress}%`}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    upload.status === "error" ? "bg-destructive" : "bg-chart-3",
                  )}
                  style={{ width: `${upload.status === "error" ? 100 : upload.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-surface shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted px-4 py-3">
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search images, public IDs, formats…"
              className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[13px] outline-none transition-colors placeholder:text-muted-foreground focus:border-border-strong"
            />
          </div>
          <div className="text-[12px] text-muted-foreground">
            {assets.length} image{assets.length === 1 ? "" : "s"} · {formatBytes(totalBytes)}
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-72 place-items-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="mt-3 text-[13.5px] font-medium">No media found</div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Upload your first Cloudinary image to see it here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {assets.map((asset) => (
              <MediaCard
                key={asset.id}
                asset={asset}
                onCopy={() => void copyUrl(asset)}
                onDelete={() => setDeleteCandidate(asset)}
                onPreview={() => setSelected(asset)}
              />
            ))}
          </div>
        )}
      </div>

      <UploadNameDialog
        items={pendingUploads}
        onCancel={() => setPendingUploads([])}
        onChange={(id, mediaName) =>
          setPendingUploads((current) =>
            current.map((item) => (item.id === id ? { ...item, mediaName } : item)),
          )
        }
        onUpload={() => void startPendingUploads()}
      />
      <MediaPreview
        asset={selected}
        onClose={() => setSelected(null)}
        onCopy={(asset) => void copyUrl(asset)}
        onDelete={(asset) => setDeleteCandidate(asset)}
      />
      <DeleteConfirmDialog
        asset={deleteCandidate}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={(asset) => void deleteAsset(asset)}
      />
      <ToastStack
        items={toasts}
        onDismiss={(id) => setToasts((items) => items.filter((item) => item.id !== id))}
      />
    </section>
  )
}

function UploadNameDialog({
  items,
  onCancel,
  onChange,
  onUpload,
}: {
  items: PendingUpload[]
  onCancel: () => void
  onChange: (id: string, mediaName: string) => void
  onUpload: () => void
}) {
  if (!items.length) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-pop">
        <div className="border-b border-border bg-surface-muted px-5 py-4">
          <div className="text-[13.5px] font-semibold">Name media before upload</div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Default names use the filename. Rename them for cleaner OryCMS search and reuse.
          </p>
        </div>
        <div className="max-h-[50vh] space-y-3 overflow-y-auto p-5">
          {items.map((item) => (
            <label key={item.id} className="block space-y-1.5">
              <span className="text-[11.5px] text-muted-foreground">{item.file.name}</span>
              <input
                value={item.mediaName}
                onChange={(event) => onChange(item.id, event.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none transition-colors focus:border-border-strong"
                placeholder="Media name"
              />
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-surface-muted px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onUpload}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90"
          >
            <Upload className="h-3.5 w-3.5" />
            Start upload
          </button>
        </div>
      </div>
    </div>
  )
}

function MediaCard({
  asset,
  onCopy,
  onDelete,
  onPreview,
}: {
  asset: MediaAsset
  onCopy: () => void
  onDelete: () => void
  onPreview: () => void
}) {
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-border-strong hover:bg-accent/30">
      <button type="button" onClick={onPreview} className="block w-full text-left">
        <div className="aspect-square overflow-hidden bg-surface-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.secure_url}
            alt={asset.original_filename ?? asset.public_id}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </button>
      <div className="space-y-2 p-3">
        <div>
          <div className="truncate text-[12.5px] font-medium">
            {asset.original_filename ?? asset.public_id}
          </div>
          <div className="mt-0.5 text-[11px] uppercase text-muted-foreground">
            {asset.format} · {formatBytes(asset.bytes)}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {asset.width && asset.height ? `${asset.width} × ${asset.height}` : "Dimensions —"} ·{" "}
            {new Date(asset.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCopy}
            className="grid h-7 flex-1 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Copy media URL"
          >
            <Clipboard className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="grid h-7 flex-1 place-items-center rounded-md border border-border text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete media"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  )
}

function MediaPreview({
  asset,
  onClose,
  onCopy,
  onDelete,
}: {
  asset: MediaAsset | null
  onClose: () => void
  onCopy: (asset: MediaAsset) => void
  onDelete: (asset: MediaAsset) => void
}) {
  if (!asset) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/85 p-4 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-pop">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-muted px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold">
              {asset.original_filename ?? asset.public_id}
            </div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
              {asset.public_id}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid min-h-0 place-items-center bg-surface-muted/60 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.secure_url}
              alt={asset.original_filename ?? asset.public_id}
              className="max-h-full max-w-full rounded-lg object-contain shadow-card"
            />
          </div>
          <aside className="space-y-4 border-t border-border bg-surface p-4 lg:border-l lg:border-t-0">
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <Detail label="Format" value={asset.format.toUpperCase()} />
              <Detail label="Size" value={formatBytes(asset.bytes)} />
              <Detail label="Width" value={asset.width ? `${asset.width}px` : "—"} />
              <Detail label="Height" value={asset.height ? `${asset.height}px` : "—"} />
              <Detail label="Created" value={new Date(asset.created_at).toLocaleDateString()} />
              <Detail label="Asset ID" value={asset.asset_id.slice(0, 10)} />
            </div>
            <div>
              <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Secure URL
              </div>
              <div className="break-all rounded-lg border border-border bg-surface-muted p-3 font-mono text-[11px] text-muted-foreground">
                {asset.secure_url}
              </div>
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => onCopy(asset)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-surface text-[12.5px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Clipboard className="h-3.5 w-3.5" />
                Copy URL
              </button>
              <button
                type="button"
                onClick={() => onDelete(asset)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 text-[12.5px] font-medium text-destructive transition-colors hover:bg-destructive/15"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete image
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmDialog({
  asset,
  onCancel,
  onConfirm,
}: {
  asset: MediaAsset | null
  onCancel: () => void
  onConfirm: (asset: MediaAsset) => void
}) {
  if (!asset) return null

  return (
    <div className="fixed inset-0 z-[55] grid place-items-center bg-background/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-pop">
        <div className="flex gap-3 border-b border-border bg-surface-muted p-5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[14px] font-semibold">Delete media?</div>
            <p className="mt-1 text-[12.5px] leading-5 text-muted-foreground">
              This removes{" "}
              <span className="font-medium text-foreground">
                {asset.original_filename ?? asset.public_id}
              </span>{" "}
              from OryCMS and Cloudinary.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 bg-surface p-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(asset)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-destructive px-3 text-[12.5px] font-medium text-destructive-foreground transition-opacity hover:opacity-90"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted p-3">
      <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-medium">{value}</div>
    </div>
  )
}

function ToastStack({
  items,
  onDismiss,
}: {
  items: ToastItem[]
  onDismiss: (id: string) => void
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[min(360px,calc(100vw-2rem))] space-y-2">
      {items.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border bg-surface p-3 text-[12.5px] shadow-pop",
            toast.type === "success" ? "border-chart-3/40" : "border-destructive/30",
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-chart-3" />
          ) : (
            <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          )}
          <div className="min-w-0 flex-1 leading-relaxed">{toast.message}</div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

function validateFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return `Only ${ALLOWED_EXTENSIONS.join(", ")} files are allowed.`
  }

  if (!ALLOWED_TYPES.has(file.type) && extension !== "svg") {
    return "Unsupported image type."
  }

  if (file.size > MAX_FILE_SIZE) {
    return `Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`
  }

  return null
}

function uploadFile(file: File, mediaName: string, onProgress: (progress: number) => void) {
  return new Promise<MediaAsset>((resolve, reject) => {
    const request = new XMLHttpRequest()
    const form = new FormData()

    form.append("file", file)
    form.append("mediaName", mediaName.trim() || file.name)
    onProgress(1)

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.max(1, Math.min(95, Math.round((event.loaded / event.total) * 95))))
      }
    }
    request.onerror = () => reject(new Error("Upload failed."))
    request.onload = () => {
      let json: { success: boolean; data?: MediaAsset; error?: { message: string } }

      try {
        json = JSON.parse(request.responseText) as typeof json
      } catch {
        reject(new Error("Upload failed."))
        return
      }

      if (request.status >= 200 && request.status < 300 && json.success && json.data) {
        onProgress(100)
        resolve(json.data)
      } else {
        reject(new Error(json.error?.message ?? "Upload failed."))
      }
    }

    request.open("POST", "/api/orycms/media")
    request.send(form)
  })
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
