import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSSettingsPage } from "@/components/orycms/settings-admin"

export default function AdminSettingsPage() {
  return (
    <OryCMSDashboard section="Settings">
      <OryCMSSettingsPage />
    </OryCMSDashboard>
  )
}
