import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSHelpCenterPage } from "@/components/orycms/help-center-admin"

export default function AdminHelpCenterPage() {
  return (
    <OryCMSDashboard section="Help Center">
      <OryCMSHelpCenterPage />
    </OryCMSDashboard>
  )
}
