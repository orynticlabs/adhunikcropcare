"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Eye, GripVertical, ImageIcon, Loader2, Plus, RefreshCw, RotateCcw, Save, Search, Star, Trash2, Upload, X } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { OryCMSMultiSelect, OryCMSSelect } from "@/components/orycms/custom-select"
import { OryCMSDatePicker } from "@/components/orycms/custom-datepicker"
import { RichTextEditor } from "@/components/orycms/rich-text-editor"
import { TableSkeleton } from "../../../orycms/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { playOryCMSToastSound } from "@/lib/orycms/toast-sound"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const PRODUCT_PAGE_SIZE = 10
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"]
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])

type ProductImage = { id?: string; name?: string; url: string; packSizes?: string[] }
type PackSize = {
  price: number
  mrp: number
  salePrice: number
  sku?: string
  batchNumber?: string
  stockQuantity: number
  isDefault?: boolean
  verifySlug?: string
  size: string
  imageId?: string
  imageUrl?: string
  imageIds?: string[]
  imageUrls?: string[]
}
type ProductStatus = "draft" | "published"

type Product = {
  brand: string
  category: string
  createdAt: string
  deletedAt?: string | null
  featured: boolean
  fullDescription: string
  howToUse: string
  id: string
  images: ProductImage[]
  metaDescription: string
  metaTitle: string
  name: string
  packSizes: PackSize[]
  packSizeImagesEnabled?: boolean
  price: number
  salePrice: number | null
  shippingReturns: string
  shortDescription: string
  sku: string
  slug: string
  specifications: string
  status: ProductStatus
  stockQuantity: number
  tags: string[]
  unit: string
  updatedAt: string

  // Verification fields
  verifyDescription?: string
  verifyImage?: ProductImage | null
  mfgDate?: string
  expiryDate?: string
  packTiming?: string
  packDate?: string
  supervisorName?: string
  contractorName?: string
  literature?: string
  msds?: string
  license?: string
  cir?: string
  eprNumber?: string
  plasticCategory?: string
  leafletInfo?: string
  uin?: string
}

type Meta = {
  categories: string[]
  media: ProductImage[]
}

type Toast = {
  id: string
  message: string
  type: "success" | "error"
}

const DEFAULT_UNITS = [
  "KG",
  "L",
  "ML",
  "G",
  "BOTTLE",
  "BOX",
];

function getPackSizeUnitOptions(productUnit: string): string[] {
  const norm = (productUnit || "").trim().toLowerCase()
  if (norm === "kg") {
    return ["KG"]
  }
  if (norm === "g" || norm === "gram" || norm === "gm" || norm === "grams") {
    return ["G", "KG"]
  }
  if (norm === "ml") {
    return ["ML", "L"]
  }
  if (norm === "l" || norm === "litre" || norm === "liter" || norm === "litres") {
    return ["L"]
  }
  if (norm === "box" || norm === "boxes") {
    return ["BOX"]
  }
  if (norm === "bottle" || norm === "bottles") {
    return ["BOTTLE"]
  }
  return productUnit ? [productUnit.toUpperCase()] : ["KG", "G", "L", "ML", "BOTTLE", "BOX"]
}

function parsePackSize(sizeStr: string, allowedUnits: string[]): { qty: string; unit: string } {
  const trimmed = (sizeStr || "").trim()
  const defaultUnit = allowedUnits[0] || "Kg"
  if (!trimmed) {
    return { qty: "", unit: defaultUnit }
  }

  const match = trimmed.match(/^([\d.]+)\s*(.*)$/)
  if (match) {
    const qty = match[1]
    const rawUnit = match[2].trim()
    const found = allowedUnits.find((u) => u.toLowerCase() === rawUnit.toLowerCase())
    return { qty, unit: found || (rawUnit && allowedUnits.includes(rawUnit) ? rawUnit : defaultUnit) }
  }

  return { qty: trimmed.replace(/[^\d.]/g, ""), unit: defaultUnit }
}

function formatPackSize(qty: string | number, unit: string): string {
  const cleanQty = String(qty ?? "").trim()
  if (!cleanQty) return ""
  return unit ? `${cleanQty} ${unit}` : cleanQty
}

const emptyProduct: Product = {
  brand: "",
  category: "",
  createdAt: "",
  featured: false,
  fullDescription: "",
  howToUse: "",
  id: "",
  images: [],
  metaDescription: "",
  metaTitle: "",
  name: "",
  packSizes: [{ size: "", mrp: 0, salePrice: 0, stockQuantity: 0, isDefault: true, price: 0 }],
  packSizeImagesEnabled: false,
  price: 0,
  salePrice: null,
  shippingReturns: "",
  shortDescription: "",
  sku: "",
  slug: "",
  specifications: "",
  status: "published",
  stockQuantity: 0,
  tags: [],
  unit: "KG",
  updatedAt: "",

  // Verification fields
  verifyDescription: "",
  verifyImage: null,
  mfgDate: "",
  expiryDate: "",
  packTiming: "09:00 AM",
  packDate: "",
  supervisorName: "",
  contractorName: "",
  literature: "",
  msds: "",
  license: "",
  cir: "",
  eprNumber: "",
  plasticCategory: "",
  leafletInfo: "",
  uin: "",
}

