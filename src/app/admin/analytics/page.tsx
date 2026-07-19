import { OryCMSAnalyticsDashboard } from "@/components/orycms/analytics-admin"
import { OryCMSDashboard } from "@/components/orycms/dashboard"

export default function OryCMSAnalyticsPage() {
  return (
    <OryCMSDashboard section="Analytics">
      <OryCMSAnalyticsDashboard />
    </OryCMSDashboard>
  )
}
