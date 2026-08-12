"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Lock,
  Package,
  Search,
  ShieldCheck,
  Upload,
  X,
  FileText,
  Clock,
  Calendar,
  Layers,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ImageIcon,
} from "lucide-react"
import { OryCMSDatePicker } from "@/components/orycms/custom-datepicker"
import { OryCMSSelect } from "@/components/orycms/custom-select"
import { RichTextEditor } from "@/components/orycms/rich-text-editor"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { MediaPickerDialog } from "@/components/orycms/products-admin"
import { cn } from "@/lib/utils"

type ProductImage = { id?: string; name?: string; url: string }
type PackSize = {
  price: number
  mrp: number
  salePrice: number
  verifyMrp?: number | string | null
  sku?: string
  batchNumber?: string
  stockQuantity: number
  isDefault?: boolean
  verifySlug?: string
  isVerified?: boolean
  usp?: number | string | null
  size: string
}

function getProductVerificationStatus(product: { uin?: string | null; packSizes?: { verifySlug?: string | null }[] }): "verified" | "partially_completed" | "pending" {
  const uin = String(product.uin || "").trim()
  const items = Array.isArray(product.packSizes) ? product.packSizes : []
  const totalCount = items.length
  const verifiedCount = items.filter((p: { verifySlug?: string | null }) => Boolean(p.verifySlug)).length

  if (Boolean(uin) && totalCount > 0 && verifiedCount === totalCount) {
    return "verified"
  }
  if (Boolean(uin) && verifiedCount > 0 && verifiedCount < totalCount) {
    return "partially_completed"
  }
  return "pending"
}

type Product = {
  id: string
  name: string
  brand: string | null
  category: string
  uin: string | null
  status: string
  packSizes: PackSize[]
  verifyDescription: string
  verifyImage: ProductImage | null
  mfgDate: string
  expiryDate: string
  packTiming: string
  packDate: string
  supervisorName: string
  contractorName: string
  literature: string
  msds: string
  license: string
  cir: string
  eprNumber: string
  plasticCategory: string
  leafletInfo: string
}

type Toast = { message: string; tone: "success" | "error" | "info" }

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"])

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const VERIFICATION_PAGE_SIZE = 10