export function OryCMSProductsList() {
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
  const [bulkPermanentConfirmOpen, setBulkPermanentConfirmOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null)
  const [permanentDeleteCandidate, setPermanentDeleteCandidate] = useState<Product | null>(null)
  const [restoreCandidate, setRestoreCandidate] = useState<Product | null>(null)
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "standard">("all")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"created-desc" | "created-asc" | "name-asc" | "price-asc" | "stock-asc">("created-desc")
  const [statusFilter, setStatusFilter] = useState<"all" | ProductStatus | "trash">("all")
  const [toast, setToast] = useState<Toast | null>(null)

  const isTrashView = statusFilter === "trash"

  async function loadProducts() {
    setLoading(true)
    const url = isTrashView ? "/api/orycms/products?trash=true" : "/api/orycms/products"
    const json = await fetch(url).then((response) => response.json())

    setProducts(json.success ? json.data : [])
    setSelected([])
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [statusFilter])

  async function deleteProduct(product: Product) {
    const json = await fetch(`/api/orycms/products/${product.id}`, { method: "DELETE" }).then((r) =>
      r.json(),
    )

    if (json.success) {
      setProducts((current) => current.filter((item) => item.id !== product.id))
      setSelected((current) => current.filter((id) => id !== product.id))
      setDeleteCandidate(null)
      showToast("Product moved to Trash Can.", "success")
    } else {
      showToast(json.error?.message ?? "Delete failed.", "error")
    }
  }

  async function bulkDelete() {
    const json = await fetch("/api/orycms/products", {
      body: JSON.stringify({ ids: selected }),
      headers: { "content-type": "application/json" },
      method: "DELETE",
    }).then((r) => r.json())

    if (json.success) {
      setProducts((current) => current.filter((item) => !selected.includes(item.id)))
      setSelected([])
      setBulkConfirmOpen(false)
      showToast("Selected products moved to Trash Can.", "success")
    } else {
      showToast(json.error?.message ?? "Bulk delete failed.", "error")
    }
  }

  async function restoreProduct(product: Product) {
    const json = await fetch("/api/orycms/products/restore", {
      body: JSON.stringify({ id: product.id }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }).then((r) => r.json())

    if (json.success) {
      setProducts((current) => current.filter((item) => item.id !== product.id))
      setSelected((current) => current.filter((id) => id !== product.id))
      setRestoreCandidate(null)
      showToast("Product restored successfully.", "success")
    } else {
      showToast(json.error?.message ?? "Restore failed.", "error")
    }
  }

  async function bulkRestore() {
    const json = await fetch("/api/orycms/products/restore", {
      body: JSON.stringify({ ids: selected }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }).then((r) => r.json())

    if (json.success) {
      setProducts((current) => current.filter((item) => !selected.includes(item.id)))
      setSelected([])
      showToast("Selected products restored successfully.", "success")
    } else {
      showToast(json.error?.message ?? "Bulk restore failed.", "error")
    }
  }

  async function permanentDeleteProduct(product: Product) {
    const json = await fetch(`/api/orycms/products/${product.id}?permanent=true`, {
      method: "DELETE",
    }).then((r) => r.json())

    if (json.success) {
      setProducts((current) => current.filter((item) => item.id !== product.id))
      setSelected((current) => current.filter((id) => id !== product.id))
      setPermanentDeleteCandidate(null)
      showToast("Product permanently deleted.", "success")
    } else {
      showToast(json.error?.message ?? "Permanent delete failed.", "error")
    }
  }

  async function bulkPermanentDelete() {
    const json = await fetch("/api/orycms/products?permanent=true", {
      body: JSON.stringify({ ids: selected, permanent: true }),
      headers: { "content-type": "application/json" },
      method: "DELETE",
    }).then((r) => r.json())

    if (json.success) {
      setProducts((current) => current.filter((item) => !selected.includes(item.id)))
      setSelected([])
      setBulkPermanentConfirmOpen(false)
      showToast("Selected products permanently deleted.", "success")
    } else {
      showToast(json.error?.message ?? "Bulk permanent delete failed.", "error")
    }
  }

  function showToast(message: string, type: Toast["type"]) {
    const item = { id: crypto.randomUUID(), message, type }
    playOryCMSToastSound()
    setToast(item)
    window.setTimeout(() => setToast((current) => (current?.id === item.id ? null : current)), 3000)
  }

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort(),
    [products],
  )
  const filtered = useMemo(() => {
    const next = products.filter((product) => {
      const matchesQuery = [product.name, product.sku].join(" ").toLowerCase().includes(query.toLowerCase())
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      const matchesStatus =
        statusFilter === "all" || statusFilter === "trash" || product.status === statusFilter
      const matchesFeatured =
        featuredFilter === "all" ||
        (featuredFilter === "featured" ? product.featured : !product.featured)

      return matchesQuery && matchesCategory && matchesStatus && matchesFeatured
    })

    return next.sort((a, b) => {
      if (sortBy === "created-asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === "name-asc") return a.name.localeCompare(b.name)
      if (sortBy === "price-asc") return (a.salePrice ?? a.price) - (b.salePrice ?? b.price)
      if (sortBy === "stock-asc") return a.stockQuantity - b.stockQuantity
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [categoryFilter, featuredFilter, products, query, sortBy, statusFilter])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PRODUCT_PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PRODUCT_PAGE_SIZE, page * PRODUCT_PAGE_SIZE)
  const allVisibleSelected = paged.length > 0 && paged.every((product) => selected.includes(product.id))

  useEffect(() => {
    setPage(1)
  }, [categoryFilter, featuredFilter, query, sortBy, statusFilter])

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/products", label: "Products" }]} />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">
            {isTrashView ? "Trash Can" : "Products"}
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
            {isTrashView
              ? "Products in Trash Can are retained for 60 days before being automatically purged along with their media."
              : "Manage published storefront products, variants, stock, SEO, and media galleries."}
          </p>
        </div>
        {!isTrashView ? (
          <Link
            href="/admin/products/new"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-[12.5px] font-semibold text-background shadow-xs transition-colors hover:!bg-[#FF5A20] hover:!text-white cursor-pointer select-none"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Product
          </Link>
        ) : null}
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-muted px-4 py-3">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products by name or SKU…"
              className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[13px] outline-none focus:border-border-strong"
            />
          </div>
          <OryCMSSelect
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
            options={[{ label: "All categories", value: "all" }, ...categories.map((c) => ({ label: c, value: c }))]}
            className="w-auto"
          />
          <OryCMSSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as typeof statusFilter)}
            options={[
              { label: "All active status", value: "all" },
              { label: "Published", value: "published" },
              { label: "Draft", value: "draft" },
              { label: "Trash Can", value: "trash" },
            ]}
            className="w-auto"
          />
          {!isTrashView ? (
            <OryCMSSelect
              value={featuredFilter}
              onChange={(val) => setFeaturedFilter(val as typeof featuredFilter)}
              options={[
                { label: "All featured", value: "all" },
                { label: "Featured", value: "featured" },
                { label: "Not featured", value: "standard" },
              ]}
              className="w-auto"
            />
          ) : null}
          <OryCMSSelect
            value={sortBy}
            onChange={(val) => setSortBy(val as typeof sortBy)}
            options={[
              { label: "Newest first", value: "created-desc" },
              { label: "Oldest first", value: "created-asc" },
              { label: "Name A–Z", value: "name-asc" },
              { label: "Price low", value: "price-asc" },
              { label: "Stock low", value: "stock-asc" },
            ]}
            className="w-auto"
          />
          <button
            type="button"
            onClick={() => void loadProducts()}
            disabled={loading}
            title="Refresh product list"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-[12.5px] font-medium text-foreground transition-colors hover:!bg-foreground hover:!text-white shadow-xs cursor-pointer select-none disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
          {selected.length > 0 ? (
            isTrashView ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void bulkRestore()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-[12.5px] font-medium text-foreground border border-border hover:!bg-foreground hover:!text-white transition-colors shadow-xs cursor-pointer select-none"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore {selected.length}
                </button>
                <button
                  type="button"
                  onClick={() => setBulkPermanentConfirmOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#FF5A20] px-3 text-[12.5px] font-semibold text-white hover:!bg-foreground hover:!text-white transition-colors shadow-xs cursor-pointer select-none"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Purge {selected.length}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setBulkConfirmOpen(true)}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-white text-foreground border border-border hover:!bg-[#FF5A20] hover:!text-white px-3 text-[12.5px] font-medium transition-colors shadow-xs cursor-pointer select-none"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete {selected.length}
              </button>
            )
          ) : null}
          <div className="rounded-full border border-border bg-surface px-3 py-1 text-[12px] text-muted-foreground">
            {filtered.length} {isTrashView ? "item in trash" : "product"}{filtered.length === 1 ? "" : "s"}
          </div>
        </div>

        {isTrashView ? (
          <div className="flex items-center gap-2 bg-[#FF5A20]/10 px-4 py-2 text-[12.5px] font-medium text-[#FF5A20] border-b border-border">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Items in Trash Can will be automatically purged permanently after 60 days of retention.</span>
          </div>
        ) : null}

        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : filtered.length === 0 ? (
          <div className="grid min-h-64 place-items-center text-center text-[13px] text-muted-foreground">
            {isTrashView ? "Trash Can is empty." : "No products found."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-[12.5px]">
                <thead className="border-b border-border bg-surface-muted text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={(event) => {
                          const visibleIds = paged.map((product) => product.id)
                          setSelected((current) =>
                            event.target.checked
                              ? Array.from(new Set([...current, ...visibleIds]))
                              : current.filter((id) => !visibleIds.includes(id)),
                          )
                        }}
                      />
                    </th>
                    <th className="px-4 py-3">Image</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-center">MRP</th>
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3 text-center">{isTrashView ? "Deleted Date" : "Status"}</th>
                    {!isTrashView ? <th className="px-4 py-3 text-center">Featured</th> : null}
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-accent/20">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(product.id)}
                          onChange={(event) =>
                            setSelected((current) =>
                              event.target.checked
                                ? [...current, product.id]
                                : current.filter((id) => id !== product.id),
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <ProductThumb product={product} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{product.name}</div>
                        <div className="mt-1 font-mono text-[11px] text-muted-foreground">{product.sku}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{product.category || "—"}</td>
                      <td className="num px-4 py-3 text-center font-semibold">
                        ₹{product.salePrice ?? product.price}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {product.stockQuantity} {product.unit}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isTrashView ? (
                          <div className="flex flex-col items-center">
                            <span className="text-[11.5px] font-medium text-foreground">
                              {formatDateTime(product.deletedAt ?? undefined)}
                            </span>
                            <span className="text-[10.5px] font-semibold text-[#FF5A20]">
                              {getRemainingTrashDays(product.deletedAt)}
                            </span>
                          </div>
                        ) : (
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[11px] font-medium capitalize",
                              product.status === "published"
                                ? "bg-chart-3/15 text-chart-3"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {product.status}
                          </span>
                        )}
                      </td>
                      {!isTrashView ? (
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[11px] font-medium",
                              product.featured ? "bg-chart-3/15 text-chart-3" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {product.featured ? "Featured" : "No"}
                          </span>
                        </td>
                      ) : null}
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(product.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {isTrashView ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void restoreProduct(product)}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-[12px] font-medium text-foreground transition-colors hover:!bg-foreground hover:!text-white shadow-xs cursor-pointer select-none"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Restore
                              </button>
                              <button
                                type="button"
                                onClick={() => setPermanentDeleteCandidate(product)}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#FF5A20] px-3 text-[12px] font-semibold text-white transition-colors hover:!bg-foreground hover:!text-white shadow-xs cursor-pointer select-none"
                                aria-label={`Permanently delete ${product.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Purge
                              </button>
                            </>
                          ) : (
                            <>
                              <Link
                                href={`/products/${product.slug}`}
                                target="_blank"
                                className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                aria-label={`View ${product.name}`}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                              <Link
                                href={`/admin/products/${product.id}`}
                                className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-[12px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                              >
                                Edit
                              </Link>
                              <button
                                type="button"
                                onClick={() => setDeleteCandidate(product)}
                                className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-destructive transition-colors hover:border-destructive/30 hover:bg-destructive/10"
                                aria-label={`Move ${product.name} to Trash Can`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
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
      <ProductDeleteDialog
        count={selected.length}
        name={deleteCandidate?.name}
        onCancel={() => {
          setDeleteCandidate(null)
          setBulkConfirmOpen(false)
        }}
        onConfirm={() => (deleteCandidate ? void deleteProduct(deleteCandidate) : void bulkDelete())}
        open={Boolean(deleteCandidate) || bulkConfirmOpen}
      />
      <ProductPermanentDeleteDialog
        count={selected.length}
        name={permanentDeleteCandidate?.name}
        onCancel={() => {
          setPermanentDeleteCandidate(null)
          setBulkPermanentConfirmOpen(false)
        }}
        onConfirm={() =>
          permanentDeleteCandidate
            ? void permanentDeleteProduct(permanentDeleteCandidate)
            : void bulkPermanentDelete()
        }
        open={Boolean(permanentDeleteCandidate) || bulkPermanentConfirmOpen}
      />
      <ProductToast toast={toast} />
    </section>
  )
}

export function OryCMSProductForm({ id }: { id?: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [meta, setMeta] = useState<Meta>({ categories: [], media: [] })
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<ProductImage | null>(null)
  const [product, setProduct] = useState<Product>(emptyProduct)
  const [productLoading, setProductLoading] = useState(Boolean(id))
  const [savedId, setSavedId] = useState(id ?? "")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [verifyUploadProgress, setVerifyUploadProgress] = useState<number | null>(null)
  const verifyFileInputRef = useRef<HTMLInputElement>(null)
  const effectiveId = id ?? savedId
  const editing = Boolean(effectiveId)
  const origin = typeof window !== "undefined" ? window.location.origin : ""

  const parsedTime = useMemo(() => {
    const match = (product.packTiming || "").match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i)
    return {
      hour: match ? match[1] : "09",
      minute: match ? match[2] : "00",
      period: match ? match[3].toUpperCase() : "AM"
    }
  }, [product.packTiming])

  const updatePackTiming = (key: "hour" | "minute" | "period", val: string) => {
    const hour = key === "hour" ? val : parsedTime.hour
    const minute = key === "minute" ? val : parsedTime.minute
    const period = key === "period" ? val : parsedTime.period
    patch({ packTiming: `${hour}:${minute} ${period}` })
  }

  function ensureDefaultPackSize(prod: Product): Product {
    if (prod.packSizes && prod.packSizes.length > 0) {
      const hasDefault = prod.packSizes.some((p) => p.isDefault)
      if (!hasDefault) {
        return {
          ...prod,
          packSizes: prod.packSizes.map((p, idx) => ({
            ...p,
            isDefault: idx === 0,
          })),
        }
      }
    }
    return prod
  }

  useEffect(() => {
    setSavedId(id ?? "")
    void loadMeta()

    if (id) {
      setProductLoading(true)
      fetch(`/api/orycms/products/${id}`)
        .then((response) => response.json())
        .then((json) => {
          if (json.success) setProduct(ensureDefaultPackSize(json.data))
          else showToast(json.error?.message ?? "Product not found.", "error")
        })
        .catch(() => showToast("Product not found.", "error"))
        .finally(() => setProductLoading(false))
    } else {
      setProduct(ensureDefaultPackSize(emptyProduct))
      setProductLoading(false)
    }
  }, [id])

  async function loadMeta() {
    const json = await fetch("/api/orycms/products/meta").then((response) => response.json())

    if (json.success) {
      setMeta(json.data)
      setProduct((current) => {
        const nextProd = current.category || json.data.categories.length === 0
          ? current
          : { ...current, category: json.data.categories[0] }
        return ensureDefaultPackSize(nextProd)
      })
    }
  }

  function patch(next: Partial<Product>) {
    setProduct((current) => ensureDefaultPackSize({ ...current, ...next }))
  }

  function showToast(message: string, type: Toast["type"]) {
    const item = { id: crypto.randomUUID(), message, type }
    playOryCMSToastSound()
    setToast(item)
    window.setTimeout(() => setToast((current) => (current?.id === item.id ? null : current)), 3000)
  }

  async function saveProduct() {
    const validationError = validateProduct(product)
    if (validationError) {
      showToast(validationError, "error")
      return
    }
    setSaving(true)
    const response = await fetch(effectiveId ? `/api/orycms/products/${effectiveId}` : "/api/orycms/products", {
      body: JSON.stringify(product),
      headers: { "content-type": "application/json" },
      method: effectiveId ? "PATCH" : "POST",
    })
    const json = await response.json()
    setSaving(false)

    if (json.success) {
      setProduct(json.data)
      setSavedId(json.data.id)
      showToast("Product saved.", "success")
      router.replace(`/admin/products/${json.data.id}`)
      router.refresh()
    } else {
      showToast(json.error?.message ?? "Save failed.", "error")
    }
  }

  async function uploadImage(file?: File) {
    if (!file) return
    if (product.images.length >= 5) {
      showToast("You can upload a maximum of 5 product images.", "error")
      return
    }

    const validationError = validateImageFile(file)

    if (validationError) {
      showToast(`${file.name}: ${validationError}`, "error")
      return
    }

    try {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new window.Image()
        img.src = URL.createObjectURL(file)
        img.onload = () => {
          resolve({ width: img.width, height: img.height })
          URL.revokeObjectURL(img.src)
        }
        img.onerror = () => {
          reject(new Error("Unable to read image dimensions."))
          URL.revokeObjectURL(img.src)
        }
      })

      if (dimensions.width !== 1200 || dimensions.height !== 1200) {
        showToast(`Product image must be exactly 1200 × 1200 px. (Current: ${dimensions.width} × ${dimensions.height} px)`, "error")
        return
      }
    } catch (err) {
      showToast("Unable to verify image dimensions.", "error")
      return
    }

    try {
      const asset = await uploadProductImage(file, file.name, setUploadProgress)
      const image = {
        id: asset.id,
        name: asset.original_filename ?? file.name,
        url: asset.secure_url,
      }

      setMeta((current) => ({
        ...current,
        media: [image, ...current.media.filter((item) => item.url !== image.url)],
      }))
      setProduct((current) => ({
        ...current,
        images: current.images.some((item) => item.url === image.url)
          ? current.images
          : [...current.images, image],
      }))
      showToast(`${file.name} uploaded and selected.`, "success")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Upload failed.", "error")
    } finally {
      setUploadProgress(null)
    }
  }

  async function uploadVerifyImage(file?: File) {
    if (!file) return
    if (product.verifyImage) {
      showToast("Only one verification image can be selected. Please remove the existing image first.", "error")
      return
    }

    const validationError = validateImageFile(file)
    if (validationError) {
      showToast(`${file.name}: ${validationError}`, "error")
      return
    }

    try {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new window.Image()
        img.src = URL.createObjectURL(file)
        img.onload = () => {
          resolve({ width: img.width, height: img.height })
          URL.revokeObjectURL(img.src)
        }
        img.onerror = () => {
          reject(new Error("Unable to read image dimensions."))
          URL.revokeObjectURL(img.src)
        }
      })

      if (dimensions.width !== 1200 || dimensions.height !== 1200) {
        showToast(`Verification image must be exactly 1200 × 1200 px. (Current: ${dimensions.width} × ${dimensions.height} px)`, "error")
        return
      }
    } catch (err) {
      showToast("Unable to verify image dimensions.", "error")
      return
    }

    try {
      const asset = await uploadProductImage(file, file.name, setVerifyUploadProgress)
      const image = {
        id: asset.id,
        name: asset.original_filename ?? file.name,
        url: asset.secure_url,
      }

      setProduct((current) => ({
        ...current,
        verifyImage: image,
      }))
      showToast("Verification image uploaded successfully.", "success")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Upload failed.", "error")
    } finally {
      setVerifyUploadProgress(null)
    }
  }

  function toggleImage(image: ProductImage) {
    const isSelected = product.images.some((item) => item.url === image.url)
    if (!isSelected && product.images.length >= 5) {
      showToast("You can select a maximum of 5 product images.", "error")
      return
    }
    patch({
      images: isSelected
        ? product.images.filter((item) => item.url !== image.url)
        : [...product.images, image],
    })
  }

  function moveImage(from: number, to: number) {
    if (from === to) return
    const next = [...product.images]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    patch({ images: next })
  }

  function setPrimaryImage(index: number) {
    moveImage(index, 0)
  }

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs
            items={[
              { href: "/admin", label: "Overview" },
              { href: "/admin/products", label: "Products" },
              {
                href: effectiveId ? `/admin/products/${effectiveId}` : "/admin/products/new",
                label: effectiveId ? product.slug || effectiveId : "New",
              },
            ]}
          />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">
            {editing ? "Edit Product" : "Add Product"}
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Slug is alphanumeric, at least 10 characters, and auto-generated when creating a product.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <Link
              href="/admin/products/new"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Product
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => void saveProduct()}
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Product
          </button>
        </div>
      </div>

      {productLoading ? <ProductFormSkeleton /> : null}

      {!productLoading ? (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
           <Card title="Product details">
            <Field label="Product Name*" value={product.name} onChange={(name) => patch({ name })} placeholder="e.g. Adhunik Leaf Care" />
            {editing ? (
              <label className="block space-y-1.5">
                <span className="text-[12px] font-medium">Slug*</span>
                <input
                  value={product.slug || ""}
                  readOnly
                  className="h-9 w-full cursor-not-allowed rounded-lg border border-border bg-surface-muted px-3 text-[13px] text-muted-foreground outline-none"
                />
              </label>
            ) : null}
            <LimitedField
              label="Short Description*"
              value={product.shortDescription}
              onChange={(shortDescription) => patch({ shortDescription })}
              placeholder="e.g. Highly effective crop care formulation for maximum yield."
              maxLength={85}
            />
            <div className="space-y-1.5">
              <span className="text-[12px] font-medium">Full Description</span>
              <RichTextEditor
                value={product.fullDescription}
                onChange={(fullDescription) => patch({ fullDescription })}
                placeholder="Rich text content. Use headings, bold, lists, tables, links, and images."
              />
            </div>
          </Card>

          <Card title="Storefront content">
            <p className="text-[11.5px] text-muted-foreground">
              These appear on the product page. Full Description above powers the
              &ldquo;Product Description&rdquo; section; the fields below power the
              collapsible accordions. Format with the rich text toolbar. Leave blank
              to fall back to defaults.
            </p>
            <div className="space-y-1.5">
              <span className="text-[12px] font-medium">Product Specifications</span>
              <RichTextEditor
                value={product.specifications}
                onChange={(specifications) => patch({ specifications })}
                placeholder="e.g. Weight: 60g · Quantity: 20 sticks · Lasts: Up to 60 days"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[12px] font-medium">How to Use</span>
              <RichTextEditor
                value={product.howToUse}
                onChange={(howToUse) => patch({ howToUse })}
                placeholder="Step-by-step usage instructions."
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[12px] font-medium">Shipping &amp; Returns</span>
              <RichTextEditor
                value={product.shippingReturns}
                onChange={(shippingReturns) => patch({ shippingReturns })}
                placeholder="Free shipping on orders above ₹499. 30-day replacement for damaged products."
              />
            </div>
          </Card>

          <Card title="Pricing, stock, variants">
            <div className="grid gap-3 md:grid-cols-2">
              <OryCMSSelect
                label="Unit*"
                value={product.unit}
                onChange={(newUnit) => {
                  const newAllowed = getPackSizeUnitOptions(newUnit)
                  const defaultUnit = newAllowed[0] || "Kg"
                  const updatedPackSizes = product.packSizes.map((pack) => {
                    const parsed = parsePackSize(pack.size, newAllowed)
                    const validUnit = newAllowed.includes(parsed.unit) ? parsed.unit : defaultUnit
                    return {
                      ...pack,
                      size: formatPackSize(parsed.qty, validUnit),
                    }
                  })
                  patch({ unit: newUnit, packSizes: updatedPackSizes })
                }}
                options={DEFAULT_UNITS.map((u) => ({ label: u, value: u }))}
                placeholder="Select unit"
                searchable
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted/60 p-3">
                <div className="space-y-0.5">
                  <div className="text-[13px] font-semibold text-foreground">
                    Enable pack-size-specific images (optional)
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    Let storefront customers filter product pictures and view different image sets for each pack size.
                  </div>
                </div>
                <Toggle
                  checked={Boolean(product.packSizeImagesEnabled)}
                  onChange={(checked) => patch({ packSizeImagesEnabled: checked })}
                />
              </div>

              <div className="space-y-3">
                {product.packSizes.map((pack, index) => {
                  const allowedUnits = getPackSizeUnitOptions(product.unit)
                  const parsed = parsePackSize(pack.size, allowedUnits)

                  return (
                    <div key={index} className="space-y-3 rounded-lg border border-border/80 bg-surface/50 p-4">
                      {/* Row 1: Size Qty, Unit, Remove */}
                      <div className="grid gap-3 md:grid-cols-[120px_130px_auto] items-end">
                        <div className="flex flex-col space-y-1">
                          <span className="text-[11px] font-semibold text-muted-foreground">Qty</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={parsed.qty}
                            onFocus={(e) => e.target.select()}
                            onChange={(event) => {
                              const val = event.target.value
                              const newSize = formatPackSize(val, parsed.unit)
                              patch({
                                packSizes: product.packSizes.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, size: newSize } : item,
                                ),
                              })
                            }}
                            placeholder="Qty (e.g. 5)"
                            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none transition focus:border-primary"
                          />
                        </div>

                        <div className="flex flex-col space-y-1">
                          <span className="text-[11px] font-semibold text-muted-foreground">Unit</span>
                          <OryCMSSelect
                            value={parsed.unit}
                            onChange={(newUnit) => {
                              const newSize = formatPackSize(parsed.qty, newUnit)
                              patch({
                                packSizes: product.packSizes.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, size: newSize } : item,
                                ),
                              })
                            }}
                            options={allowedUnits.map((u) => ({ label: u, value: u }))}
                            placeholder="Unit"
                            className="w-full"
                          />
                        </div>

                        <div className="flex flex-col space-y-1">
                          <button
                            type="button"
                            onClick={() => patch({ packSizes: product.packSizes.filter((_, i) => i !== index) })}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title="Remove pack size"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: MRP, Sale Price, Stock, Default Toggle */}
                      <div className="grid gap-3 md:grid-cols-4 items-center">
                        <div className="flex flex-col space-y-1">
                          <span className="text-[11px] font-semibold text-muted-foreground">MRP (₹)*</span>
                          <input
                            type="number"
                            required
                            value={pack.mrp || ""}
                            onFocus={(e) => e.target.select()}
                            onChange={(event) =>
                              patch({
                                packSizes: product.packSizes.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, mrp: Number(event.target.value) } : item,
                                ),
                              })
                            }
                            placeholder="e.g. 500"
                            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none transition focus:border-primary"
                          />
                        </div>

                        <div className="flex flex-col space-y-1">
                          <span className="text-[11px] font-semibold text-muted-foreground">Sale Price (USP) (₹)*</span>
                          <input
                            type="number"
                            required
                            value={pack.salePrice || ""}
                            onFocus={(e) => e.target.select()}
                            onChange={(event) =>
                              patch({
                                packSizes: product.packSizes.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, salePrice: Number(event.target.value) } : item,
                                ),
                              })
                            }
                            placeholder="e.g. 450"
                            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none transition focus:border-primary"
                          />
                        </div>

                        <div className="flex flex-col space-y-1">
                          <span className="text-[11px] font-semibold text-muted-foreground">Stock Quantity*</span>
                          <input
                            type="number"
                            required
                            value={pack.stockQuantity !== undefined ? pack.stockQuantity : ""}
                            onFocus={(e) => e.target.select()}
                            onChange={(event) =>
                              patch({
                                packSizes: product.packSizes.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, stockQuantity: Number(event.target.value) } : item,
                                ),
                              })
                            }
                            placeholder="e.g. 100"
                            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none transition focus:border-primary"
                          />
                        </div>

                        <div className="flex items-center space-x-2 pt-5">
                          <input
                            type="radio"
                            name="default_pack_size"
                            id={`default_pack_${index}`}
                            checked={Boolean(pack.isDefault)}
                            onChange={() => {
                              patch({
                                packSizes: product.packSizes.map((item, itemIndex) => ({
                                  ...item,
                                  isDefault: itemIndex === index,
                                })),
                              })
                            }}
                            className="h-4 w-4 accent-[#FF5A20] cursor-pointer"
                          />
                          <label htmlFor={`default_pack_${index}`} className="text-[12px] font-medium text-foreground cursor-pointer select-none">
                            Storefront Default
                          </label>
                        </div>
                      </div>

                      {product.packSizeImagesEnabled && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-[12px]">
                          <span className="font-medium text-muted-foreground shrink-0 flex items-center gap-1">
                            <ImageIcon className="h-3.5 w-3.5 text-[#689c30]" />
                            Pack-specific Images:
                          </span>
                          <div className="flex-1 min-w-[220px]">
                            <OryCMSMultiSelect
                              values={(() => {
                                if (Array.isArray(pack.imageIds) && pack.imageIds.length > 0) return pack.imageIds
                                if (Array.isArray(pack.imageUrls) && pack.imageUrls.length > 0) return pack.imageUrls
                                if (pack.imageId) return [pack.imageId]
                                if (pack.imageUrl) return [pack.imageUrl]
                                return []
                              })()}
                              onChange={(selectedVals) => {
                                const selectedImgs = product.images.filter((img) => (img.id && selectedVals.includes(img.id)) || selectedVals.includes(img.url))
                                const selIds = selectedImgs.map((img) => img.id).filter((id): id is string => Boolean(id))
                                const selUrls = selectedImgs.map((img) => img.url).filter((url): url is string => Boolean(url))

                                const packLabel = pack.size.trim()

                                const newPackSizes = product.packSizes.map((item, i) => {
                                  if (i !== index) return item
                                  return {
                                    ...item,
                                    imageId: selIds[0] || (selUrls[0] ? selUrls[0] : undefined),
                                    imageIds: selIds.length > 0 ? selIds : undefined,
                                    imageUrl: selUrls[0] || (selUrls[0] ? selUrls[0] : undefined),
                                    imageUrls: selUrls.length > 0 ? selUrls : undefined,
                                  }
                                })

                                const newImages = product.images.map((img) => {
                                  const imgVal = img.id || img.url
                                  const isSelectedForThisPack = selectedVals.includes(imgVal)
                                  const currentPacks = img.packSizes || []

                                  if (isSelectedForThisPack) {
                                    if (packLabel && !currentPacks.includes(packLabel)) {
                                      return { ...img, packSizes: [...currentPacks, packLabel] }
                                    }
                                  } else if (packLabel) {
                                    const usedByOtherPack = newPackSizes.some((p, pIdx) => {
                                      if (pIdx === index || p.size.trim() !== packLabel) return false
                                      const pVals = p.imageIds || p.imageUrls || (p.imageId ? [p.imageId] : p.imageUrl ? [p.imageUrl] : [])
                                      return pVals.includes(imgVal)
                                    })
                                    if (!usedByOtherPack && currentPacks.includes(packLabel)) {
                                      return { ...img, packSizes: currentPacks.filter((s) => s !== packLabel) }
                                    }
                                  }
                                  return img
                                })

                                patch({ packSizes: newPackSizes, images: newImages })
                              }}
                              options={product.images.map((img, imgIdx) => ({
                                image: img.url,
                                label: img.name ? `${img.name}${imgIdx === 0 ? " (Primary)" : ""}` : `Image #${imgIdx + 1}${imgIdx === 0 ? " (Primary)" : ""}`,
                                value: img.id || img.url,
                              }))}
                              placeholder="Default (Product Primary / Untagged)"
                              searchable
                              className="w-full"
                            />
                          </div>
                          {(() => {
                            const curUrls = Array.isArray(pack.imageUrls) && pack.imageUrls.length > 0 ? pack.imageUrls : pack.imageUrl ? [pack.imageUrl] : []
                            if (curUrls.length === 0) return null
                            return (
                              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                                {curUrls.map((url, uIdx) => (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    key={`${url}-${uIdx}`}
                                    src={url}
                                    alt={pack.size}
                                    className="h-7 w-7 rounded border border-border object-contain bg-white p-0.5 shrink-0"
                                  />
                                ))}
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  const allowed = getPackSizeUnitOptions(product.unit)
                  const defUnit = allowed[0] || "Kg"
                  patch({ packSizes: [...product.packSizes, { mrp: 0, salePrice: 0, stockQuantity: 0, isDefault: false, price: 0, size: formatPackSize("", defUnit) }] })
                }}
                className="h-8 rounded-lg border border-border px-3 text-[12px] hover:bg-accent transition-colors cursor-pointer"
              >
                Add pack size
              </button>
            </div>
          </Card>

          <Card title="SEO and taxonomy">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Brand" value={product.brand} onChange={(brand) => patch({ brand })} placeholder="e.g. Adhunik" />
              <div>
                <OryCMSSelect
                  label="Category*"
                  value={product.category}
                  onChange={(category) => patch({ category })}
                  options={meta.categories.map((c) => ({ label: c, value: c }))}
                  placeholder="Select category"
                  searchable
                  className="w-full"
                />
                {meta.categories.length === 0 ? (
                  <span className="mt-1 block text-[11.5px] text-muted-foreground">
                    Add an active category from OryCMS Categories first.
                  </span>
                ) : null}
              </div>
            </div>
            <Field label="Tags" value={product.tags.join(", ")} onChange={(value) => patch({ tags: value.split(",") })} placeholder="e.g. organic, fertilizer, cropcare" />
            <Field label="Meta Title" value={product.metaTitle} onChange={(metaTitle) => patch({ metaTitle })} placeholder="e.g. Buy Organic Leaf Fertilizer | Adhunik Crop Care" />
            <Field label="Meta Description" value={product.metaDescription} onChange={(metaDescription) => patch({ metaDescription })} placeholder="e.g. Best organic leaf fertilizer formulation for maximizing rice and wheat yields." />
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Publishing">
            <OryCMSSelect
              label="Product Status"
              value={product.status}
              onChange={(status) => patch({ status: status as Product["status"] })}
              options={[
                { label: "Published", value: "published" },
                { label: "Draft", value: "draft" },
              ]}
              className="w-full"
            />
            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={product.featured}
                onChange={(event) => patch({ featured: event.target.checked })}
              />
              Featured Product
            </label>
          </Card>

          <Card title="Product images*">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                void uploadImage(event.target.files?.[0])
                event.target.value = ""
              }}
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  if (product.images.length >= 5) {
                    showToast("You can upload a maximum of 5 product images.", "error")
                    return
                  }
                  fileInputRef.current?.click()
                }}
                disabled={uploadProgress !== null}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer select-none"
              >
                {uploadProgress !== null ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploadProgress !== null ? `Uploading ${uploadProgress}%` : "Upload Image"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (product.images.length >= 5) {
                    showToast("You can select a maximum of 5 product images.", "error")
                    return
                  }
                  void loadMeta()
                  setMediaPickerOpen(true)
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer select-none"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Media
              </button>
            </div>
            <p className="text-[12px] text-muted-foreground">
              Product uploads are automatically cropped and saved as 1200 × 1200 px images.
            </p>

            {product.images.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[12px] font-medium">Selected gallery</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {product.images.map((image, index) => (
                    <div
                      key={`${image.url}-${index}`}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (dragIndex !== null) moveImage(dragIndex, index)
                        setDragIndex(null)
                      }}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt={image.name ?? "Product image"} className="h-full w-full object-contain p-2" />
                      <span className="absolute left-1 top-1 grid h-6 w-6 cursor-grab place-items-center rounded-full bg-background/90 text-muted-foreground shadow-xs">
                        <GripVertical className="h-3.5 w-3.5" />
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewImage(image)}
                        className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-muted-foreground shadow-xs transition-colors hover:text-foreground"
                        aria-label="Preview image"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                        className="absolute bottom-1 left-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-chart-3 shadow-xs transition-colors hover:bg-[var(--orycms-orange)] hover:text-white"
                        aria-label="Set as primary image"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => patch({ images: product.images.filter((_, itemIndex) => itemIndex !== index) })}
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive shadow-xs"
                        aria-label="Remove selected image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      {index === 0 ? (
                        <span className="absolute left-8 top-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                          Primary
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-[12px] text-muted-foreground">
                <ImageIcon className="mx-auto mb-2 h-5 w-5" />
                Upload or select images to build this product gallery.
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Recommended: <strong>1200 × 1200 px</strong>, 1:1 square, JPG or PNG, max 500 KB. Images are displayed with <code>object-contain</code> — the full product is always visible.
            </p>
          </Card>
        </div>
      </div>
      ) : null}
      <MediaPickerDialog
        images={meta.media}
        onClose={() => setMediaPickerOpen(false)}
        onToggle={toggleImage}
        open={mediaPickerOpen}
        selectedImages={product.images}
      />
      <ProductImagePreview image={previewImage} onClose={() => setPreviewImage(null)} />
      <ProductToast toast={toast} />
    </section>
  )
}

