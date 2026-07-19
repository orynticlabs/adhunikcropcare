import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSCategoriesList } from "@/components/orycms/categories-admin"

export default function CategoriesPage() {
  return (
    <OryCMSDashboard section="Categories">
      <OryCMSCategoriesList />
    </OryCMSDashboard>
  )
}
