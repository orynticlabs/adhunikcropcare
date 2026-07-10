import type { ReactNode } from "react"
import type { AdminSession } from "@/lib/cms/types"
import { AdminSidebar } from "./admin-sidebar"
import { AdminTopbar } from "./admin-topbar"

type AdminShellProps = {
  children: ReactNode
  session: AdminSession
}

export function AdminShell({ children, session }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(104,156,48,0.15),transparent_30%),linear-gradient(180deg,#f4f7f4_0%,#eef3ef_100%)] text-foreground">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[18rem_1fr]">
        <AdminSidebar />
        <div className="flex min-h-screen flex-col">
          <AdminTopbar email={session.email} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

