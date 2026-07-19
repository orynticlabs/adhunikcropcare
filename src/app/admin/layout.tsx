import "@ory-cms/next/styles.css"
import "./orycms-admin.css"

export default function OryCMSAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="orycms-admin">{children}</div>
}
