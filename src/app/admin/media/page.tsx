import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSMediaLibrary } from "@/components/orycms/media-library"

export default function OryCMSMediaPage() {
  return (
    <OryCMSDashboard section="Media">
      <OryCMSMediaLibrary />
    </OryCMSDashboard>
  )
}
