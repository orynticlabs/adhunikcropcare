import { OryCMSContactEnquiriesAdmin } from "@/components/orycms/contact-enquiries-admin"
import { OryCMSDashboard } from "@/components/orycms/dashboard"

export default function OryCMSContactPage() {
  return (
    <OryCMSDashboard section="Contact">
      <OryCMSContactEnquiriesAdmin />
    </OryCMSDashboard>
  )
}
