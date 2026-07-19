import { notFound } from "next/navigation"
import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSCategoryForm } from "@/components/orycms/categories-admin"

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!id) notFound()

  return (
    <OryCMSDashboard section="Categories">
      <OryCMSCategoryForm id={id} />
    </OryCMSDashboard>
  )
}
