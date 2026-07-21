import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSPaymentsAdmin } from "@/components/orycms/payments-admin"

export default function OryCMSPaymentsPage() {
  return (
    <OryCMSDashboard section="Payments">
      <OryCMSPaymentsAdmin />
    </OryCMSDashboard>
  )
}
