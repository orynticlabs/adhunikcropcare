import "@ory-cms/next/styles.css"
import "./orycms-admin.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin - AdhunikCropCare",
  icons: {
    icon: "/orycms/img/favicon.png",
    shortcut: "/orycms/img/favicon.png",
    apple: "/orycms/img/favicon.png",
  },
}

export default function OryCMSAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="orycms-admin">{children}</div>
}
