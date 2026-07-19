import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSInventoryAdmin } from "@/components/orycms/inventory-admin"

export default function AdminInventoryPage() {
  return (
    <OryCMSDashboard section="Inventory">
      <OryCMSInventoryAdmin />
    </OryCMSDashboard>
  )
}
