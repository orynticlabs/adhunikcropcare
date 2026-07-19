import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSProductsList } from "@/components/orycms/products-admin"

export default function OryCMSProductsPage() {
  return (
    <OryCMSDashboard section="Products">
      <OryCMSProductsList />
    </OryCMSDashboard>
  )
}
