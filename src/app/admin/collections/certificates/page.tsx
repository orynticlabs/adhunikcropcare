import { OryCMSCertificatesAdmin } from "@/components/orycms/certificates-admin"
import { OryCMSDashboard } from "@/components/orycms/dashboard"

export default function CertificatesCollectionPage() {
  return (
    <OryCMSDashboard section="Certificates">
      <OryCMSCertificatesAdmin />
    </OryCMSDashboard>
  )
}
