"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, ChevronLeft, ChevronRight, ImageIcon, Loader2, Plus, Save, Search, Trash2, Upload, X } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { OryCMSSelect } from "@/components/orycms/custom-select"
import { TableSkeleton } from "../../../orycms/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { playOryCMSToastSound } from "@/lib/orycms/toast-sound"

const PAGE_SIZE = 10
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "svg", "gif"]
const ALLOWED_TYPES = new Set(["image/gif", "image/jpeg", "image/jpg", "image/png", "image/svg+xml", "image/webp"])

type CategoryStatus = "active" | "inactive"
type CategoryImage = { id?: string; name?: string; url: string }
type Category = {
  createdAt: string
  displayOrder: number
  id: string
  image: CategoryImage | null
  metaDescription: string
  metaTitle: string
  name: string
  parentId: string | null
  parentName: string
  productCount: number
  slug: string
  status: CategoryStatus
  updatedAt: string
}
type Toast = { id: string; message: string; type: "success" | "error" }

const emptyCategory: Category = {
  createdAt: "",
  displayOrder: 0,
  id: "",
  image: null,
  metaDescription: "",
  metaTitle: "",
  name: "",
  parentId: null,
  parentName: "",
  productCount: 0,
  slug: "",
  status: "active",
  updatedAt: "",
}

