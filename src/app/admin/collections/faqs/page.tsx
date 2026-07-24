import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSFaqsAdmin } from "@/components/orycms/faqs-admin"

export default function OryCMSFaqsPage() {
  return (
    <OryCMSDashboard section="FAQs">
      <OryCMSFaqsAdmin />
    </OryCMSDashboard>
  )
}
