import "server-only"
import { ensureDocument, type DocumentKind } from "@/lib/shiprocket/fulfillment"

const CONTENT_TYPES: Record<DocumentKind, string> = {
  invoice: "application/pdf",
  label: "application/pdf",
  manifest: "application/pdf",
}

export function isDocumentKind(value: string): value is DocumentKind {
  return value === "invoice" || value === "label" || value === "manifest"
}

/**
 * Resolves the Shiprocket document URL (generating it on first access), fetches
 * the file server-side, and returns a streamable Response. Proxying keeps the raw
 * Shiprocket URL server-only and lets the caller enforce auth before download.
 */
export async function proxyDocument(orderId: string, kind: DocumentKind, filenameBase: string): Promise<Response> {
  const url = await ensureDocument(orderId, kind)
  const upstream = await fetch(url)
  if (!upstream.ok || !upstream.body) {
    throw new Error(`Unable to fetch ${kind} document (${upstream.status}).`)
  }
  const contentType = upstream.headers.get("content-type") ?? CONTENT_TYPES[kind]
  const extension = contentType.includes("pdf") ? "pdf" : "bin"
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "content-disposition": `inline; filename="${filenameBase}-${kind}.${extension}"`,
      "cache-control": "private, max-age=300",
    },
  })
}
