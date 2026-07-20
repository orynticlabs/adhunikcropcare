import { OryCMSCertificatesAdmin } from "@/components/orycms/certificates-admin"
import { OryCMSDashboard } from "@/components/orycms/dashboard"

export default function CertificatesAdminPage() {
  return <OryCMSDashboard section="Certificates"><OryCMSCertificatesAdmin /></OryCMSDashboard>
}
