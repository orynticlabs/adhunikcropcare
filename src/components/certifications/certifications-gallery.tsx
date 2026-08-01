"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import {
  Award,
  BadgeCheck,
  Check,
  Copy,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Infinity as InfinityIcon,
  Loader2,
  Search,
  ShieldCheck,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { OryCMSCertificateDTO } from "@/lib/orycms/certificates"

export function CertificationsGallery({
  certificates,
}: {
  certificates: OryCMSCertificateDTO[]
}) {
  const [query, setQuery] = useState("")
  const [selectedAuthority, setSelectedAuthority] = useState("all")
  const [activeModalCert, setActiveModalCert] = useState<OryCMSCertificateDTO | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [iframeLoading, setIframeLoading] = useState(true)

  // Extract unique issuing authorities for filter pills
  const authorities = useMemo(() => {
    const list = Array.from(
      new Set(certificates.map((c) => c.issuingAuthority?.trim()).filter(Boolean)),
    ).sort()
    return ["all", ...list]
  }, [certificates])

  // Filter certificates based on search query and authority pill
  const filtered = useMemo(() => {
    return certificates.filter((cert) => {
      const q = query.toLowerCase().trim()
      const matchesQuery =
        !q ||
        cert.title.toLowerCase().includes(q) ||
        cert.issuingAuthority.toLowerCase().includes(q) ||
        Boolean(cert.certificateNumber?.toLowerCase().includes(q)) ||
        Boolean(cert.description?.toLowerCase().includes(q))

      const matchesAuthority =
        selectedAuthority === "all" ||
        cert.issuingAuthority.trim().toLowerCase() === selectedAuthority.toLowerCase()

      return matchesQuery && matchesAuthority
    })
  }, [certificates, query, selectedAuthority])

  function handleCopyLink(cert: OryCMSCertificateDTO) {
    const textToCopy = `${cert.title} - ${cert.issuingAuthority} (${cert.certificateNumber || "Verified Record"}) ${
      cert.documentUrl || cert.image?.url || (typeof window !== "undefined" ? window.location.href : "")
    }`
    void navigator.clipboard.writeText(textToCopy)
    setCopiedId(cert.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  function getDownloadUrl(cert: OryCMSCertificateDTO) {
    return cert.documentUrl || cert.image?.url || "#"
  }

  function getDownloadFilename(cert: OryCMSCertificateDTO) {
    const cleanTitle = cert.title.replace(/[^a-zA-Z0-9_-]/g, "_")
    const isPdf = isPdfUrl(getDownloadUrl(cert))
    return `${cleanTitle}_Certificate.${isPdf ? "pdf" : "jpg"}`
  }

  function isPdfUrl(url?: string) {
    if (!url) return false
    const lower = url.toLowerCase()
    return lower.endsWith(".pdf") || lower.includes("/pdf/") || lower.includes("format=pdf")
  }

  return (
    <div className="space-y-8">
      {/* Search Bar & Filter Pills */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by certificate title, authority, or number..."
            className="h-11 w-full rounded-2xl border border-border/80 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-[#689c30] focus:ring-2 focus:ring-[#689c30]/20 shadow-xs"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {authorities.map((auth) => {
            const label = auth === "all" ? "All Credentials" : auth
            const isActive = selectedAuthority === auth
            return (
              <button
                key={auth}
                type="button"
                onClick={() => setSelectedAuthority(auth)}
                className={cn(
                  "group inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors duration-200 cursor-pointer select-none border",
                  isActive
                    ? "bg-[#033927] text-white border-[#033927] hover:!text-white shadow-sm"
                    : "bg-white text-[#033927] border border-[#d7e0da] hover:bg-[#033927] hover:!text-white shadow-xs",
                )}
              >
                {auth === "all" ? <Award className={cn("h-3.5 w-3.5 transition-colors", isActive ? "text-[#bdd879]" : "text-[#689c30] group-hover:text-white")} /> : null}
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Certificate Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((certificate) => {
            const hasDocument = Boolean(certificate.documentUrl)
            const isPdf = isPdfUrl(certificate.documentUrl)
            const isLifetime = !certificate.expiresOn

            return (
              <article
                key={certificate.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-luxe"
              >
                {/* Image / Thumbnail Container */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-[#f8faf7] to-[#eef4ea] p-4">
                  {certificate.image?.url ? (
                    <Image
                      src={certificate.image.url}
                      alt={`${certificate.title} certificate`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#033927]/40">
                      <FileCheck2 className="h-12 w-12 text-[#689c30]" />
                      <span className="text-xs font-medium">Verified Certificate</span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute left-3.5 top-3.5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#033927] px-2.5 py-1 text-[10.5px] font-semibold text-white shadow-xs">
                      <BadgeCheck className="h-3 w-3 text-[#bdd879]" /> Verified Record
                    </span>
                    {hasDocument && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-medium text-foreground backdrop-blur-xs border border-border/40 shadow-xs">
                        {isPdf ? <FileText className="h-3 w-3 text-red-600" /> : <Eye className="h-3 w-3 text-blue-600" />}
                        {isPdf ? "PDF Document" : "Image View"}
                      </span>
                    )}
                  </div>

                  {/* Lifetime or Expiry Pill */}
                  <div className="absolute right-3.5 top-3.5">
                    {isLifetime ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#689c30]/30 bg-[#eff4e9] px-2.5 py-1 text-[10.5px] font-bold text-[#033927] shadow-xs">
                        <InfinityIcon className="h-3 w-3 text-[#689c30]" /> Lifetime Validity
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10.5px] font-semibold text-amber-800 dark:text-amber-300 shadow-xs">
                        Valid thru {formatDate(certificate.expiresOn!)}
                      </span>
                    )}
                  </div>

                  {/* Quick Preview Hover Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-[#033927]/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={() => {
                        setIframeLoading(true)
                        setActiveModalCert(certificate)
                      }}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-[#033927] px-5 text-xs font-bold text-white shadow-lg transition-colors duration-200 hover:bg-[#689c30] hover:!text-black cursor-pointer select-none"
                    >
                      <Eye className="h-4 w-4" /> Preview Certificate
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#689c30]">
                      {certificate.issuingAuthority}
                    </span>
                    {certificate.certificateNumber ? (
                      <span className="rounded-md bg-[#edf3e9] px-2 py-0.5 font-mono text-[10.5px] font-semibold text-[#033927]">
                        No. {certificate.certificateNumber}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-[#033927] group-hover:text-[#689c30] transition-colors">
                    {certificate.title}
                  </h3>

                  {certificate.description ? (
                    <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {certificate.description}
                    </p>
                  ) : null}

                  {/* Dates & Registration Details */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3.5 text-[11.5px] text-muted-foreground">
                    <span>
                      {certificate.issuedOn ? `Issued: ${formatDate(certificate.issuedOn)}` : "Official Company Record"}
                    </span>
                    <span>
                      {isLifetime ? "Permanent Credential" : `Expires: ${formatDate(certificate.expiresOn!)}`}
                    </span>
                  </div>

                  {/* Card Action Buttons Footer */}
                  <div className="mt-4 flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIframeLoading(true)
                        setActiveModalCert(certificate)
                      }}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#d7e0da] bg-white text-xs font-semibold text-[#033927] transition-colors hover:bg-[#033927] hover:!text-white cursor-pointer shadow-xs"
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>

                    <a
                      href={getDownloadUrl(certificate)}
                      download={getDownloadFilename(certificate)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#033927] text-xs font-semibold text-white transition-colors hover:bg-[#689c30] hover:!text-black shadow-xs cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(certificate)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#d7e0da] bg-white text-[#033927] transition-colors hover:bg-[#033927] hover:!text-white cursor-pointer shadow-xs"
                      title="Copy certificate details link"
                    >
                      {copiedId === certificate.id ? (
                        <Check className="h-3.5 w-3.5 text-[#689c30]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-border/80 bg-gradient-to-b from-[#edf4e7]/60 to-white p-12 text-center shadow-soft">
          <Award className="mx-auto h-12 w-12 text-[#689c30]" />
          <h3 className="mt-4 font-display text-2xl font-semibold text-[#033927]">
            No matching certificates found
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Try adjusting your search keywords or switching issuing authority filters to view company credentials.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("")
              setSelectedAuthority("all")
            }}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#033927] px-6 text-xs font-semibold text-white transition-colors hover:bg-[#689c30] hover:text-black cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Interactive Modal Previewer */}
      {activeModalCert && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in-0 duration-200"
          onClick={() => setActiveModalCert(null)}
        >
          <div
            className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 bg-[#f8faf7] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#033927] text-white">
                  <Award className="h-5 w-5 text-[#bdd879]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#689c30]">
                    {activeModalCert.issuingAuthority}
                  </span>
                  <h3 className="font-display text-lg font-bold text-[#033927] leading-tight">
                    {activeModalCert.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={getDownloadUrl(activeModalCert)}
                  download={getDownloadFilename(activeModalCert)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#033927] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#689c30] hover:!text-black cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Download File
                </a>

                <button
                  type="button"
                  onClick={() => setActiveModalCert(null)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-[#d7e0da] bg-white text-[#033927] transition-colors hover:bg-[#033927] hover:!text-white shadow-xs cursor-pointer"
                  title="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Content Body */}
            <div className="grid flex-1 overflow-y-auto lg:grid-cols-[1fr_320px]">
              {/* Document / Image Viewer Area */}
              <div className="relative flex min-h-[380px] sm:min-h-[500px] items-center justify-center bg-[#1e2923] p-4">
                {isPdfUrl(activeModalCert.documentUrl) ? (
                  <div className="relative h-full w-full min-h-[480px]">
                    {iframeLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70 bg-[#1e2923]">
                        <Loader2 className="h-7 w-7 animate-spin text-[#689c30]" />
                        <span className="text-xs">Loading PDF Viewer...</span>
                      </div>
                    )}
                    <iframe
                      src={`${activeModalCert.documentUrl}#toolbar=1&navpanes=0`}
                      onLoad={() => setIframeLoading(false)}
                      className="h-full w-full rounded-xl border border-white/10 shadow-lg min-h-[480px]"
                      title={activeModalCert.title}
                    />
                  </div>
                ) : activeModalCert.image?.url || activeModalCert.documentUrl ? (
                  <div className="relative flex max-h-[70vh] w-full items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeModalCert.image?.url || activeModalCert.documentUrl}
                      alt={activeModalCert.title}
                      className="max-h-[68vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-white/60">
                    <FileCheck2 className="h-16 w-16 text-[#689c30]/50" />
                    <p className="text-sm">Document preview is unavailable for this certificate entry.</p>
                  </div>
                )}
              </div>

              {/* Document Dossier & Verification Metadata Sidebar */}
              <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-border/60 bg-[#f8faf7] p-6 space-y-6">
                <div className="space-y-5">
                  <div className="rounded-2xl border border-[#689c30]/30 bg-[#eff4e9] p-4 text-[#033927]">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <ShieldCheck className="h-4 w-4 text-[#689c30]" /> Official Verification Status
                    </div>
                    <p className="mt-1 text-xs text-foreground/75 leading-relaxed">
                      Verified company credential published via Adhunik Crop Care OryCMS catalog management system.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block font-medium">Issuing Authority</span>
                      <span className="font-bold text-[#033927] text-sm">{activeModalCert.issuingAuthority}</span>
                    </div>

                    {activeModalCert.certificateNumber ? (
                      <div>
                        <span className="text-muted-foreground block font-medium">Certificate Registration No.</span>
                        <span className="font-mono font-semibold text-foreground bg-white px-2 py-1 rounded border border-border/60 inline-block mt-0.5">
                          {activeModalCert.certificateNumber}
                        </span>
                      </div>
                    ) : null}

                    <div>
                      <span className="text-muted-foreground block font-medium">Issue Date</span>
                      <span className="font-semibold text-foreground">
                        {activeModalCert.issuedOn ? formatDate(activeModalCert.issuedOn) : "Official Record"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block font-medium">Expiration Status</span>
                      {!activeModalCert.expiresOn ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[#689c30] mt-0.5">
                          <InfinityIcon className="h-3.5 w-3.5" /> Lifetime Validity (Permanent)
                        </span>
                      ) : (
                        <span className="font-semibold text-foreground">
                          Valid until {formatDate(activeModalCert.expiresOn)}
                        </span>
                      )}
                    </div>

                    {activeModalCert.description ? (
                      <div>
                        <span className="text-muted-foreground block font-medium mb-1">Scope & Description</span>
                        <p className="text-muted-foreground leading-relaxed bg-white p-3 rounded-xl border border-border/60">
                          {activeModalCert.description}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                  {/* Sidebar Bottom Action */}
                  <div className="pt-4 border-t border-border/60 space-y-2">
                    <a
                      href={getDownloadUrl(activeModalCert)}
                      download={getDownloadFilename(activeModalCert)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#033927] px-4 text-xs font-bold text-white shadow-md transition-colors hover:bg-[#689c30] hover:!text-black cursor-pointer"
                    >
                      <Download className="h-4 w-4" /> Download Official File
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(activeModalCert)}
                      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-[#d7e0da] bg-white text-xs font-semibold text-[#033927] hover:bg-[#033927] hover:!text-white transition-colors cursor-pointer shadow-xs"
                    >
                      <Copy className="h-3.5 w-3.5" /> {copiedId === activeModalCert.id ? "Link Copied!" : "Copy Reference Link"}
                    </button>
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(value: string) {
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
      dateStyle: "medium",
    })
  } catch {
    return value
  }
}
