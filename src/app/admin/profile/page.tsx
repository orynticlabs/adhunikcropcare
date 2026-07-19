import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSAdminProfilePage } from "@/components/orycms/profile-admin"

export default function AdminProfilePage() {
  return (
    <OryCMSDashboard section="Profile">
      <OryCMSAdminProfilePage />
    </OryCMSDashboard>
  )
}
