import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { DiscountsAdmin } from "@/components/orycms/discounts-admin"

export default function DiscountsPage() {
  return (
    <OryCMSDashboard section="Discounts">
      <DiscountsAdmin />
    </OryCMSDashboard>
  )
}
