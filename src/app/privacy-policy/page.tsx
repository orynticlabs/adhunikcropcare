import type { Metadata } from "next"
import { ShieldCheck } from "lucide-react"
import LegalPage, { LegalSection } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Privacy Policy | Adhunik Crop Care",
  description: "Privacy policy for Adhunik Crop Care website users and customers.",
}

const SECTIONS: LegalSection[] = [
  {
    title: "Information we collect",
    paragraphs: ["We may collect information that you provide while creating an account, placing an order, requesting guidance, submitting a form, or contacting our team."],
    bullets: ["Name, phone number, email address, and delivery address.", "Order, payment status, product preference, and support history.", "Farm, crop, location, or business details voluntarily shared with us.", "Basic device, browser, and website usage information."],
  },
  {
    title: "How we use information",
    paragraphs: ["We use personal information only for legitimate business and service purposes connected with Adhunik Crop Care."],
    bullets: ["Process purchases, deliveries, returns, and customer requests.", "Provide product information, crop guidance, and service communication.", "Improve website performance, product selection, and customer experience.", "Prevent misuse, maintain security, and comply with applicable obligations."],
  },
  {
    title: "Sharing and service providers",
    paragraphs: ["We may share limited information with trusted partners who help us operate the website, deliver orders, process payments, communicate with customers, or provide technical services."],
    bullets: ["Partners should receive only the information needed to perform their role.", "We do not intend to sell personal information as a standalone commercial product.", "Information may be disclosed where required by law or necessary to protect legitimate rights."],
  },
  {
    title: "Storage and security",
    paragraphs: ["We use reasonable administrative and technical safeguards intended to protect information against unauthorized access, loss, alteration, or misuse. No online system can guarantee absolute security."],
  },
  {
    title: "Your choices and rights",
    bullets: ["Request access to or correction of information associated with you.", "Ask us to update communication preferences or stop optional marketing messages.", "Request deletion where retention is not required for orders, legal duties, or legitimate records.", "Contact us if you believe information has been used incorrectly."],
  },
  {
    title: "Retention",
    paragraphs: ["We may retain information for as long as needed to provide services, maintain transaction records, resolve disputes, meet legal requirements, and protect the business and its users."],
  },
  {
    title: "Children and third-party links",
    paragraphs: ["The website is not designed to knowingly collect personal information from children without appropriate guardian involvement. External links may follow their own privacy practices, which are outside our control."],
  },
  {
    title: "Policy changes and contact",
    paragraphs: ["We may update this policy as our services or legal responsibilities change. The latest revision date will appear at the top of this page. Questions may be sent through our Contact Us page."],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy Policy"
      title="Your information deserves careful handling."
      intro="This draft explains what information Adhunik Crop Care may collect, why it is used, and the choices available to website visitors and customers."
      updated="17 July 2026"
      icon={ShieldCheck}
      accent="leaf"
      sections={SECTIONS}
      noteTitle="Privacy question?"
      note="This is editable starter content. Review it with your legal adviser before publishing as your final policy."
    />
  )
}