/** Client-side required-field check mirroring the server rules, for fast feedback. */
function validateProduct(product: Product): string | null {
  if (!product.name.trim()) return "Product Name is required."
  if (!product.shortDescription.trim()) return "Short Description is required."
  if (product.shortDescription.length > 85) return "Short Description must be 85 characters or fewer."
  if (!product.category.trim()) return "Category is required."
  if (!product.unit.trim()) return "Unit is required."
  
  if (!product.images || product.images.length === 0) return "At least one product image is required."
  if (!product.packSizes || product.packSizes.length === 0) {
    return "At least one valid pack size is required."
  }

  // Each pack size validation
  for (const pack of product.packSizes) {
    if (!pack.size.trim()) return "Pack size label is required."
    if (!Number.isFinite(pack.mrp) || pack.mrp <= 0) return "MRP for pack size " + pack.size + " must be greater than 0."
    if (!Number.isFinite(pack.salePrice) || pack.salePrice <= 0) return "Sale Price for pack size " + pack.size + " must be greater than 0."
    if (pack.salePrice > pack.mrp) return "Sale Price for pack size " + pack.size + " cannot exceed MRP."
    if (!Number.isFinite(pack.stockQuantity) || pack.stockQuantity < 0) return "Stock Quantity for pack size " + pack.size + " must be 0 or more."
  }

  let defaultPacks = product.packSizes.filter((p) => p.isDefault)
  if (defaultPacks.length === 0 && product.packSizes.length > 0) {
    product.packSizes[0].isDefault = true
    defaultPacks = [product.packSizes[0]]
  }
  if (defaultPacks.length !== 1) {
    product.packSizes.forEach((p, idx) => {
      p.isDefault = idx === product.packSizes.findIndex((x) => x.isDefault)
    })
    defaultPacks = product.packSizes.filter((p) => p.isDefault)
  }

  return null
}

