"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, Mail, Shield, UserPlus } from "lucide-react"
import { OryCMSSessionProvider, useOryCMSSession } from "../../../orycms/hooks"

const setupSignals = [
  {
    icon: UserPlus,
    title: "Owner account",
    body: "The first account gets Owner-level access across users, content, and settings.",
  },
  {
    icon: Lock,
    title: "Secure by default",
    body: "Passwords are hashed with bcrypt and admin sessions use HTTP-only cookies.",
  },
  {
    icon: Shield,
    title: "One-time setup",
    body: "This screen disappears after your Owner account is created.",
  },
  {
    icon: CheckCircle2,
    title: "Sign in to continue",
    body: "Once setup is complete, sign in on the admin login screen.",
  },
]

export default function OryCMSSetup() {
  return (
    <OryCMSSessionProvider>
      <SetupRedirectGate />
    </OryCMSSessionProvider>
  )
}

function SetupRedirectGate() {
  const router = useRouter()
  const { loaded, user } = useOryCMSSession()

  useEffect(() => {
    if (loaded && user) router.replace("/admin")
  }, [loaded, router, user])

  if (loaded && user) return null

  return <SetupForm />
}

function SetupForm() {
  const router = useRouter()
  const [confirm, setConfirm] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetch("/api/orycms/auth/setup-status")
      .then((response) => response.json())
      .then((data: { success: boolean; data?: { initialized: boolean } }) => {
        if (data.success && data.data?.initialized) router.replace("/admin/login")
      })
      .catch(() => {})
  }, [router])

  const passwordMismatch = confirm.length > 0 && password !== confirm
  const canSubmit = email.trim().length > 0 && password.length >= 8 && password === confirm && !isSubmitting

  async function handleSubmit() {
    setError(null)
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/orycms/auth/setup", {
        body: JSON.stringify({ email: email.trim(), password }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const data = (await response.json()) as { success: boolean; error?: { message: string } }
      if (!response.ok || !data.success) {
        setError(data.error?.message ?? "Setup failed. Please try again.")
        setIsSubmitting(false)
        return
      }
      router.replace("/admin/login")
    } catch {
      setError("Network error. Please try again.")
      setIsSubmitting(false)
    }
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" && canSubmit) void handleSubmit()
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="relative hidden overflow-hidden border-r border-border lg:flex lg:w-[52%] lg:flex-col lg:justify-between xl:w-[55%]">
        <div className="absolute inset-0 bg-surface-muted/60" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-accent/60 to-transparent" />

        <div className="relative flex flex-1 flex-col justify-between px-10 py-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/orycms/img/favicon.png" alt="" className="h-9 w-9 object-contain" />
              <div>
                <div className="text-[18px] font-semibold tracking-tight">OryCMS</div>
                <div className="text-[12px] text-muted-foreground">By OrynticLabs Private Limited</div>
              </div>
            </div>
            <span className="rounded-full border border-border bg-surface/80 px-3 py-1 text-[11px]">
              First-time setup
            </span>
          </div>

          <div className="max-w-[500px]">
            <p className="text-[11.5px] uppercase tracking-[0.12em] text-muted-foreground">Installation</p>
            <h1 className="mt-3 text-[36px] font-semibold leading-tight tracking-tight xl:text-[42px]">
              Create your Owner account to unlock OryCMS.
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
              OryCMS requires one Owner account before it can be used. You can invite additional operators from Users later.
            </p>

            <div className="mt-8 grid gap-3">
              {setupSignals.map((signal) => {
                const Icon = signal.icon
                return (
                  <div key={signal.title} className="flex gap-3 rounded-xl border border-border bg-surface/80 p-4 shadow-xs backdrop-blur-sm">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium">{signal.title}</div>
                      <div className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{signal.body}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
            <span>One-time setup</span>
            <span className="h-1 w-1 rounded-full bg-border-strong" />
            <span>Owner-level access</span>
            <span className="h-1 w-1 rounded-full bg-border-strong" />
            <span>Admin-only sessions</span>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="mb-8 text-center lg:hidden">
          <div className="text-[20px] font-semibold tracking-tight">OryCMS</div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">by OrynticLabs Private Limited</div>
        </div>

        <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 shadow-[0_20px_60px_-20px_rgba(20,24,31,0.18)] lg:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight">Create Owner account</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">This will be the primary administrator.</p>
            </div>
            <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-foreground text-background">
              <KeyRound className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-6 space-y-4" onKeyDown={onKeyDown}>
            <label className="block space-y-1.5">
              <span className="text-[12.5px] font-medium">Email address</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-chart-3 focus:ring-2 focus:ring-chart-3/15"
                  placeholder="you@company.com"
                  autoComplete="email"
                  autoFocus
                  suppressHydrationWarning
                />
              </span>
            </label>

            <PasswordField
              autoComplete="new-password"
              label="Password"
              placeholder="At least 8 characters"
              show={showPassword}
              toggle={() => setShowPassword((value) => !value)}
              value={password}
              onChange={setPassword}
            />
            {password.length > 0 && password.length < 8 ? (
              <p className="-mt-2 text-[12px] text-warning">Use at least 8 characters.</p>
            ) : null}

            <PasswordField
              autoComplete="new-password"
              label="Confirm password"
              placeholder="Re-enter password"
              show={showConfirm}
              toggle={() => setShowConfirm((value) => !value)}
              value={confirm}
              onChange={setConfirm}
            />
            {passwordMismatch ? (
              <p className="-mt-2 text-[12px] text-destructive">Passwords do not match.</p>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[12.5px] text-destructive">
                {error}
              </div>
            ) : null}

            <button
              type="button"
              className="mt-1 h-10 w-full rounded-lg bg-foreground text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void handleSubmit()}
              disabled={!canSubmit}
            >
              {isSubmitting ? "Creating account…" : "Create Owner account"}
            </button>
          </div>

          <div className="mt-5 text-center text-[12px] text-muted-foreground">
            Already have an account?{" "}
            <button type="button" onClick={() => router.push("/admin/login")} className="font-medium text-foreground/80 hover:text-foreground">
              Sign in instead
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

function PasswordField({
  autoComplete,
  label,
  onChange,
  placeholder,
  show,
  toggle,
  value,
}: {
  autoComplete: string
  label: string
  onChange: (value: string) => void
  placeholder: string
  show: boolean
  toggle: () => void
  value: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12.5px] font-medium">{label}</span>
      <span className="relative block">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 pr-10 text-sm outline-none transition focus:border-chart-3 focus:ring-2 focus:ring-chart-3/15"
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={show ? `Hide ${label}` : `Show ${label}`}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  )
}
