import { OryCMSCustomersList } from "@/components/orycms/customers-admin"
import { OryCMSDashboard } from "@/components/orycms/dashboard"

export default function OryCMSCustomersPage() {
  return (
    <OryCMSDashboard section="Customers">
      <OryCMSCustomersList />
    </OryCMSDashboard>
  )
}