function Card({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-xs">
      <div className="text-[13.5px] font-semibold">{title}</div>
      {children}
    </div>
  )
}

function ProductFormSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        {[220, 190, 170].map((height, index) => (
          <div key={index} className="rounded-xl border border-border bg-surface p-5 shadow-xs">
            <div className="h-4 w-36 animate-pulse rounded bg-surface-muted" />
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="h-9 animate-pulse rounded-lg bg-surface-muted" />
              <div className="h-9 animate-pulse rounded-lg bg-surface-muted" />
            </div>
            <div
              className="mt-3 animate-pulse rounded-lg bg-surface-muted"
              style={{ height: `${height / 3}px` }}
            />
          </div>
        ))}
      </div>
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="h-4 w-28 animate-pulse rounded bg-surface-muted" />
          <div className="mt-5 h-9 animate-pulse rounded-lg bg-surface-muted" />
          <div className="mt-3 h-9 animate-pulse rounded-lg bg-surface-muted" />
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="h-4 w-32 animate-pulse rounded bg-surface-muted" />
          <div className="mt-5 grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-square animate-pulse rounded-lg bg-surface-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductDeleteDialog({
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
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FF5A20]/10 text-[#FF5A20]">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[14px] font-semibold">Move to Trash Can?</div>
            <p className="mt-1 text-[12.5px] leading-5 text-muted-foreground">
              {name ? <span className="font-medium text-foreground">{name}</span> : `${count} selected products`}{" "}
              will be moved to Trash Can. The product slug and media assets will be preserved so it can be restored at any point within 60 days.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 bg-surface p-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-lg bg-white text-foreground border border-border hover:!bg-foreground hover:!text-white font-medium px-3 text-[12.5px] transition-colors shadow-xs cursor-pointer select-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#FF5A20] text-white hover:!bg-foreground hover:!text-white font-semibold px-3 text-[12.5px] transition-colors shadow-xs cursor-pointer select-none"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Move to Trash
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductPermanentDeleteDialog({
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
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FF5A20]/20 text-[#FF5A20]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[#FF5A20]">Permanently Purge Product{name ? "" : "s"}?</div>
            <p className="mt-1 text-[12.5px] leading-5 text-muted-foreground">
              This action <span className="font-semibold text-foreground">CANNOT be undone</span>.{" "}
              {name ? <span className="font-medium text-foreground">{name}</span> : `${count} selected products`}{" "}
              will be permanently removed from the database along with all unreferenced image files from media storage.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 bg-surface p-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-lg bg-white text-foreground border border-border hover:!bg-foreground hover:!text-white font-medium px-3 text-[12.5px] transition-colors shadow-xs cursor-pointer select-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#FF5A20] text-white hover:!bg-foreground hover:!text-white font-semibold px-3 text-[12.5px] transition-colors shadow-xs cursor-pointer select-none"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Permanently Purge
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductThumb({ product }: { product: Product }) {
  const image = product.images[0]

  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-border bg-surface-muted">
      <div className="absolute inset-0 grid place-items-center text-muted-foreground">
        <ImageIcon className="h-5 w-5" />
      </div>
      {image?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt={image.name || product.name}
          onError={(event) => {
            event.currentTarget.style.display = "none"
          }}
          className="relative h-full w-full object-contain p-0.5"
        />
      ) : null}
    </div>
  )
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select option",
  searchable = false,
}: {
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  placeholder?: string
  searchable?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const allOptions = useMemo(() => {
    if (value && !options.some((opt) => opt.value === value)) {
      return [{ label: value, value }, ...options]
    }
    return options
  }, [options, value])

  const selectedOption = allOptions.find((opt) => opt.value === value)

  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return allOptions
    const q = search.toLowerCase().trim()
    return allOptions.filter((opt) => opt.label.toLowerCase().includes(q))
  }, [allOptions, search, searchable])

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev)
          setSearch("")
        }}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-border bg-surface px-3 text-[13px] outline-none transition-colors hover:bg-accent/40 focus:border-border-strong",
          !value && "text-muted-foreground"
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : value || placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full rounded-xl border border-border bg-popover text-popover-foreground p-1.5 shadow-xl opacity-100 animate-in fade-in-0 zoom-in-95">
          {searchable ? (
            <div className="relative mb-1.5">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-8 w-full rounded-md border border-border bg-muted/50 pl-8 pr-2 text-[12px] text-foreground outline-none focus:border-border-strong"
                autoFocus
              />
            </div>
          ) : null}

          <div className="max-h-52 overflow-y-auto space-y-0.5 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-muted-foreground text-center">No options found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-[12.5px] transition-colors text-left",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string
  onChange: (value: string) => void
  placeholder?: string
  value: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-medium">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-border-strong"
      />
    </label>
  )
}

