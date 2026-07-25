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
    "Find answers to common questions about Adhunik Crop Care organic products, pan-India delivery, certifications, dealer inquiries, and agricultural guidance.",
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