export function OryCMSCategoriesList() {
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [deleteCandidate, setDeleteCandidate] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<"all" | CategoryStatus>("all")
  const [toast, setToast] = useState<Toast | null>(null)

  async function loadCategories() {
    setLoading(true)
    const json = await fetch("/api/orycms/categories").then((response) => response.json())

    setCategories(json.success ? json.data : [])
    setLoading(false)
  }

  useEffect(() => {
    void loadCategories()
  }, [])

  async function deleteCategory(category: Category) {
    const json = await fetch(`/api/orycms/categories/${category.id}`, { method: "DELETE" }).then((r) => r.json())

    if (json.success) {
      setCategories((current) => current.filter((item) => item.id !== category.id))
      setSelected((current) => current.filter((id) => id !== category.id))
      setDeleteCandidate(null)
      showToast("Category deleted.", "success")
    } else {
      showToast(json.error?.message ?? "Delete failed.", "error")
    }
  }

  async function bulkDelete() {
    const json = await fetch("/api/orycms/categories", {
      body: JSON.stringify({ ids: selected }),
      headers: { "content-type": "application/json" },
      method: "DELETE",
    }).then((r) => r.json())

    if (json.success) {
      setCategories((current) => current.filter((item) => !selected.includes(item.id)))
      setSelected([])
      setBulkConfirmOpen(false)
      showToast("Selected categories deleted.", "success")
    } else {
      showToast(json.error?.message ?? "Bulk delete failed.", "error")
    }
  }

  function showToast(message: string, type: Toast["type"]) {
    const item = { id: crypto.randomUUID(), message, type }
    playOryCMSToastSound()
    setToast(item)
    window.setTimeout(() => setToast((current) => (current?.id === item.id ? null : current)), 3000)
  }

  const filtered = useMemo(() => {
    return categories.filter((category) => {
      const matchesQuery = [category.name, category.slug, category.parentName, category.status]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
      const matchesStatus = statusFilter === "all" || category.status === statusFilter

      return matchesQuery && matchesStatus
    })
  }, [categories, query, statusFilter])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const allVisibleSelected = paged.length > 0 && paged.every((category) => selected.includes(category.id))

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter])

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/categories", label: "Categories" }]} />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">Categories</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
            Organize storefront products with parent/child categories, media, SEO, and display order.
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Category
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-muted px-4 py-3">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search categories…"
              className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[13px] outline-none focus:border-border-strong"
            />
          </div>
          <OryCMSSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as typeof statusFilter)}
            options={[
              { label: "All status", value: "all" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
            className="w-full sm:w-36"
          />
          {selected.length > 0 ? (
            <button
              type="button"
              onClick={() => setBulkConfirmOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-[12.5px] font-medium text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete {selected.length}
            </button>
          ) : null}
          <div className="rounded-full border border-border bg-surface px-3 py-1 text-[12px] text-muted-foreground">
            {filtered.length} categories
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filtered.length === 0 ? (
          <div className="grid min-h-64 place-items-center text-center text-[13px] text-muted-foreground">
            No categories found. Add your first category.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-[12.5px]">
                <thead className="border-b border-border bg-surface-muted text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={(event) => {
                          const visibleIds = paged.map((category) => category.id)
                          setSelected((current) =>
                            event.target.checked
                              ? Array.from(new Set([...current, ...visibleIds]))
                              : current.filter((id) => !visibleIds.includes(id)),
                          )
                        }}
                      />
                    </th>
                    <th className="px-4 py-3">Image</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Parent</th>
                    <th className="px-4 py-3 text-center">Products</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map((category) => (
                    <tr key={category.id} className="transition-colors hover:bg-accent/20">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(category.id)}
                          onChange={(event) =>
                            setSelected((current) =>
                              event.target.checked
                                ? [...current, category.id]
                                : current.filter((id) => id !== category.id),
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <CategoryThumb category={category} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{category.name}</div>
                        <div className="mt-1 text-[11px] text-muted-foreground">Order {category.displayOrder}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11.5px] text-muted-foreground">{category.slug}</td>
                      <td className="px-4 py-3">{category.parentName || "—"}</td>
                      <td className="px-4 py-3 text-center font-semibold">{category.productCount}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-medium capitalize",
                            category.status === "active"
                              ? "bg-chart-3/15 text-chart-3"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {category.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(category.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/categories/${category.id}`}
                            className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-[12px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(category)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-destructive transition-colors hover:border-destructive/30 hover:bg-destructive/10"
                            aria-label={`Delete ${category.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-muted px-4 py-3">
              <div className="text-[12px] text-muted-foreground">
                Page {page} of {pageCount}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2 text-[12px] disabled:opacity-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  disabled={page === pageCount}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2 text-[12px] disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        count={selected.length}
        name={deleteCandidate?.name}
        onCancel={() => {
          setDeleteCandidate(null)
          setBulkConfirmOpen(false)
        }}
        onConfirm={() => (deleteCandidate ? void deleteCategory(deleteCandidate) : void bulkDelete())}
        open={Boolean(deleteCandidate) || bulkConfirmOpen}
      />
      <OryToast toast={toast} />
    </section>
  )
}

export function OryCMSCategoryForm({ id }: { id?: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState<Category>(emptyCategory)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(Boolean(id))
  const [media, setMedia] = useState<CategoryImage[]>([])
  const [mediaOpen, setMediaOpen] = useState(false)
  const [savedId, setSavedId] = useState(id ?? "")
  const [saving, setSaving] = useState(false)
  const [slugTouched, setSlugTouched] = useState(Boolean(id))
  const [toast, setToast] = useState<Toast | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const effectiveId = id ?? savedId
  const editing = Boolean(effectiveId)

  useEffect(() => {
    setSavedId(id ?? "")
    void loadMeta()

    if (id) {
      setLoading(true)
      fetch(`/api/orycms/categories/${id}`)
        .then((response) => response.json())
        .then((json) => {
          if (json.success) setCategory(json.data)
          else showToast(json.error?.message ?? "Category not found.", "error")
        })
        .catch(() => showToast("Category not found.", "error"))
        .finally(() => setLoading(false))
    } else {
      setCategory(emptyCategory)
      setSlugTouched(false)
      setLoading(false)
    }
  }, [id])

  async function loadMeta() {
    const [categoriesJson, mediaJson] = await Promise.all([
      fetch("/api/orycms/categories").then((response) => response.json()),
      fetch("/api/orycms/media").then((response) => response.json()),
    ])

    if (categoriesJson.success) setCategories(categoriesJson.data)
    if (mediaJson.success) {
      setMedia(
        mediaJson.data.map((item: { id: string; original_filename?: string | null; secure_url: string }) => ({
          id: item.id,
          name: item.original_filename ?? "Media image",
          url: item.secure_url,
        })),
      )
    }
  }

  function patch(next: Partial<Category>) {
    setCategory((current) => ({ ...current, ...next }))
  }

  function changeName(name: string) {
    setCategory((current) => ({
      ...current,
      name,
      slug: slugTouched ? current.slug : slugify(name),
    }))
  }

  function changeSlug(slug: string) {
    setSlugTouched(true)
    patch({ slug: slugify(slug) })
  }

  function showToast(message: string, type: Toast["type"]) {
    const item = { id: crypto.randomUUID(), message, type }
    playOryCMSToastSound()
    setToast(item)
    window.setTimeout(() => setToast((current) => (current?.id === item.id ? null : current)), 3000)
  }

  async function saveCategory() {
    setSaving(true)
    const effectiveId = id ?? savedId
    const response = await fetch(effectiveId ? `/api/orycms/categories/${effectiveId}` : "/api/orycms/categories", {
      body: JSON.stringify(category),
      headers: { "content-type": "application/json" },
      method: effectiveId ? "PATCH" : "POST",
    })
    const json = await response.json()
    setSaving(false)

    if (json.success) {
      setCategory(json.data)
      setSavedId(json.data.id)
      setSlugTouched(true)
      showToast("Category saved.", "success")
      router.replace(`/admin/categories/${json.data.id}`)
      router.refresh()
    } else {
      showToast(json.error?.message ?? "Save failed.", "error")
    }
  }

  async function uploadImage(fileList: FileList | File[]) {
    const file = Array.from(fileList)[0]
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      showToast(`${file.name}: ${validationError}`, "error")
      return
    }

    try {
      const asset = await uploadCategoryImage(file, file.name, setUploadProgress)
      const image = { id: asset.id, name: asset.original_filename ?? file.name, url: asset.secure_url }

      patch({ image })
      setMedia((current) => [image, ...current.filter((item) => item.url !== image.url)])
      showToast(`${file.name} uploaded.`, "success")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Upload failed.", "error")
    } finally {
      setUploadProgress(null)
    }
  }

  return (
    <section className="mx-auto max-w-[1200px] space-y-6 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs
            items={[
              { href: "/admin", label: "Overview" },
              { href: "/admin/categories", label: "Categories" },
              {
                href: effectiveId ? `/admin/categories/${effectiveId}` : "/admin/categories/new",
                label: effectiveId ? category.slug || effectiveId : "New",
              },
            ]}
          />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">
            {editing ? "Edit Category" : "Add Category"}
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
            Slug follows the name until you edit it manually. Parent categories create nested storefront filters.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <Link
              href="/admin/categories/new"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Category
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => void saveCategory()}
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Category
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid min-h-64 place-items-center rounded-xl border border-border bg-surface text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <Card title="Category details">
              <Field label="Category Name*" value={category.name} onChange={changeName} />
              <Field label="Slug*" value={category.slug} onChange={changeSlug} />
              <div className="grid gap-3 md:grid-cols-2">
                <OryCMSSelect
                  label="Parent"
                  value={category.parentId ?? ""}
                  onChange={(val) => patch({ parentId: val || null })}
                  options={[
                    { label: "No parent", value: "" },
                    ...categories
                      .filter((item) => item.id !== category.id)
                      .map((item) => ({
                        label: item.parentName ? `${item.parentName} / ${item.name}` : item.name,
                        value: item.id,
                      })),
                  ]}
                  searchable
                  className="w-full"
                />
                <NumberField label="Display Order" value={category.displayOrder} onChange={(displayOrder) => patch({ displayOrder })} />
              </div>
              <OryCMSSelect
                label="Status"
                value={category.status}
                onChange={(val) => patch({ status: val as CategoryStatus })}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ]}
                className="w-full"
              />
            </Card>

            <Card title="SEO">
              <Field label="SEO Meta Title" value={category.metaTitle} onChange={(metaTitle) => patch({ metaTitle })} />
              <label className="block space-y-1.5">
                <span className="text-[12px] font-medium">SEO Meta Description</span>
                <textarea
                  value={category.metaDescription}
                  onChange={(event) => patch({ metaDescription: event.target.value })}
                  rows={5}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-border-strong"
                />
              </label>
            </Card>
          </div>

          <Card title="Category Image">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.svg,.gif,image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
              className="hidden"
              onChange={(event) => {
                void uploadImage(event.target.files ?? [])
                event.target.value = ""
              }}
            />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProgress !== null}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {uploadProgress !== null ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploadProgress !== null ? `Uploading ${uploadProgress}%` : "Upload Image"}
              </button>
              <button
                type="button"
                onClick={() => {
                  void loadMeta()
                  setMediaOpen(true)
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Select from Media
              </button>
            </div>

            {category.image?.url ? (
              <div className="relative overflow-hidden rounded-xl border border-border bg-surface-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={category.image.url} alt={category.image.name ?? category.name} className="aspect-[4/3] w-full object-cover" />
                <button
                  type="button"
                  onClick={() => patch({ image: null })}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-destructive shadow-xs"
                  aria-label="Remove category image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-[12px] text-muted-foreground">
                <ImageIcon className="mx-auto mb-2 h-6 w-6" />
                Upload or select a category image.
              </div>
            )}
          </Card>
        </div>
      )}

      <MediaDialog
        images={media}
        onClose={() => setMediaOpen(false)}
        onSelect={(image) => {
          patch({ image })
          setMediaOpen(false)
        }}
        open={mediaOpen}
      />
      <OryToast toast={toast} />
    </section>
  )
}

function Card({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-xs">
      <div className="text-[13.5px] font-semibold">{title}</div>
      {children}
    </div>
  )
}

function CategoryThumb({ category }: { category: Category }) {
  return (
    <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border bg-surface-muted">
      <div className="absolute inset-0 grid place-items-center text-muted-foreground">
        <ImageIcon className="h-4 w-4" />
      </div>
      {category.image?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={category.image.url} alt={category.image.name ?? category.name} className="relative h-full w-full object-cover" />
      ) : null}
    </div>
  )
}

function ConfirmDialog({
  count,
  name,
  onCancel,
  onConfirm,
  open,
}: {
  count: number
  name?: string
  onCancel: () => void
  onConfirm: () => void
  open: boolean
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[55] grid place-items-center bg-background/85 p-4 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-pop sm:mx-auto">
        <div className="flex gap-3 border-b border-border bg-surface-muted p-5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[14px] font-semibold">Delete categor{name ? "y" : "ies"}?</div>
            <p className="mt-1 text-[12.5px] leading-5 text-muted-foreground">
              This will soft delete {name ? <span className="font-medium text-foreground">{name}</span> : `${count} selected categories`} from OryCMS.
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
            onClick={onConfirm}
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

function Field({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-medium">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-border-strong"
      />
    </label>
  )
}

function NumberField({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: number) => void
  value: number
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-medium">{label}</span>
      <input
        type="number"
        value={value || ""}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-border-strong"
      />
    </label>
  )
}

function MediaDialog({
  images,
  onClose,
  onSelect,
  open,
}: {
  images: CategoryImage[]
  onClose: () => void
  onSelect: (image: CategoryImage) => void
  open: boolean
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/85 p-4 backdrop-blur-sm">
      <div className="mx-2 flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-pop sm:mx-auto">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-muted px-5 py-4">
          <div>
            <div className="text-[13.5px] font-semibold">Select from Media</div>
            <p className="mt-1 text-[12px] text-muted-foreground">Use an existing Media Manager image for this category.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Close media picker"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {images.length === 0 ? (
          <div className="grid flex-1 place-items-center p-8 text-center text-[13px] text-muted-foreground">
            <div>
              <ImageIcon className="mx-auto mb-2 h-7 w-7" />
              No media images found. Upload one here or from Media Manager.
            </div>
          </div>
        ) : (
          <div className="grid flex-1 auto-rows-max grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 lg:grid-cols-5">
            {images.map((image) => (
              <button
                key={image.id ?? image.url}
                type="button"
                onClick={() => onSelect(image)}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-muted text-left transition-colors hover:border-chart-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.name ?? "Media"} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <div className="truncate text-[11px] font-medium text-white">{image.name ?? "Media image"}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OryToast({ toast }: { toast: Toast | null }) {
  if (!toast) return null

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[min(360px,calc(100vw-2rem))] rounded-xl border border-border bg-white p-3 text-[12.5px] shadow-pop">
      <div className="flex items-start gap-3">
        {toast.type === "success" ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-chart-3" />
        ) : (
          <X className="mt-0.5 h-4 w-4 text-destructive" />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  )
}

function validateImageFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""

  if (!ALLOWED_EXTENSIONS.includes(extension)) return `Only ${ALLOWED_EXTENSIONS.join(", ")} files are allowed.`
  if (!ALLOWED_TYPES.has(file.type) && extension !== "svg") return "Unsupported image type."
  if (file.size > MAX_FILE_SIZE) return "Maximum size is 10 MB."

  return null
}

function uploadCategoryImage(
  file: File,
  mediaName: string,
  onProgress: (progress: number) => void,
) {
  return new Promise<{ id: string; original_filename: string | null; secure_url: string }>((resolve, reject) => {
    const request = new XMLHttpRequest()
    const form = new FormData()

    form.append("file", file)
    form.append("mediaName", mediaName.trim() || file.name)
    form.append("purpose", "category")
    onProgress(1)
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.max(1, Math.min(95, Math.round((event.loaded / event.total) * 95))))
    }
    request.onerror = () => reject(new Error("Upload failed."))
    request.onload = () => {
      try {
        const json = JSON.parse(request.responseText) as {
          success: boolean
          data?: { id: string; original_filename: string | null; secure_url: string }
          error?: { message: string }
        }

        if (request.status >= 200 && request.status < 300 && json.success && json.data) {
          onProgress(100)
          resolve(json.data)
        } else {
          reject(new Error(json.error?.message ?? "Upload failed."))
        }
      } catch {
        reject(new Error("Upload failed."))
      }
    }

    request.open("POST", "/api/orycms/media")
    request.send(form)
  })
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function formatDateTime(value?: string) {
  if (!value) return "—"

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
