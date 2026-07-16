import type { Metadata } from "next"
import { ScrollText } from "lucide-react"
import LegalPage, { LegalSection } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Terms & Conditions | Adhunik Crop Care",
  description: "Terms and conditions governing use of the Adhunik Crop Care website.",
}

const SECTIONS: LegalSection[] = [
  {
    title: "Acceptance of terms",
    paragraphs: ["By accessing this website, creating an account, submitting an enquiry, or placing an order, you agree to these terms and any additional conditions shown during a specific transaction."],
  },
  {
    title: "Website use",
    bullets: ["Use the website only for lawful personal or business purposes.", "Do not attempt to disrupt, copy, misuse, reverse engineer, or gain unauthorized access to the website.", "Information supplied through forms or accounts should be accurate and current.", "You are responsible for activity performed through your account credentials."],
  },
  {
    title: "Products and agricultural guidance",
    paragraphs: ["Product descriptions, crop information, dosage guidance, and educational material are provided for general assistance. Field outcomes can vary with crop, soil, climate, water, timing, storage, application, and other conditions."],
    bullets: ["Always read the product label and follow applicable agricultural instructions.", "Seek qualified local guidance when field conditions or crop symptoms are uncertain.", "Do not use a product for a prohibited crop, purpose, or application method."],
  },
  {
    title: "Orders and pricing",
    paragraphs: ["Prices, availability, offers, taxes, delivery eligibility, and estimated timelines may change. An order may be reviewed or cancelled if information is incorrect, stock is unavailable, payment fails, or fulfilment is not possible."],
  },
  {
    title: "Delivery, returns, and refunds",
    paragraphs: ["Delivery, cancellation, return, replacement, and refund conditions may depend on product type, order status, packaging, damage, expiry, and applicable law. Detailed operational rules may be displayed separately during checkout or support handling."],
  },
  {
    title: "Intellectual property",
    paragraphs: ["Website design, text, graphics, product presentation, logos, photographs, videos, and other original materials belong to Adhunik Crop Care or their respective licensors and may not be reused without permission."],
  },
  {
    title: "Limitation and responsibility",
    paragraphs: ["To the extent permitted by law, Adhunik Crop Care is not responsible for indirect losses, improper product use, conditions outside reasonable control, or decisions made without considering label instructions and field-specific factors."],
  },
  {
    title: "Changes and governing provisions",
    paragraphs: ["We may update these terms when services, operations, or legal requirements change. Add your final governing law, jurisdiction, dispute process, registered address, and formal contact details here before publication."],
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms & Conditions"
      title="Clear ground rules for using our services."
      intro="These draft terms describe the basic conditions for browsing the website, using agricultural information, creating an account, and purchasing products."
      updated="17 July 2026"
      icon={ScrollText}
      accent="gold"
      sections={SECTIONS}
      noteTitle="Need clarification?"
      note="This is practical starter copy, not final legal advice. Add your company-specific commercial and jurisdiction clauses before launch."
    />
  )
}
