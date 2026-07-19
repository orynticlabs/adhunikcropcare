import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSUsersList } from "@/components/orycms/users-admin"

export default function OryCMSUsersPage() {
  return (
    <OryCMSDashboard section="Users">
      <OryCMSUsersList />
    </OryCMSDashboard>
  )
}
