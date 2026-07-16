import type { Metadata } from "next"
import { Cookie } from "lucide-react"
import LegalPage, { LegalSection } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Cookie Policy | Adhunik Crop Care",
  description: "Cookie and similar technology policy for the Adhunik Crop Care website.",
}

const SECTIONS: LegalSection[] = [
  {
    title: "What cookies are",
    paragraphs: ["Cookies are small text files stored by a browser when a website is visited. Similar technologies may also remember settings, maintain sessions, measure performance, or support website features."],
  },
  {
    title: "Essential cookies",
    paragraphs: ["These technologies support core website functions and may be required for the service to work correctly."],
    bullets: ["Maintain sign-in or shopping-cart sessions.", "Support checkout, security, fraud prevention, and load balancing.", "Remember privacy or cookie preferences.", "Enable forms and other requested website functions."],
  },
  {
    title: "Preference cookies",
    paragraphs: ["Preference cookies may remember choices such as language, region, display settings, recently viewed content, or other conveniences for a future visit."],
  },
  {
    title: "Analytics cookies",
    paragraphs: ["Analytics may help us understand page visits, navigation patterns, device categories, errors, and general website performance. Where required, these should be used only after appropriate consent."],
  },
  {
    title: "Marketing technologies",
    paragraphs: ["If advertising or campaign tools are added, they may help measure promotions or present relevant messages. List each active advertising provider and its purpose here before enabling such tools."],
  },
  {
    title: "Third-party services",
    paragraphs: ["Some embedded content, payment services, delivery tools, analytics providers, or social features may set their own cookies. Their use is governed by their own policies and configuration."],
  },
  {
    title: "Managing your choices",
    bullets: ["Use the website cookie preference control, if available.", "Change browser settings to block or remove cookies.", "Understand that blocking essential cookies may affect account, cart, checkout, or security features.", "Review consent choices whenever new optional technologies are introduced."],
  },
  {
    title: "Updates and cookie list",
    paragraphs: ["Update this page when cookie use changes. Before publication, add a current cookie table containing cookie name, provider, purpose, category, and duration."],
  },
]

export default function CookiePolicyPage() {
  return (
    <LegalPage
      eyebrow="Cookie Policy"
      title="Small files. Clear choices."
      intro="This draft explains how cookies and similar technologies may support essential features, preferences, measurement, and future marketing activities."
      updated="17 July 2026"
      icon={Cookie}
      accent="sage"
      sections={SECTIONS}
      noteTitle="Cookie controls"
      note="Add your final consent banner details and a verified list of active cookies before publishing this policy."
    />
  )
}
