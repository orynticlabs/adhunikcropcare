import { OryCMSCodRulesAdmin } from "@/components/orycms/cod-rules-admin"
import { OryCMSDashboard } from "@/components/orycms/dashboard"

export default function CodRulesCollectionPage() {
  return (
    <OryCMSDashboard section="COD Rules">
      <OryCMSCodRulesAdmin />
    </OryCMSDashboard>
  )
}
