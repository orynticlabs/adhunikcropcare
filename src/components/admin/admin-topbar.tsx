import { LogOut, Shield } from "lucide-react"
import { logoutAction } from "@/app/admin/actions"

type AdminTopbarProps = {
  email: string
}

export function AdminTopbar({ email }: AdminTopbarProps) {
  return (
    <header className="border-b border-border/70 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
            <Shield className="h-4 w-4 text-[--leaf]" />
            Protected admin session
          </div>
          <div className="mt-1 text-sm text-foreground/70">{email}</div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-[--leaf]/40 hover:text-[--leaf]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </header>
  )
}

