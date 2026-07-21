import type { ShiprocketOrderStatus } from "@/lib/shiprocket/types"

export const ORDER_LIFECYCLE: ShiprocketOrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Returned",
  "Refunded",
]

/**
 * Shiprocket numeric status codes → canonical order lifecycle.
 * Codes are the values Shiprocket sends on webhooks / tracking payloads.
 * Anything unmapped falls back to label matching, then to "Processing".
 */
const CODE_MAP: Record<string, ShiprocketOrderStatus> = {
  "1": "Confirmed", // AWB assigned / order new
  "2": "Processing", // label generated
  "3": "Packed", // ready to ship / manifest generated
  "4": "Shipped", // pickup scheduled/generated
  "42": "Shipped", // picked up
  "6": "Shipped", // shipped
  "18": "In Transit", // in transit
  "38": "In Transit", // reached destination hub
  "17": "Out for Delivery", // out for delivery
  "7": "Delivered", // delivered
  "8": "Cancelled", // cancelled
  "5": "Cancelled", // cancelled (alt)
  "9": "Returned", // RTO initiated
  "10": "Returned", // RTO delivered
  "11": "Returned", // RTO acknowledged
  "12": "Returned", // lost — treat as returned for lifecycle
  "13": "Cancelled", // pickup error / pending cancellation
  "19": "Shipped", // out for pickup
  "20": "Shipped", // pickup rescheduled
}

/** Ordered label matchers — first hit wins, so specific phrases precede generic ones. */
const LABEL_MATCHERS: Array<[RegExp, ShiprocketOrderStatus]> = [
  [/out\s*for\s*delivery/i, "Out for Delivery"],
  [/rto|return/i, "Returned"],
  [/cancel/i, "Cancelled"],
  [/deliver/i, "Delivered"],
  [/in\s*transit|reached|transit/i, "In Transit"],
  [/pickup|picked|shipped|dispatch/i, "Shipped"],
  [/manifest|packed|ready\s*to\s*ship/i, "Packed"],
  [/label|processing/i, "Processing"],
  [/awb|new|confirm/i, "Confirmed"],
]

export function mapShiprocketStatus(code: string | number | null | undefined, label?: string | null): ShiprocketOrderStatus {
  const key = code === null || code === undefined ? "" : String(code).trim()
  if (key && CODE_MAP[key]) return CODE_MAP[key]
  const text = (label ?? "").trim()
  if (text) {
    for (const [pattern, status] of LABEL_MATCHERS) {
      if (pattern.test(text)) return status
    }
  }
  return "Processing"
}

/** True when the canonical status means the parcel is no longer with us and stock should be restored. */
export function isInventoryRestoringStatus(status: ShiprocketOrderStatus): boolean {
  return status === "Cancelled" || status === "Returned" || status === "Refunded"
}

/** True when a shipment can still be cancelled (pre-dispatch). */
export function isPreDispatch(status: ShiprocketOrderStatus): boolean {
  return status === "Pending" || status === "Confirmed" || status === "Processing" || status === "Packed"
}
