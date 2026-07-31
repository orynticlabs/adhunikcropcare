"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Download, Eye, FileSpreadsheet, FileText, ImageIcon, PackageSearch, Search } from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { OryCMSSelect } from "@/components/orycms/custom-select"
import { cn, formatCurrency } from "@/lib/utils"

type InventoryItem = {
  availableStock: number
  brand: string
  category: string
  currentStock: number
  id: string
  image: string
  inventoryValue: number
  lastRestocked: string | null
  lastUpdated: string
  packSize: string
  productName: string
  reorderLevel: number
  reservedStock: number
  sku: string
  stockStatus: "In Stock" | "Low Stock" | "Out of Stock"
  unitsSold: number
}

type InventoryHistory = {
  id: string
  productName?: string
  quantity: number
  reason: string
  timestamp: string
  type: string
  updatedBy: string
}

type InventoryData = {
  alerts: InventoryItem[]
  cards: {
    inventoryValue: number
    lowStockProducts: number
    outOfStockProducts: number
    totalProducts: number
    totalStock: number
    totalUnitsSold: number
  }
  filters: { brands: string[]; categories: string[] }
  generatedAt: string
  history: InventoryHistory[]
  items: InventoryItem[]
}

const PAGE_SIZE = 10

export function OryCMSInventoryAdmin() {
  const [brand, setBrand] = useState("all")
  const [category, setCategory] = useState("all")
  const [data, setData] = useState<InventoryData | null>(null)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState("updated-desc")
  const [status, setStatus] = useState("all")

  useEffect(() => {
    let cancelled = false
    async function loadInventory(showLoader = false) {
      if (showLoader) setLoading(true)
      try {
        const response = await fetch("/api/orycms/inventory", { cache: "no-store" })
        const json = await response.json()
        if (!cancelled && response.ok && json.success) {
          setData(json.data)
          setError("")
        } else if (!cancelled) {
          setError(json.error?.message ?? "Failed to load inventory.")
        }
      } catch {
        if (!cancelled) setError("Inventory data unavailable.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadInventory(true)
    const interval = window.setInterval(() => void loadInventory(false), 10000)
    window.addEventListener("orycms-orders-updated", () => void loadInventory(false))
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom).getTime() : null
    const to = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null
    return [...(data?.items ?? [])]
      .filter((item) => {
        const haystack = `${item.productName} ${item.sku} ${item.category} ${item.brand}`.toLowerCase()
        const updated = new Date(item.lastUpdated).getTime()
        return (!query || haystack.includes(query.toLowerCase()))
          && (category === "all" || item.category === category)
          && (brand === "all" || item.brand === brand)
          && (status === "all" || item.stockStatus === status)
          && (!from || updated >= from)
          && (!to || updated <= to)
      })
      .sort((a, b) => {
        if (sortBy === "stock-asc") return a.availableStock - b.availableStock
        if (sortBy === "stock-desc") return b.availableStock - a.availableStock
        if (sortBy === "sold-desc") return b.unitsSold - a.unitsSold
        if (sortBy === "name-asc") return a.productName.localeCompare(b.productName)
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      })
  }, [brand, category, data, dateFrom, dateTo, query, sortBy, status])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [brand, category, dateFrom, dateTo, query, sortBy, status])

  return (
    <section className="mx-auto max-w-[1500px] space-y-6 px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/inventory", label: "Inventory" }]} />
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">Inventory</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
            Live stock, reservations, sales movement, and inventory risk from the real database.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton label="CSV" onClick={() => downloadCsv(filtered)} />
          <ExportButton label="Excel" onClick={() => downloadExcel(filtered)} />
          <ExportButton label="PDF" onClick={() => downloadPdf(filtered)} />
        </div>
      </div>

      {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">{error}</div> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Card label="Total Products" value={data?.cards.totalProducts ?? 0} />
        <Card label="Total Stock" value={data?.cards.totalStock ?? 0} />
        <Card label="Low Stock" value={data?.cards.lowStockProducts ?? 0} tone="warning" />
        <Card label="Out of Stock" value={data?.cards.outOfStockProducts ?? 0} tone="danger" />
        <Card label="Units Sold" value={data?.cards.totalUnitsSold ?? 0} />
        <Card label="Inventory Value" value={formatCurrency(data?.cards.inventoryValue ?? 0)} />
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-xs">
        <div className="grid gap-3 border-b border-border bg-surface-muted px-4 py-3 lg:grid-cols-[minmax(240px,1fr)_repeat(6,max-content)]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, SKU, category…" className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[13px] outline-none" />
          </div>
          <Select value={category} onChange={setCategory}>
            <option value="all">All categories</option>
            {data?.filters.categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select value={status} onChange={setStatus}>
            <option value="all">All status</option>
            <option>In Stock</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
          </Select>
          <Select value={brand} onChange={setBrand}>
            <option value="all">All brands</option>
            {data?.filters.brands.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none" />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] outline-none" />
          <Select value={sortBy} onChange={setSortBy}>
            <option value="updated-desc">Last updated</option>
            <option value="stock-asc">Stock low-high</option>
            <option value="stock-desc">Stock high-low</option>
            <option value="sold-desc">Units sold</option>
            <option value="name-asc">Name A-Z</option>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1300px] w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-muted text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                {["Product Image", "Product Name", "SKU", "Category", "Brand", "Pack Size", "Current Stock", "Reserved", "Available", "Units Sold", "Reorder", "Status", "Last Restocked", "Last Updated", "Actions"].map((head) => (
                  <th key={head} className="px-4 py-3 font-medium">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && !data ? (
                <tr><td colSpan={15} className="px-4 py-14 text-center text-muted-foreground">Loading live inventory…</td></tr>
              ) : rows.length ? rows.map((item) => (
                <tr key={item.id} className="hover:bg-accent/35">
                  <td className="px-4 py-3">
                    <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg border border-border bg-surface-muted">
                      {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </td>
                  <td className="max-w-[220px] px-4 py-3 font-medium">{item.productName}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{item.sku}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">{item.brand || "—"}</td>
                  <td className="max-w-[180px] px-4 py-3 text-muted-foreground">{item.packSize}</td>
                  <td className="num px-4 py-3 font-semibold">{item.currentStock}</td>
                  <td className="num px-4 py-3">{item.reservedStock}</td>
                  <td className="num px-4 py-3 font-semibold">{item.availableStock}</td>
                  <td className="num px-4 py-3">{item.unitsSold}</td>
                  <td className="num px-4 py-3">{item.reorderLevel}</td>
                  <td className="px-4 py-3"><StockBadge status={item.stockStatus} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{item.lastRestocked ? dateTime(item.lastRestocked) : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{dateTime(item.lastUpdated)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${item.id}`} className="inline-grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface transition-colors hover:bg-accent" title="View product">
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={15} className="px-4 py-14 text-center text-muted-foreground">No inventory records match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[12px] text-muted-foreground">
          <span>{filtered.length} products · refreshed {data ? dateTime(data.generatedAt) : "—"}</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="h-8 rounded-lg border border-border px-3 disabled:opacity-40">Prev</button>
            <span>Page {page} of {pageCount}</span>
            <button disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="h-8 rounded-lg border border-border px-3 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Low Stock & Out of Stock Alerts">
          {data?.alerts.length ? (
            <div className="space-y-2">
              {data.alerts.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted/35 px-3 py-2 text-[12.5px]">
                  <div className="flex min-w-0 items-center gap-2">
                    <AlertTriangle className={cn("h-4 w-4", item.stockStatus === "Out of Stock" ? "text-destructive" : "text-warning")} />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{item.productName}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{item.sku}</div>
                    </div>
                  </div>
                  <StockBadge status={item.stockStatus} />
                </div>
              ))}
            </div>
          ) : <Empty message="No low-stock or out-of-stock products." />}
        </Panel>

        <Panel title="Inventory History">
          {data?.history.length ? (
            <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
              {data.history.map((event) => (
                <div key={event.id} className="grid gap-1 py-3 text-[12.5px] sm:grid-cols-[150px_1fr_80px_130px] sm:items-center">
                  <div className="font-medium">{event.type}</div>
                  <div className="min-w-0">
                    <div className="truncate">{event.productName ?? event.reason}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{event.updatedBy}</div>
                  </div>
                  <div className={cn("num font-semibold", event.quantity < 0 ? "text-destructive" : "text-success")}>{event.quantity}</div>
                  <div className="text-muted-foreground">{dateTime(event.timestamp)}</div>
                </div>
              ))}
            </div>
          ) : <Empty message="No inventory history events found yet." />}
        </Panel>
      </div>
    </section>
  )
}

function Card({ label, tone, value }: { label: string; tone?: "warning" | "danger"; value: number | string }) {
  return <div className="rounded-xl border border-border bg-surface p-4 shadow-xs"><div className="text-[11.5px] text-muted-foreground">{label}</div><div className={cn("num mt-1 text-[22px] font-semibold", tone === "warning" && "text-warning", tone === "danger" && "text-destructive")}>{value}</div></div>
}

function Panel({ children, title }: { children: React.ReactNode; title: string }) {
  return <div className="rounded-xl border border-border bg-surface p-5 shadow-xs"><h2 className="mb-4 text-[14px] font-semibold">{title}</h2>{children}</div>
}

function Empty({ message }: { message: string }) {
  return <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-border text-center text-[13px] text-muted-foreground"><PackageSearch className="mb-2 h-5 w-5" />{message}</div>
}

function Select({ children, onChange, value }: { children: React.ReactNode; onChange: (value: string) => void; value: string }) {
  const options = (Array.isArray(children) ? children : [children]).flatMap((child) => {
    if (child && typeof child === "object" && "props" in child) {
      const val = child.props.value !== undefined ? child.props.value : String(child.props.children || "")
      const label = String(child.props.children || val)
      return [{ label, value: String(val) }]
    }
    return []
  })
  return <OryCMSSelect value={value} onChange={onChange} options={options} className="min-w-36 flex-1 sm:flex-none" />
}

function StockBadge({ status }: { status: InventoryItem["stockStatus"] }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-medium", status === "In Stock" ? "bg-success/10 text-success" : status === "Low Stock" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive")}>{status}</span>
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  const Icon = label === "PDF" ? FileText : label === "Excel" ? FileSpreadsheet : Download
  return <button type="button" onClick={onClick} className="h-9 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:bg-accent"><Icon className="mr-2 inline h-3.5 w-3.5" />{label}</button>
}

function rowsForExport(items: InventoryItem[]) {
  return items.map((item) => ({
    "Product Name": item.productName,
    SKU: item.sku,
    Category: item.category,
    Brand: item.brand,
    "Pack Size": item.packSize,
    "Current Stock": item.currentStock,
    "Reserved Stock": item.reservedStock,
    "Available Stock": item.availableStock,
    "Units Sold": item.unitsSold,
    "Reorder Level": item.reorderLevel,
    "Stock Status": item.stockStatus,
    "Last Restocked": item.lastRestocked ?? "",
    "Last Updated": item.lastUpdated,
    "Inventory Value": item.inventoryValue,
  }))
}

function downloadCsv(items: InventoryItem[]) {
  const rows = rowsForExport(items)
  const headers = Object.keys(rows[0] ?? { "Product Name": "" })
  const csv = [headers.join(","), ...rows.map((row) => headers.map((head) => csvCell((row as Record<string, unknown>)[head])).join(","))].join("\n")
  download(new Blob([csv], { type: "text/csv;charset=utf-8" }), "orycms-inventory-report.csv")
}

function downloadExcel(items: InventoryItem[]) {
  const rows = rowsForExport(items)
  const headers = Object.keys(rows[0] ?? { "Product Name": "" })
  const html = `<table><thead><tr>${headers.map((head) => `<th>${escapeHtml(head)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((head) => `<td>${escapeHtml(String((row as Record<string, unknown>)[head] ?? ""))}</td>`).join("")}</tr>`).join("")}</tbody></table>`
  download(new Blob([html], { type: "application/vnd.ms-excel" }), "orycms-inventory-report.xlsx")
}

function downloadPdf(items: InventoryItem[]) {
  const rows = rowsForExport(items)
  const text = ["OryCMS Inventory Report", new Date().toLocaleString("en-IN"), "", ...rows.map((row) => Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(" | "))].join("\n")
  download(new Blob([text], { type: "application/pdf" }), "orycms-inventory-report.pdf")
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[char] ?? char)
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}
