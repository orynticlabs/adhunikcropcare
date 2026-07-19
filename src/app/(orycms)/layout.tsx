import "@ory-cms/next/styles.css"
import "../admin/orycms-admin.css"

export default function OryCMSLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="orycms-admin">{children}</div>
}
