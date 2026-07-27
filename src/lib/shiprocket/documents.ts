import "server-only"
import { ensureDocument } from "@/lib/shiprocket/fulfillment"

type PublicDocumentKind = "invoice" | "label"

const CONTENT_TYPES: Record<"invoice" | "label", string> = {
  invoice: "application/pdf",
  label: "application/pdf",
}

export function isDocumentKind(value: string): value is PublicDocumentKind {
  return value === "invoice" || value === "label"
}

/**
 * Resolves the Shiprocket document URL (generating it on first access), fetches
 * the file server-side, and returns a streamable Response. Proxying keeps the raw
 * Shiprocket URL server-only and lets the caller enforce auth before download.
 */
export async function proxyDocument(orderId: string, kind: PublicDocumentKind, filenameBase: string): Promise<Response> {
  const url = await ensureDocument(orderId, kind)
  const upstream = await fetch(url)
  if (!upstream.ok || !upstream.body) {
    throw new Error(`Unable to fetch ${kind} document (${upstream.status}).`)
  }
  const contentType = CONTENT_TYPES[kind]
  const extension = "pdf"
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "content-disposition": `inline; filename="${filenameBase}-${kind}.${extension}"`,
      "cache-control": "private, max-age=300",
      "x-content-type-options": "nosniff",
    },
  })
}
