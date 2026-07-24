import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSReelsAdmin } from "@/components/orycms/reels-admin"

export default function OryCMSReelsPage() {
  return (
    <OryCMSDashboard section="Reels">
      <OryCMSReelsAdmin />
    </OryCMSDashboard>
  )
}