export function OryCMSVerificationList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "partially_completed" | "pending">("all")
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [page, setPage] = useState(1)

  function showToast(message: string, tone: Toast["tone"] = "success") {
    setToast({ message, tone })
  }

  const loadProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/orycms/verification")
      const json = await response.json()
      if (json.success) {
        setProducts(json.data)
      } else {
        showToast(json.error?.message || "Failed to load products.", "error")
      }
    } catch {
      showToast("Network error while loading products.", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const uin = String(product.uin || "").trim()
      const status = getProductVerificationStatus(product)

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "verified" && status === "verified") ||
        (statusFilter === "partially_completed" && status === "partially_completed") ||
        (statusFilter === "pending" && status === "pending")

      const matchesQuery =
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        String(product.brand || "").toLowerCase().includes(query.toLowerCase()) ||
        uin.toLowerCase().includes(query.toLowerCase())

      return matchesStatus && matchesQuery
    })
  }, [products, query, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / VERIFICATION_PAGE_SIZE))
  const pagedProducts = filteredProducts.slice((page - 1) * VERIFICATION_PAGE_SIZE, page * VERIFICATION_PAGE_SIZE)

  const stats = useMemo(() => {
    let verifiedCount = 0
    let partialCount = 0
    let pendingCount = 0

    products.forEach((product) => {
      const status = getProductVerificationStatus(product)
      if (status === "verified") verifiedCount++
      else if (status === "partially_completed") partialCount++
      else pendingCount++
    })

    return { total: products.length, verified: verifiedCount, partial: partialCount, pending: pendingCount }
  }, [products])

  if (selectedProduct) {
    return (
      <OryCMSVerificationForm
        id={selectedProduct}
        onBack={() => {
          setSelectedProduct(null)
          void loadProducts()
        }}
      />
    )
  }

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      {/* Header */}
      <div>
        <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/verification", label: "Product Verification" }]} />
        <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-foreground">Product Verification</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
          Generate secure unique identification numbers (UINs) and manage QR verifications for Adhunik products.
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-4 shadow-2xs hover:shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-semibold tracking-wide uppercase">Total Catalog Items</span>
            <Package className="h-4.5 w-4.5 text-muted-foreground/80" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{stats.total}</div>
        </div>

        <div className="rounded-xl border border-border bg-white p-4 shadow-2xs hover:shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-semibold tracking-wide uppercase text-emerald-600">Fully Verified</span>
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{stats.verified}</div>
        </div>

        <div className="rounded-xl border border-border bg-white p-4 shadow-2xs hover:shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-semibold tracking-wide uppercase text-amber-600">Partially Completed</span>
            <Clock className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{stats.partial}</div>
        </div>

        <div className="rounded-xl border border-border bg-white p-4 shadow-2xs hover:shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-semibold tracking-wide uppercase text-[var(--orycms-orange)]">Pending Config</span>
            <AlertCircle className="h-4.5 w-4.5 text-[var(--orycms-orange)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--orycms-orange)] mt-2">{stats.pending}</div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-2xs md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products by catalog name, UIN..."
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-4 text-[13px] outline-none transition duration-200 focus:border-border-strong focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-100 p-1 rounded-lg">
          {(["all", "verified", "partially_completed", "pending"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={cn(
                "h-8 rounded-md px-4 text-[12px] font-semibold transition-all duration-200 cursor-pointer select-none",
                statusFilter === filter
                  ? "bg-white text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {filter === "all"
                ? "All Products"
                : filter === "verified"
                ? "Verified Only"
                : filter === "partially_completed"
                ? "Partially Completed"
                : "Pending Only"}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-border bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2.5 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--orycms-orange)]" />
            <span className="text-[12.5px] font-semibold">Retrieving product logs...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Package className="h-10 w-10 text-muted-foreground/45" />
            <span className="text-[13px] font-bold text-foreground">No records match your filters</span>
            <span className="text-[11.5px] text-muted-foreground">Try clearing search text or choosing another status category.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px] border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-neutral-50/50 font-bold text-muted-foreground select-none">
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">Brand</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">UIN Code</th>
                  <th className="px-6 py-3.5">Verification Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pagedProducts.map((product) => {
                  const uin = String(product.uin || "").trim()
                  const items = Array.isArray(product.packSizes) ? product.packSizes : []
                  const verifiedCount = items.filter((p: { verifySlug?: string }) => Boolean(p.verifySlug)).length
                  const status = getProductVerificationStatus(product)

                  return (
                    <tr key={product.id} className="hover:bg-neutral-50/25 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground max-w-xs truncate">{product.name}</td>
                      <td className="px-6 py-4 text-muted-foreground font-medium">{product.brand?.trim() || "N/A"}</td>
                      <td className="px-6 py-4">
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-[11.5px] tracking-wide text-foreground">
                        {uin ? (
                          <span className="flex items-center gap-1.5">
                            <span className={cn("h-1.5 w-1.5 rounded-full", status === "verified" ? "bg-emerald-500" : "bg-amber-500")} />
                            {uin}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-sans font-normal italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border",
                            status === "verified"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/25"
                              : status === "partially_completed"
                              ? "bg-amber-500/10 text-amber-700 border-amber-500/25"
                              : "bg-[#FF5A20]/10 text-[#FF5A20] border-[#FF5A20]/25"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1 w-1 rounded-full",
                              status === "verified"
                                ? "bg-emerald-600"
                                : status === "partially_completed"
                                ? "bg-amber-600"
                                : "bg-[#FF5A20]"
                            )}
                          />
                          {status === "verified"
                            ? "Verified"
                            : status === "partially_completed"
                            ? `Partially Completed (${verifiedCount}/${items.length})`
                            : "Pending Setup"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(product.id)}
                          className="h-8.5 rounded-lg bg-foreground text-background hover:!bg-[#FF5A20] hover:!text-white font-bold transition-all px-4 text-[12px] shadow-xs cursor-pointer select-none"
                        >
                          Manage Verification
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-muted px-4 py-3">
              <div className="text-[12px] text-muted-foreground">
                Page {page} of {pageCount}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2 text-[12px] disabled:opacity-50 cursor-pointer select-none"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  disabled={page === pageCount}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2 text-[12px] disabled:opacity-50 cursor-pointer select-none"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ProductToast toast={toast} />
    </section>
  )
}

function OryCMSVerificationForm({ id, onBack }: { id: string; onBack: () => void }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [initialProductStr, setInitialProductStr] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [verifyUploadProgress, setVerifyUploadProgress] = useState<number | null>(null)
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [metaMedia, setMetaMedia] = useState<{ id?: string; name?: string; url: string }[]>([])
  const verifyFileInputRef = useRef<HTMLInputElement>(null)
  const origin = typeof window !== "undefined" ? window.location.origin : ""

  const [initialLocks, setInitialLocks] = useState({
    license: false,
    cir: false,
    literature: false,
    msds: false,
  })

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const hasChanges = useMemo(() => {
    if (!product || initialProductStr === null) return false
    return JSON.stringify(product) !== initialProductStr
  }, [product, initialProductStr])

  function showToast(message: string, tone: Toast["tone"] = "success") {
    setToast({ message, tone })
  }

  const loadProduct = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/orycms/verification/${id}`)
      const json = await response.json()
      if (json.success) {
        const prod = json.data
        const mapped: Product = {
          id: prod.id,
          name: prod.name,
          brand: prod.brand,
          category: prod.category,
          uin: prod.uin,
          status: prod.status,
          packSizes: (prod.packSizes || []).map((p: PackSize) => ({
            ...p,
            isVerified: typeof p.isVerified === "boolean" ? p.isVerified : Boolean(p.verifySlug),
            usp: p.usp !== undefined && p.usp !== null ? p.usp : (p.salePrice !== undefined && p.salePrice !== null ? p.salePrice : ""),
          })),
          verifyDescription: prod.verifyDescription || "",
          verifyImage: prod.verifyImage || null,
          mfgDate: prod.mfgDate || "",
          expiryDate: prod.expiryDate || "",
          packTiming: prod.packTiming || "",
          packDate: prod.packDate || "",
          supervisorName: prod.supervisorName || "",
          contractorName: prod.contractorName || "",
          literature: prod.literature || "",
          msds: prod.msds || "",
          license: prod.license || "",
          cir: prod.cir || "",
          eprNumber: prod.eprNumber || "",
          plasticCategory: prod.plasticCategory || "",
          leafletInfo: prod.leafletInfo || "",
        }

        setProduct(mapped)
        setInitialProductStr(JSON.stringify(mapped))
        setAttemptedSubmit(false)
        setInitialLocks({
          license: Boolean(prod.license?.trim()),
          cir: Boolean(prod.cir?.trim()),
          literature: Boolean(prod.literature?.trim()),
          msds: Boolean(prod.msds?.trim()),
        })
      } else {
        showToast(json.error?.message || "Failed to load product details.", "error")
      }
    } catch {
      showToast("Network error while loading product.", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProduct()
    fetch("/api/orycms/products/meta")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data?.media)) {
          setMetaMedia(json.data.media)
        }
      })
      .catch(() => undefined)
  }, [id])

  const parsedTime = useMemo(() => {
    if (!product || !product.packTiming) return { hour: "", minute: "", period: "AM" }
    const match = product.packTiming.match(/^(\d{2}|XX|\s*):(\d{2}|XX|\s*)\s*(AM|PM)$/i)
    if (match) {
      return {
        hour: match[1] === "XX" || !match[1].trim() ? "" : match[1],
        minute: match[2] === "XX" || !match[2].trim() ? "" : match[2],
        period: match[3] ? match[3].toUpperCase() : "AM",
      }
    }
    return { hour: "", minute: "", period: "AM" }
  }, [product?.packTiming])

  const updatePackTiming = (key: "hour" | "minute" | "period", val: string) => {
    if (!product) return
    const hour = key === "hour" ? val : (parsedTime.hour || "")
    const minute = key === "minute" ? val : (parsedTime.minute || "")
    const period = key === "period" ? val : (parsedTime.period || "AM")

    if (!hour && !minute) {
      patch({ packTiming: "" })
    } else {
      patch({ packTiming: `${hour || "XX"}:${minute || "XX"} ${period}` })
    }
  }

  const patch = (fields: Partial<Product>) => {
    setProduct((current) => (current ? { ...current, ...fields } : null))
    setAttemptedSubmit(false)
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      showToast("Verification link copied to clipboard!", "success")
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      showToast("Failed to copy link.", "error")
    }
  }

  async function uploadVerifyImage(file?: File) {
    if (!file || !product) return
    if (product.verifyImage) {
      showToast("Only one verification image can be selected. Please remove the existing image first.", "error")
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast(`File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`, "error")
      return
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      showToast("File format not supported. Please upload JPG, PNG, or WEBP.", "error")
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
    } catch {
      showToast("Unable to verify image dimensions.", "error")
      return
    }

    try {
      setVerifyUploadProgress(1)
      const form = new FormData()
      form.append("file", file)
      form.append("mediaName", file.name)
      form.append("purpose", "product")

      const request = new XMLHttpRequest()
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setVerifyUploadProgress(Math.max(1, Math.min(95, Math.round((event.loaded / event.total) * 95))))
        }
      }

      const asset = await new Promise<{ url?: string; id?: string; name?: string; secure_url?: string; original_filename?: string }>((resolve, reject) => {
        request.onerror = () => reject(new Error("Upload failed."))
        request.onload = () => {
          try {
            const json = JSON.parse(request.responseText)
            if (request.status >= 200 && request.status < 300 && json.success && json.data) {
              resolve(json.data)
            } else {
              reject(new Error(json.error?.message || "Upload failed."))
            }
          } catch {
            reject(new Error("Upload failed."))
          }
        }
        request.open("POST", "/api/orycms/media")
        request.send(form)
      })

      setProduct((current) => current ? ({
        ...current,
        verifyImage: {
          id: asset.id,
          name: asset.name || asset.original_filename || file.name,
          url: asset.url || asset.secure_url || "",
        }
      }) : null)
      showToast("Verification image uploaded successfully.", "success")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Upload failed.", "error")
    } finally {
      setVerifyUploadProgress(null)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setAttemptedSubmit(true)

    if (!product.uin?.trim()) {
      showToast("UIN (Unique Identification Number) is mandatory.", "error")
      return
    }

    const checkedPacks = product.packSizes.filter((p) => p.isVerified)
    if (checkedPacks.length === 0) {
      showToast("At least one pack size must be selected for verification.", "error")
      return
    }

    for (const pack of product.packSizes) {
      if (pack.isVerified) {
        if (!pack.sku?.trim()) {
          showToast(`SKU Number is required for pack size "${pack.size}".`, "error")
          return
        }
        if (!pack.batchNumber?.trim()) {
          showToast(`Batch Number is required for pack size "${pack.size}".`, "error")
          return
        }
        if (pack.verifyMrp === undefined || pack.verifyMrp === null || pack.verifyMrp === "" || Number(pack.verifyMrp) <= 0) {
          showToast(`Verification MRP is required for pack size "${pack.size}".`, "error")
          return
        }
        if (pack.usp === undefined || pack.usp === null || pack.usp === "" || Number(pack.usp) <= 0) {
          showToast(`USP (Unit Sale Price) is required for pack size "${pack.size}".`, "error")
          return
        }
      }
    }



    const hasHour = Boolean(parsedTime.hour)
    const hasMinute = Boolean(parsedTime.minute)
    if ((hasHour && !hasMinute) || (!hasHour && hasMinute)) {
      showToast("Please select both Hour (HH) and Minute (MM) for Pack Time Slot, or leave both unselected.", "error")
      return
    }

    if (!product.verifyImage?.url) {
      showToast("Verification product image (1200×1200 px) is required.", "error")
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...product,
        isVerificationUpdate: true,
      }
      const response = await fetch(`/api/orycms/verification/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await response.json()
      if (json.success) {
        showToast("Product verification details saved successfully.", "success")
        setInitialProductStr(JSON.stringify(product))
        void loadProduct()
      } else {
        showToast(json.error?.message || "Failed to save verification details.", "error")
      }
    } catch {
      showToast("Network error while saving details.", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--orycms-orange)]" />
        <span className="text-[13px] font-semibold">Retrieving configuration details...</span>
      </div>
    )
  }

  if (!product) return null

  const verificationStatus = getProductVerificationStatus(product)
  const verifiedPacksCount = product.packSizes.filter((p) => Boolean(p.verifySlug || p.isVerified)).length

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-8 pb-10">
      <form onSubmit={handleSave} noValidate className="space-y-6 max-w-4xl mx-auto">
      {/* Header Back Link */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-neutral-50 hover:text-foreground transition-all cursor-pointer shadow-2xs select-none mt-1.5"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div>
          <OryCMSBreadcrumbs items={[
            { href: "/admin", label: "Overview" },
            { href: "/admin/verification", label: "Product Verification" },
            { href: "", label: "Configure Details" }
          ]} />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-foreground font-bold">Configure Verification Logs</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
            Link manufacturing barcodes, generate digital UIN codes, and lock regulatory records.
          </p>
        </div>
      </div>

      {/* Banner / Catalog Overview */}
      <div className="rounded-xl border border-border bg-neutral-50/50 p-5 shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-neutral-100 rounded-full filter blur-xl -mr-8 -mt-8 opacity-40" />
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Selected Catalog Item</span>
            <h2 className="text-lg font-bold text-foreground">{product.name}</h2>
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
              <span>Brand: <strong className="text-foreground">{product.brand?.trim() || "N/A"}</strong></span>
              <span>•</span>
              <span>Category: <strong className="text-foreground">{product.category}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border",
                verificationStatus === "verified"
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                  : verificationStatus === "partially_completed"
                  ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                  : "bg-[#FF5A20]/10 text-[#FF5A20] border-[#FF5A20]/20"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  verificationStatus === "verified" ? "bg-emerald-600" : verificationStatus === "partially_completed" ? "bg-amber-600" : "bg-[#FF5A20]"
                )}
              />
              {verificationStatus === "verified"
                ? "Active & Fully Verified"
                : verificationStatus === "partially_completed"
                ? `Partially Completed (${verifiedPacksCount}/${product.packSizes.length} Packs)`
                : "Verification Pending"}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-200/60 grid gap-4 sm:grid-cols-2 text-[12.5px]">
          <div>
            <span className="text-muted-foreground font-semibold">Unique Identification Number (UIN)*</span>
            {initialProductStr && JSON.parse(initialProductStr).uin ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="font-mono font-bold text-foreground bg-white border border-border px-3 py-1.5 rounded-lg select-all text-[13px] flex-1">
                  {product.uin}
                </div>
                <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md shrink-0 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              </div>
            ) : (
              <div className="mt-1">
                <input
                  type="text"
                  value={product.uin || ""}
                  onChange={(e) => patch({ uin: e.target.value })}
                  placeholder="e.g. ACC-PROD-1001"
                  className={cn(
                    "h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] font-mono font-bold text-foreground outline-none transition duration-200 focus:border-border-strong",
                    attemptedSubmit && !product.uin?.trim() && "border-destructive bg-red-50/20 text-destructive"
                  )}
                />
                {attemptedSubmit && !product.uin?.trim() && (
                  <span className="text-[11px] font-medium text-destructive mt-0.5 block">UIN number is mandatory and cannot be changed once set.</span>
                )}
              </div>
            )}
          </div>
          <div>
            <span className="text-muted-foreground font-semibold">Active Pack Sizes</span>
            <div className="font-semibold text-foreground mt-1 text-[13px]">{product.packSizes.length} units listed</div>
          </div>
        </div>
      </div>

      {/* 1. Pack Sizes required properties */}
      <Card title="Pack Sizes Specific Setup" icon={<Package className="h-4.5 w-4.5 text-[var(--orycms-orange)]" />}>
        <p className="text-[12px] text-muted-foreground">
          Input distinct SKUs, manufacturing batches, Verification MRP, and USP for each pack size. These fields are legally validated to confirm product authenticity.
        </p>

        <div className="grid gap-4">
          {product.packSizes.map((pack, index) => (
            <div key={index} className="rounded-xl border border-border bg-white p-4 shadow-2xs hover:border-neutral-300 transition-all duration-200">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(pack.isVerified)}
                    onChange={(e) => {
                      const checked = e.target.checked
                      patch({
                        packSizes: product.packSizes.map((item, idx) =>
                          idx === index ? { ...item, isVerified: checked } : item
                        ),
                      })
                    }}
                    className="h-4 w-4 rounded border-border text-[var(--orycms-orange)] focus:ring-0 cursor-pointer accent-[#FF5A20]"
                  />
                  <span className="inline-grid h-5 w-5 place-items-center rounded bg-[#FF5A20]/10 text-[11px] font-bold text-[#FF5A20] shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-[12.5px] font-bold text-foreground">
                    Verify pack size: <strong className="text-[var(--orycms-orange)] font-bold text-[13px]">{pack.size}</strong>
                  </span>
                  {pack.isDefault && (
                    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 border border-neutral-200/50">
                      Storefront Default
                    </span>
                  )}
                </label>
                <span className="text-[11.5px] font-semibold text-muted-foreground whitespace-nowrap">
                  Listing MRP: ₹{Number(pack.mrp).toFixed(2)}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-4 mt-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-[12px] font-semibold text-foreground">
                    SKU Number{pack.isVerified ? "*" : ""}
                  </span>
                  <input
                    type="text"
                    disabled={!pack.isVerified}
                    value={pack.sku || ""}
                    onChange={(e) => {
                      const val = e.target.value
                      patch({
                        packSizes: product.packSizes.map((item, idx) =>
                          idx === index ? { ...item, sku: val } : item
                        ),
                      })
                    }}
                    placeholder={pack.isVerified ? "e.g. ACC-PROD-1KG" : "Enable checkbox to edit"}
                    className={cn(
                      "h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none transition duration-200 focus:border-border-strong focus:bg-white",
                      !pack.isVerified && "bg-neutral-50 text-muted-foreground/75 cursor-not-allowed border-neutral-200 font-medium",
                      pack.isVerified && attemptedSubmit && !pack.sku?.trim() && "border-destructive/60 bg-red-50/20 text-destructive focus:border-destructive"
                    )}
                  />
                  {pack.isVerified && attemptedSubmit && !pack.sku?.trim() && (
                    <span className="text-[11px] font-medium text-destructive">SKU Number is required.</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <span className="text-[12px] font-semibold text-foreground">
                    Batch Number{pack.isVerified ? "*" : ""}
                  </span>
                  <input
                    type="text"
                    disabled={!pack.isVerified}
                    value={pack.batchNumber || ""}
                    onChange={(e) => {
                      const val = e.target.value
                      patch({
                        packSizes: product.packSizes.map((item, idx) =>
                          idx === index ? { ...item, batchNumber: val } : item
                        ),
                      })
                    }}
                    placeholder={pack.isVerified ? "e.g. BATCH-001" : "Enable checkbox to edit"}
                    className={cn(
                      "h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none transition duration-200 focus:border-border-strong focus:bg-white",
                      !pack.isVerified && "bg-neutral-50 text-muted-foreground/75 cursor-not-allowed border-neutral-200 font-medium",
                      pack.isVerified && attemptedSubmit && !pack.batchNumber?.trim() && "border-destructive/60 bg-red-50/20 text-destructive focus:border-destructive"
                    )}
                  />
                  {pack.isVerified && attemptedSubmit && !pack.batchNumber?.trim() && (
                    <span className="text-[11px] font-medium text-destructive">Batch Number is required.</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <span className="text-[12px] font-semibold text-foreground">
                    Verification MRP (₹){pack.isVerified ? "*" : ""}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    disabled={!pack.isVerified}
                    value={pack.verifyMrp !== undefined && pack.verifyMrp !== null ? pack.verifyMrp : pack.mrp || ""}
                    onChange={(e) => {
                      const val = e.target.value
                      patch({
                        packSizes: product.packSizes.map((item, idx) =>
                          idx === index ? { ...item, verifyMrp: val } : item
                        ),
                      })
                    }}
                    placeholder={pack.isVerified ? "e.g. 500.00" : "Enable checkbox to edit"}
                    className={cn(
                      "h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none transition duration-200 focus:border-border-strong focus:bg-white",
                      !pack.isVerified && "bg-neutral-50 text-muted-foreground/75 cursor-not-allowed border-neutral-200 font-medium",
                      pack.isVerified && attemptedSubmit && (pack.verifyMrp === undefined || pack.verifyMrp === null || pack.verifyMrp === "" || Number(pack.verifyMrp) <= 0) && "border-destructive/60 bg-red-50/20 text-destructive focus:border-destructive"
                    )}
                  />
                  {pack.isVerified && attemptedSubmit && (pack.verifyMrp === undefined || pack.verifyMrp === null || pack.verifyMrp === "" || Number(pack.verifyMrp) <= 0) && (
                    <span className="text-[11px] font-medium text-destructive">Verification MRP is required.</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <span className="text-[12px] font-semibold text-foreground">
                    USP (Unit Sale Price) (₹){pack.isVerified ? "*" : ""}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    disabled={!pack.isVerified}
                    value={pack.usp !== undefined && pack.usp !== null ? pack.usp : ""}
                    onChange={(e) => {
                      const val = e.target.value
                      patch({
                        packSizes: product.packSizes.map((item, idx) =>
                          idx === index ? { ...item, usp: val } : item
                        ),
                      })
                    }}
                    placeholder={pack.isVerified ? "e.g. 199.00" : "Enable checkbox to edit"}
                    className={cn(
                      "h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none transition duration-200 focus:border-border-strong focus:bg-white",
                      !pack.isVerified && "bg-neutral-50 text-muted-foreground/75 cursor-not-allowed border-neutral-200 font-medium",
                      pack.isVerified && attemptedSubmit && (pack.usp === undefined || pack.usp === null || pack.usp === "" || Number(pack.usp) <= 0) && "border-destructive/60 bg-red-50/20 text-destructive focus:border-destructive"
                    )}
                  />
                  {pack.isVerified && attemptedSubmit && (pack.usp === undefined || pack.usp === null || pack.usp === "" || Number(pack.usp) <= 0) && (
                    <span className="text-[11px] font-medium text-destructive">USP is required.</span>
                  )}
                </div>
              </div>

              {/* QR and Verify Links Block */}
              {Boolean(pack.verifySlug) && (
                <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="relative h-20 w-20 shrink-0 border border-border bg-white rounded-lg p-1.5 flex items-center justify-center shadow-3xs group">
                    <img
                      src={`/api/verify/product/${pack.verifySlug}/qr`}
                      alt="Verify QR"
                      className="h-full w-full object-contain"
                    />
                    <a
                      href={`/api/verify/product/${pack.verifySlug}/qr`}
                      download={`qr-${pack.verifySlug}.png`}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity duration-200 text-white cursor-pointer"
                      title="Download QR Code"
                    >
                      <Download className="h-4.5 w-4.5" />
                    </a>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1 text-[12px]">
                    <div className="font-bold text-foreground flex items-center gap-1.5 flex-wrap">
                      <ShieldCheck className={cn("h-4 w-4", pack.isVerified ? "text-emerald-600" : "text-amber-600")} />
                      <span>{pack.isVerified ? "Verification Active" : "Previous Verification Link"}</span>
                      {!pack.isVerified && (
                        <span className="rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[10.5px] font-semibold text-amber-800 border border-amber-200/80">
                          Inactive (Previous Verification)
                        </span>
                      )}
                    </div>
                    <div className="text-[11.5px] text-muted-foreground select-all break-all">
                      Verification link: <span className="font-mono text-foreground font-medium">{origin}/verify/product/{pack.verifySlug}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1.5">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`${origin}/verify/product/${pack.verifySlug}`, index)}
                        className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 text-[11px] font-semibold text-foreground hover:bg-neutral-100 transition-colors cursor-pointer select-none"
                      >
                        {copiedIndex === index ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        {copiedIndex === index ? "Copied!" : "Copy Link"}
                      </button>
                      <a
                        href={`/verify/product/${pack.verifySlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 text-[11px] font-semibold text-foreground hover:bg-neutral-100 transition-colors cursor-pointer select-none"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open Verification Portal
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 2. Packaging & QC logs */}
      <Card title="Packaging & Quality Control Logs" icon={<ClipboardCheck className="h-4.5 w-4.5 text-[var(--orycms-orange)]" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Supervisor Name" icon={<Check className="h-3.5 w-3.5 text-muted-foreground/60" />} value={product.supervisorName} onChange={(supervisorName) => patch({ supervisorName })} placeholder="e.g. Puneet Yadav" />
          <Field label="Contractor / Packaging Agency" icon={<Layers className="h-3.5 w-3.5 text-muted-foreground/60" />} value={product.contractorName} onChange={(contractorName) => patch({ contractorName })} placeholder="e.g. Oryntic Labs" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col space-y-1.5">
            <span className="text-[12px] font-semibold text-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
              Pack Time Slot
            </span>
            <div className="flex items-center gap-1.5">
              <OryCMSSelect
                value={parsedTime.hour}
                onChange={(val) => updatePackTiming("hour", val)}
                options={[
                  { label: "HH", value: "" },
                  ...Array.from({ length: 12 }, (_, i) => {
                    const val = String(i + 1).padStart(2, "0")
                    return { label: val, value: val }
                  }),
                ]}
                className="w-20 animate-none font-medium"
              />
              <span className="text-[13px] font-bold text-muted-foreground select-none">:</span>
              <OryCMSSelect
                value={parsedTime.minute}
                onChange={(val) => updatePackTiming("minute", val)}
                options={[
                  { label: "MM", value: "" },
                  ...Array.from({ length: 60 }, (_, i) => {
                    const val = String(i).padStart(2, "0")
                    return { label: val, value: val }
                  }),
                ]}
                className="w-20 animate-none font-medium"
              />
              <OryCMSSelect
                value={parsedTime.period || "AM"}
                onChange={(val) => updatePackTiming("period", val)}
                options={["AM", "PM"]}
                className="w-24 font-bold animate-none"
              />
            </div>
          </div>
          <OryCMSDatePicker
            label="Pack Date"
            value={product.packDate ? product.packDate.slice(0, 10) : ""}
            onChange={(packDate) => patch({ packDate })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <OryCMSDatePicker
            label="Manufacturing (MFG) Date"
            value={product.mfgDate ? product.mfgDate.slice(0, 10) : ""}
            onChange={(mfgDate) => patch({ mfgDate })}
          />
          <OryCMSDatePicker
            label="Expiry Date"
            value={product.expiryDate ? product.expiryDate.slice(0, 10) : ""}
            onChange={(expiryDate) => patch({ expiryDate })}
          />
        </div>
      </Card>

      {/* 3. Regulatory & Compliance */}
      <Card title="Regulatory & Compliance Records" icon={<ShieldCheck className="h-4.5 w-4.5 text-[var(--orycms-orange)]" />}>
        {/* Compliance Locks warning */}
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 flex gap-2.5 text-[12px] text-amber-800">
          <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Lifetime Compliance Lock:</strong> Compliance fields (License Number, CIR Registration, Literature PDF, and MSDS PDF) remain editable until assigned. Once any field is set with a value, it becomes permanently locked and cannot be changed.
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Manufacturing License Number"
            value={product.license}
            onChange={(license) => patch({ license })}
            placeholder="e.g. LIC-12345"
            disabled={initialLocks.license}
            lock={initialLocks.license}
          />
          <Field
            label="CIR Registration Number"
            value={product.cir}
            onChange={(cir) => patch({ cir })}
            placeholder="e.g. CIR-67890"
            disabled={initialLocks.cir}
            lock={initialLocks.cir}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="EPR Registration Number"
            value={product.eprNumber}
            onChange={(eprNumber) => patch({ eprNumber })}
            placeholder="e.g. EPR-54321"
          />
          <Field
            label="Plastic Packaging Category"
            value={product.plasticCategory}
            onChange={(plasticCategory) => patch({ plasticCategory })}
            placeholder="e.g. Category III"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Product Technical Literature PDF URL"
            value={product.literature}
            onChange={(literature) => patch({ literature })}
            placeholder="e.g. https://domain.com/docs/literature.pdf"
            disabled={initialLocks.literature}
            lock={initialLocks.literature}
          />
          <Field
            label="MSDS (Safety Datasheet) PDF URL"
            value={product.msds}
            onChange={(msds) => patch({ msds })}
            placeholder="e.g. https://domain.com/docs/msds.pdf"
            disabled={initialLocks.msds}
            lock={initialLocks.msds}
          />
        </div>
      </Card>

      {/* 4. Leaflet & Usage */}
      <Card title="Usage Literature & Leaflets" icon={<FileText className="h-4.5 w-4.5 text-[var(--orycms-orange)]" />}>
        <div className="flex flex-col space-y-1.5">
          <span className="text-[12px] font-semibold text-foreground">Usage Leaflet Information</span>
          <p className="text-[11.5px] text-muted-foreground">Standard application dosage guidelines and safety protocols displayed on the verification portal.</p>
          <RichTextEditor
            value={product.leafletInfo || ""}
            onChange={(leafletInfo) => patch({ leafletInfo })}
            placeholder="Dosage, crops covered, and usage directives."
          />
        </div>

        <div className="flex flex-col space-y-1.5 pt-2 border-t border-neutral-100">
          <span className="text-[12px] font-semibold text-foreground">Portal Custom Description</span>
          <p className="text-[11.5px] text-muted-foreground">Optional unique description displayed under the verified banner (hidden from normal catalog page).</p>
          <RichTextEditor
            value={product.verifyDescription || ""}
            onChange={(verifyDescription) => patch({ verifyDescription })}
            placeholder="Special batch notes or quality control authenticity statements."
          />
        </div>

        {/* Verification Image section */}
        <div className="flex flex-col space-y-2 pt-4 border-t border-neutral-100">
          <span className="text-[12px] font-semibold text-foreground">Verification Portal Product Image* (Strict 1200 x 1200 px)</span>
          
          <input
            ref={verifyFileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              void uploadVerifyImage(event.target.files?.[0])
              event.target.value = ""
            }}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (product.verifyImage) {
                  showToast("Only one verification image can be selected. Please remove the existing image first.", "error")
                  return
                }
                verifyFileInputRef.current?.click()
              }}
              disabled={verifyUploadProgress !== null}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground text-background hover:!bg-[#FF5A20] hover:!text-white font-bold transition-all shadow-xs px-4 text-[12.5px] cursor-pointer disabled:opacity-60 select-none"
            >
              {verifyUploadProgress !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {verifyUploadProgress !== null ? `Uploading ${verifyUploadProgress}%` : "Upload Portal Image (1200×1200)"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (product.verifyImage) {
                  showToast("Only one verification image can be selected. Please remove the existing image first.", "error")
                  return
                }
                setMediaPickerOpen(true)
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-white text-foreground hover:!bg-foreground hover:!text-white font-semibold transition-all shadow-xs px-4 text-[12.5px] cursor-pointer select-none"
            >
              <ImageIcon className="h-4 w-4" />
              Media Center
            </button>
          </div>

          {product.verifyImage?.url ? (
            <div className="relative mt-2 h-40 w-40 overflow-hidden rounded-xl border border-border bg-white shadow-2xs hover:shadow-xs transition-shadow duration-200 p-2">
              <img src={product.verifyImage.url} alt="Verification" className="h-full w-full object-contain rounded-lg" />
              <button
                type="button"
                onClick={() => patch({ verifyImage: null })}
                className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-destructive text-white hover:bg-destructive-dark transition-all cursor-pointer shadow-sm select-none"
                title="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-[11.5px] text-muted-foreground flex items-center gap-1 select-none">
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/80" />
              No custom portal image assigned yet. Upload a 1200 × 1200 px image before saving.
            </p>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-5 select-none">
        <button
          type="button"
          onClick={onBack}
          className="h-10 rounded-lg border border-border bg-white text-foreground hover:!bg-foreground hover:!text-white font-bold transition-all shadow-xs px-5 text-[13px] cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !hasChanges}
          className="h-10 rounded-lg bg-foreground text-background hover:!bg-[#FF5A20] hover:!text-white font-bold transition-all shadow-xs px-5 text-[13px] flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:!bg-foreground disabled:hover:!text-background select-none"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? "Publishing Records..." : "Save Verification Details"}
        </button>
      </div>

      <MediaPickerDialog
        images={metaMedia}
        onClose={() => setMediaPickerOpen(false)}
        onToggle={(image) => {
          patch({
            verifyImage: {
              id: image.id,
              name: image.name,
              url: image.url,
            },
          })
          setMediaPickerOpen(false)
        }}
        open={mediaPickerOpen}
        selectedImages={product.verifyImage ? [product.verifyImage] : []}
      />
      <ProductToast toast={toast} />
    </form>
  </div>
  )
}

function Card({ children, title, icon }: { children: React.ReactNode; title: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-2xs hover:shadow-xs transition-shadow duration-200 space-y-4">
      <h3 className="text-[14px] font-bold text-foreground border-b border-neutral-100 pb-2.5 flex items-center gap-2 select-none">
        {icon}
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  onChange,
  placeholder,
  type = "text",
  value,
  disabled = false,
  lock = false,
  icon,
  className,
}: {
  label: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  value: string
  disabled?: boolean
  lock?: boolean
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col space-y-1.5", className)}>
      <span className="text-[12px] font-semibold text-foreground flex items-center gap-1 select-none">
        {icon}
        {label}
        {lock && <Lock className="h-3 w-3 text-amber-600 shrink-0 ml-0.5" />}
      </span>
      <div className="relative">
        <input
          type={type}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none transition duration-200 focus:border-border-strong focus:bg-white",
            disabled && "bg-neutral-50 text-muted-foreground/75 border-neutral-200 cursor-not-allowed pr-8 font-medium"
          )}
        />
        {disabled && (
          <Lock className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400 shrink-0 select-none" />
        )}
      </div>
    </div>
  )
}

function ProductToast({ toast }: { toast: Toast | null }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (toast) {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  if (!toast || !visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-bottom-2 duration-300">
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl border bg-white px-4 py-3 text-[13px] font-semibold shadow-lg",
          toast.tone === "success" && "border-emerald-300 text-emerald-800",
          toast.tone === "error" && "border-red-300 text-red-800",
          toast.tone === "info" && "border-neutral-300 text-neutral-800"
        )}
      >
        {toast.tone === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
        {toast.tone === "error" && <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}
        {toast.tone === "info" && <HelpCircle className="h-4 w-4 text-neutral-600 shrink-0" />}
        <span>{toast.message}</span>
      </div>
    </div>
  )
}
