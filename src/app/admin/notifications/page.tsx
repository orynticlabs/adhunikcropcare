import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSNotificationsAdmin } from "@/components/orycms/notifications-admin"

export default function OryCMSNotificationsPage() {
  return (
    <OryCMSDashboard section="Notifications">
      <OryCMSNotificationsAdmin />
    </OryCMSDashboard>
  )
}
