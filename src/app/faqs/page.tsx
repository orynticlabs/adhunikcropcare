import type { Metadata } from "next"
import AnnouncementBar from "@/components/layout/announcement-bar"
import HeaderServer from "@/components/layout/header-server"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"
import FaqsPageClient from "@/components/faqs/faqs-page-client"
import FarmersNotCustomersSection from "@/components/home/farmers-not-customers-section"
import CropSuccessStories from "@/components/home/crop-success-stories"
import { listOryCMSFaqs } from "@/lib/orycms/faqs"

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Adhunik Crop Care",
  description:
    "Get answers on pesticide application, insecticide safety, bio fertilizer benefits, quality standards, and ordering options from Adhunik Crop Care.",
  keywords: [
    "pesticide FAQs India",
    "insecticide safety guidelines",
    "bio fertilizer usage questions",
    "Adhunik Crop Care FAQs",
  ],
  openGraph: {
    title: "Frequently Asked Questions | Adhunik Crop Care",
    description:
      "Get answers on pesticide application, insecticide safety, bio fertilizer benefits, quality standards, and ordering options from Adhunik Crop Care.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions | Adhunik Crop Care",
    description:
      "Get answers on pesticide application, insecticide safety, bio fertilizer benefits, quality standards, and ordering options from Adhunik Crop Care.",
  },
}

export default async function FaqsPage() {
  const faqs = await listOryCMSFaqs({ publishedOnly: true })

  return (
    <div className="min-h-screen overflow-hidden bg-[#f0f4f1] text-[#203129]">
      <AnnouncementBar />
      <HeaderServer />
      <CartDrawer />

      <main>
        <FaqsPageClient initialFaqs={faqs} />
        <FarmersNotCustomersSection />
        <CropSuccessStories />
      </main>

      <SiteFooter />
    </div>
  )
}
