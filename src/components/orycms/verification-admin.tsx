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
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react"
import { OryCMSDatePicker } from "@/components/orycms/custom-datepicker"
import { OryCMSSelect } from "@/components/orycms/custom-select"
import { RichTextEditor } from "@/components/orycms/rich-text-editor"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { cn } from "@/lib/utils"

type ProductImage = { id?: string; name?: string; url: string }
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

export function OryCMSVerificationList() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending">("all")
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

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
      const items = Array.isArray(product.packSizes) ? product.packSizes : []
      const isVerified = Boolean(uin) && items.length > 0 && items.every((p: any) => p.verifySlug)

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "verified" && isVerified) ||
        (statusFilter === "pending" && !isVerified)

      const matchesQuery =
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        String(product.brand || "").toLowerCase().includes(query.toLowerCase()) ||
        uin.toLowerCase().includes(query.toLowerCase())

      return matchesStatus && matchesQuery
    })
  }, [products, query, statusFilter])

  const stats = useMemo(() => {
    let verifiedCount = 0
    let pendingCount = 0

    products.forEach((product) => {
      const uin = String(product.uin || "").trim()
      const items = Array.isArray(product.packSizes) ? product.packSizes : []
      const isVerified = Boolean(uin) && items.length > 0 && items.every((p: any) => p.verifySlug)
      if (isVerified) verifiedCount++
      else pendingCount++
    })

    return { total: products.length, verified: verifiedCount, pending: pendingCount }
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
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-4 shadow-2xs hover:shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-semibold tracking-wide uppercase">Total Catalog Items</span>
            <Package className="h-4.5 w-4.5 text-muted-foreground/80" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{stats.total}</div>
        </div>

        <div className="rounded-xl border border-border bg-white p-4 shadow-2xs hover:shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-semibold tracking-wide uppercase text-emerald-600">Verified & Active</span>
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{stats.verified}</div>
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
          {(["all", "verified", "pending"] as const).map((filter) => (
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
              {filter === "all" ? "All Products" : filter === "verified" ? "Verified Only" : "Pending Only"}
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
                {filteredProducts.map((product) => {
                  const uin = String(product.uin || "").trim()
                  const items = Array.isArray(product.packSizes) ? product.packSizes : []
                  const isVerified = Boolean(uin) && items.length > 0 && items.every((p: any) => p.verifySlug)

                  return (
                    <tr key={product.id} className="hover:bg-neutral-50/25 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground max-w-xs truncate">{product.name}</td>
                      <td className="px-6 py-4 text-muted-foreground font-medium">{product.brand || "Adhunik"}</td>
                      <td className="px-6 py-4">
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-[11.5px] tracking-wide text-foreground">
                        {uin ? (
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
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
                            isVerified
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/25"
                              : "bg-[#FF5A20]/10 text-[#FF5A20] border-[#FF5A20]/25"
                          )}
                        >
                          <span className={cn("h-1 w-1 rounded-full", isVerified ? "bg-emerald-600" : "bg-[#FF5A20]")} />
                          {isVerified ? "Verified" : "Pending Setup"}
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
  const [toast, setToast] = useState<Toast | null>(null)
  const [verifyUploadProgress, setVerifyUploadProgress] = useState<number | null>(null)
  const verifyFileInputRef = useRef<HTMLInputElement>(null)
  const origin = typeof window !== "undefined" ? window.location.origin : ""

  const [initialLocks, setInitialLocks] = useState({
    license: false,
    cir: false,
    literature: false,
    msds: false,
  })

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

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
          packSizes: prod.packSizes || [],
          verifyDescription: prod.verifyDescription || "",
          verifyImage: prod.verifyImage || null,
          mfgDate: prod.mfgDate || "",
          expiryDate: prod.expiryDate || "",
          packTiming: prod.packTiming || "09:00 AM",
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
        setInitialLocks({
          license: Boolean(prod.license),
          cir: Boolean(prod.cir),
          literature: Boolean(prod.literature),
          msds: Boolean(prod.msds),
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
  }, [id])

  const parsedTime = useMemo(() => {
    if (!product) return { hour: "09", minute: "00", period: "AM" }
    const match = (product.packTiming || "").match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i)
    return {
      hour: match ? match[1] : "09",
      minute: match ? match[2] : "00",
      period: match ? match[3].toUpperCase() : "AM"
    }
  }, [product?.packTiming])

  const updatePackTiming = (key: "hour" | "minute" | "period", val: string) => {
    if (!product) return
    const hour = key === "hour" ? val : parsedTime.hour
    const minute = key === "minute" ? val : parsedTime.minute
    const period = key === "period" ? val : parsedTime.period
    patch({ packTiming: `${hour}:${minute} ${period}` })
  }

  const patch = (fields: Partial<Product>) => {
    setProduct((current) => (current ? { ...current, ...fields } : null))
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

      const asset = await new Promise<any>((resolve, reject) => {
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
          name: asset.original_filename ?? file.name,
          url: asset.secure_url,
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

    for (const pack of product.packSizes) {
      if (!pack.sku?.trim()) {
        showToast(`SKU is required for pack size "${pack.size}".`, "error")
        return
      }
      if (!pack.batchNumber?.trim()) {
        showToast(`Batch Number is required for pack size "${pack.size}".`, "error")
        return
      }
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

  const isFullyConfigured = Boolean(product.uin) && product.packSizes.length > 0 && product.packSizes.every((p) => p.verifySlug)

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-8 pb-10">
      <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto">
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
              <span>Brand: <strong className="text-foreground">{product.brand || "Adhunik"}</strong></span>
              <span>•</span>
              <span>Category: <strong className="text-foreground">{product.category}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border",
                isFullyConfigured
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-700 border-amber-500/20"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", isFullyConfigured ? "bg-emerald-600" : "bg-amber-600")} />
              {isFullyConfigured ? "Active & Verified" : "Verification Pending"}
            </span>
          </div>
        </div>

        {product.uin && (
          <div className="mt-4 pt-4 border-t border-neutral-200/60 grid gap-2 sm:grid-cols-2 text-[12.5px]">
            <div>
              <span className="text-muted-foreground">Unique Identification Number (UIN)</span>
              <div className="font-mono font-bold text-foreground mt-0.5 select-all">{product.uin}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Active Pack Sizes</span>
              <div className="font-semibold text-foreground mt-0.5">{product.packSizes.length} units listed</div>
            </div>
          </div>
        )}
      </div>

      {/* 1. Pack Sizes required properties */}
      <Card title="Pack Sizes Specific Setup" icon={<Package className="h-4.5 w-4.5 text-[var(--orycms-orange)]" />}>
        <p className="text-[12px] text-muted-foreground">
          Input distinct SKUs and manufacturing batches for each pack size. These fields are legally validated to confirm product authenticity.
        </p>

        <div className="grid gap-4">
          {product.packSizes.map((pack, index) => (
            <div key={index} className="rounded-xl border border-border bg-white p-4 shadow-2xs hover:border-neutral-300 transition-all duration-200">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-[12.5px] font-bold text-foreground flex flex-wrap items-center gap-2">
                  <span className="inline-grid h-5 w-5 place-items-center rounded bg-[#FF5A20]/10 text-[11px] font-bold text-[#FF5A20] shrink-0">
                    {index + 1}
                  </span>
                  <span>Pack size: <strong className="text-[var(--orycms-orange)] font-bold text-[13px]">{pack.size}</strong></span>
                  {pack.isDefault && (
                    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 border border-neutral-200/50">
                      Storefront Default
                    </span>
                  )}
                </span>
                <span className="text-[11.5px] font-semibold text-muted-foreground whitespace-nowrap">
                  MRP: ₹{Number(pack.mrp).toFixed(2)} · Sale Price: ₹{Number(pack.salePrice).toFixed(2)}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-[12px] font-semibold text-foreground">SKU Number*</span>
                  <input
                    type="text"
                    required
                    value={pack.sku || ""}
                    onChange={(e) => {
                      const val = e.target.value
                      patch({
                        packSizes: product.packSizes.map((item, idx) =>
                          idx === index ? { ...item, sku: val } : item
                        ),
                      })
                    }}
                    placeholder="e.g. ACC-PROD-1KG"
                    className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none transition duration-200 focus:border-border-strong focus:bg-white"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <span className="text-[12px] font-semibold text-foreground">Batch Number*</span>
                  <input
                    type="text"
                    required
                    value={pack.batchNumber || ""}
                    onChange={(e) => {
                      const val = e.target.value
                      patch({
                        packSizes: product.packSizes.map((item, idx) =>
                          idx === index ? { ...item, batchNumber: val } : item
                        ),
                      })
                    }}
                    placeholder="e.g. BATCH-001"
                    className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none transition duration-200 focus:border-border-strong focus:bg-white"
                  />
                </div>
              </div>

              {/* QR and Verify Links Block */}
              {pack.verifySlug && (
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
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Verification Active
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
                options={Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))}
                className="w-20 animate-none font-medium"
              />
              <span className="text-[13px] font-bold text-muted-foreground select-none">:</span>
              <OryCMSSelect
                value={parsedTime.minute}
                onChange={(val) => updatePackTiming("minute", val)}
                options={Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))}
                className="w-20 animate-none font-medium"
              />
              <OryCMSSelect
                value={parsedTime.period}
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
            <strong className="font-bold">Lifetime Compliance Lock:</strong> Legally binding identifiers (License Number, CIR Registration, and Document URLs) are securely locked after initial save to prevent unauthorized changes.
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
          <span className="text-[12px] font-semibold text-foreground">Verification Portal Product Image (Strict 1200 x 1200 px)</span>
          
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

          <div className="flex gap-2">
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
              No custom portal image assigned yet. Matches the primary catalog cover if left empty.
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
          disabled={saving}
          className="h-10 rounded-lg bg-foreground text-background hover:!bg-[#FF5A20] hover:!text-white font-bold transition-all shadow-xs px-5 text-[13px] flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? "Publishing Records..." : "Save Verification Details"}
        </button>
      </div>

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
          "flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-bold text-white shadow-xl",
          toast.tone === "success" && "bg-emerald-600",
          toast.tone === "error" && "bg-destructive",
          toast.tone === "info" && "bg-[#FF5A20]"
        )}
      >
        {toast.message}
      </div>
    </div>
  )
}
