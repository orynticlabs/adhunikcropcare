import { OryCMSDashboard } from "@/components/orycms/dashboard"
import { OryCMSVerificationList } from "@/components/orycms/verification-admin"

export default function OryCMSVerificationPage() {
  return (
    <OryCMSDashboard section="Product Verification">
      <OryCMSVerificationList />
    </OryCMSDashboard>
  )
}
