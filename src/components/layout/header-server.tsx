import Header from "@/components/layout/header"
import { listOryCMSCategories } from "@/lib/orycms/categories"

export default async function HeaderServer() {
  const categories = await listOryCMSCategories().catch(() => [])
  return (
    <Header
      initialCategories={categories.map(({ id, name, slug }) => ({ id, name, slug }))}
    />
  )
}
