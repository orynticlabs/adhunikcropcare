import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSDatabaseDashboard } from "@/components/orycms/database-admin"

export default function OryCMSDatabasePage() {
  return (
    <OryCMSDashboard section="Database">
      <OryCMSDatabaseDashboard />
    </OryCMSDashboard>
  )
}
