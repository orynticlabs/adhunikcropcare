import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSOrdersList } from "@/components/orycms/orders-admin"

export default function OryCMSOrdersPage() {
  return (
    <OryCMSDashboard section="Orders">
      <OryCMSOrdersList />
    </OryCMSDashboard>
  )
}
