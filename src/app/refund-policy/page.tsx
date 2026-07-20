import type { Metadata } from "next"
import { RefreshCcw } from "lucide-react"
import LegalPage, { LegalSection } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Refund Policy | Adhunik Crop Care",
  description: "Cancellation, return, replacement, and refund policy for Adhunik Crop Care orders.",
}

const SECTIONS: LegalSection[] = [
  {
    title: "Order cancellations",
    paragraphs: ["Cancellation requests should be submitted before an order is dispatched. Once dispatch has begun, cancellation availability may depend on the shipment and product status."],
  },
  {
    title: "Returns and replacements",
    paragraphs: ["Return or replacement eligibility depends on the product condition, packaging, delivery status, and reason for the request."],
    bullets: ["Report damaged, incorrect, leaking, or missing items promptly after delivery.", "Keep the original packaging, labels, invoice, and supporting photographs.", "Do not use or alter a product that is being reported for return or replacement."],
  },
  {
    title: "Non-returnable products",
    paragraphs: ["Opened, used, tampered, expired through improper storage, or specially procured products may not be returnable unless they were damaged, defective, or supplied incorrectly."],
  },
  {
    title: "Refund processing",
    paragraphs: ["Approved refunds are processed to the original payment method where possible. Bank or payment-provider processing times may apply after a refund is initiated."],
  },
  {
    title: "Cash on delivery orders",
    paragraphs: ["Approved refunds for cash on delivery orders may require verified bank or payment details from the customer."],
  },
  {
    title: "How to request support",
    paragraphs: ["Contact the support team with your order number, item details, reason for the request, and relevant photographs. The team will review the request and explain the available resolution."],
  },
]

export default function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="Refund Policy"
      title="Fair support when an order needs attention."
      intro="This policy explains the general process for cancellations, returns, replacements, and approved refunds on storefront orders."
      updated="20 July 2026"
      icon={RefreshCcw}
      accent="gold"
      sections={SECTIONS}
      noteTitle="Need order support?"
      note="Contact our support team with your order number and photographs where applicable. Review this policy with your legal adviser before publication."
    />
  )
}
