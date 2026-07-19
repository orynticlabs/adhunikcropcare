import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSOrderDetails } from "@/components/orycms/orders-admin"

export default async function OryCMSOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <OryCMSDashboard section="Orders">
      <OryCMSOrderDetails id={id} />
    </OryCMSDashboard>
  )
}
