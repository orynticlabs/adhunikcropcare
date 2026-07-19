import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSProductForm } from "@/components/orycms/products-admin"

export default function NewOryCMSProductPage() {
  return (
    <OryCMSDashboard section="Products">
      <OryCMSProductForm />
    </OryCMSDashboard>
  )
}
