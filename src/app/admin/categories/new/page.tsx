import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSCategoryForm } from "@/components/orycms/categories-admin"

export default function NewCategoryPage() {
  return (
    <OryCMSDashboard section="Categories">
      <OryCMSCategoryForm />
    </OryCMSDashboard>
  )
}