function LimitedField({
  label,
  onChange,
  placeholder,
  value,
  maxLength,
}: {
  label: string
  onChange: (value: string) => void
  placeholder?: string
  value: string
  maxLength: number
}) {
  const count = value.length
  const atLimit = count >= maxLength
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between">
        <span className="text-[12px] font-medium">{label}</span>
        <span className={cn("text-[11px] tabular-nums", atLimit ? "text-destructive" : "text-muted-foreground")}>
          {count}/{maxLength}
        </span>
      </span>
      <input
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
        placeholder={placeholder}
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

function ProductToast({ toast }: { toast: Toast | null }) {
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

function MediaPickerDialog({
  images,
  onClose,
  onToggle,
  open,
  selectedImages,
}: {
  images: ProductImage[]
  onClose: () => void
  onToggle: (image: ProductImage) => void
  open: boolean
  selectedImages: ProductImage[]
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/85 p-4 backdrop-blur-sm">
      <div className="mx-2 flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-pop sm:mx-auto">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-muted px-5 py-4">
          <div>
            <div className="text-[13.5px] font-semibold">Select from Media</div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Select one or multiple Media Manager images. Selection updates the product gallery immediately.
            </p>
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
              No media images found. Upload images from the Product Images section or Media Manager.
            </div>
          </div>
        ) : (
          <div className="grid flex-1 auto-rows-max grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 lg:grid-cols-5">
            {images.map((image) => {
              const active = selectedImages.some((item) => item.url === image.url)

              return (
                <button
                  key={image.id ?? image.url}
                  type="button"
                  onClick={() => onToggle(image)}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-xl border bg-surface-muted text-left transition-colors",
                    active ? "border-chart-3 ring-2 ring-chart-3/20" : "border-border hover:border-border-strong",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={image.name ?? "Media"} className="h-full w-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.03]" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <div className="truncate text-[11px] font-medium text-white">{image.name ?? "Media image"}</div>
                  </div>
                  {active ? (
                    <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-chart-3 text-background shadow-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-muted px-5 py-4">
          <div className="text-[12px] text-muted-foreground">
            {selectedImages.length} selected
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg bg-foreground px-4 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductImagePreview({
  image,
  onClose,
}: {
  image: ProductImage | null
  onClose: () => void
}) {
  if (!image) return null

  return (
    <div className="fixed inset-0 z-[55] grid place-items-center bg-background/85 p-4 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-surface shadow-pop sm:mx-auto">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-muted px-4 py-3">
          <div className="truncate text-[13.5px] font-semibold">{image.name ?? "Product image"}</div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Close image preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid max-h-[75vh] place-items-center bg-surface-muted p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.name ?? "Product image"} className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-card" />
        </div>
      </div>
    </div>
  )
}

function validateImageFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return `Only ${ALLOWED_EXTENSIONS.join(", ")} files are allowed.`
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return "Unsupported image type."
  }

  if (file.size > MAX_FILE_SIZE) {
    return `Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`
  }

  return null
}

function uploadProductImage(
  file: File,
  mediaName: string,
  onProgress: (progress: number) => void,
) {
  return new Promise<{
    id: string
    original_filename: string | null
    secure_url: string
  }>((resolve, reject) => {
    const request = new XMLHttpRequest()
    const form = new FormData()

    form.append("file", file)
    form.append("mediaName", mediaName.trim() || file.name)
    form.append("purpose", "product")
    onProgress(1)

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.max(1, Math.min(95, Math.round((event.loaded / event.total) * 95))))
      }
    }
    request.onerror = () => reject(new Error("Upload failed."))
    request.onload = () => {
      let json: {
        success: boolean
        data?: { id: string; original_filename: string | null; secure_url: string }
        error?: { message: string }
      }

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

function getRemainingTrashDays(deletedAt?: string | null): string {
  if (!deletedAt) return "—"
  const deletedTime = new Date(deletedAt).getTime()
  const now = Date.now()
  const daysPassed = Math.floor((now - deletedTime) / (1000 * 60 * 60 * 24))
  const remaining = Math.max(0, 60 - daysPassed)
  if (remaining === 0) return "Purges today"
  return `Purges in ${remaining} day${remaining === 1 ? "" : "s"}`
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDateTime(value?: string) {
  if (!value) return "—"

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-60",
        checked ? "bg-[#FF5A20]" : "bg-neutral-200",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  )
}


