"use client"

import { useActionState } from "react"
import { ShieldCheck } from "lucide-react"
import { loginAction } from "@/app/admin/actions"
import { initialCmsActionState } from "@/lib/cms/forms"

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialCmsActionState)

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@orycms.local"
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-muted-foreground/70 focus:border-[--leaf]"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-muted-foreground/70 focus:border-[--leaf]"
        />
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[--moss] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[--leaf] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ShieldCheck className="h-4 w-4" />
        {pending ? "Signing in..." : "Open admin"}
      </button>
    </form>
  )
}

