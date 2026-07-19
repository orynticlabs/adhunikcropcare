import { OryCMSCustomerDetails } from "@/components/orycms/customers-admin"
import { OryCMSDashboard } from "@/components/orycms/dashboard"

export default async function OryCMSCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <OryCMSDashboard section="Customers">
      <OryCMSCustomerDetails id={id} />
    </OryCMSDashboard>
  )
}
