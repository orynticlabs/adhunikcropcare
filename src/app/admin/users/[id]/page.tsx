import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSUserDetails } from "@/components/orycms/users-admin"

export default async function OryCMSUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <OryCMSDashboard section="Users">
      <OryCMSUserDetails id={id} />
    </OryCMSDashboard>
  )
}
