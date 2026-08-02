import { OryCMSAuditLogsList } from "@/components/orycms/audit-logs-admin"

export const metadata = {
  title: "Audit Logs · OryCMS Admin",
  description: "View OryCMS administration activity logs and audit trails.",
}

export default function AuditLogsPage() {
  return <OryCMSAuditLogsList />
}
