import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSProductForm } from "@/components/orycms/products-admin"

export default async function EditOryCMSProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <OryCMSDashboard section="Products">
      <OryCMSProductForm id={id} />
    </OryCMSDashboard>
  )
}
