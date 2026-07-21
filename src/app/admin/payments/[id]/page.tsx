import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSPaymentDetail } from "@/components/orycms/payment-detail-admin"

export default async function OryCMSPaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <OryCMSDashboard section="Payments">
      <OryCMSPaymentDetail id={id} />
    </OryCMSDashboard>
  )
}
