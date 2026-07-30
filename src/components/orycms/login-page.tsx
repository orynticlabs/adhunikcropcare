"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, Shield, ShieldCheck } from "lucide-react"
import { OryCMSSessionProvider, useOryCMSSession } from "../../../orycms/hooks"

const trustSignals = [
  {
    icon: ShieldCheck,
    title: "Session-based auth",
    body: "Only an HTTP-only admin session cookie is set after sign-in.",
  },
  {
    icon: Lock,
    title: "bcrypt passwords",
    body: "Admin passwords are stored as adaptive bcrypt hashes.",
  },
  {
    icon: Shield,
    title: "Admin-only access",
    body: "Customer sessions never grant access to this dashboard.",
  },
]

type Step = "login" | "forgot"

export default function OryCMSLogin() {
  return (
    <OryCMSSessionProvider>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </OryCMSSessionProvider>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loaded, user } = useOryCMSSession()
  const [step, setStep] = useState<Step>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded || !user) return
    router.replace(adminDestination(searchParams.get("from")))
  }, [loaded, router, searchParams, user])

  async function handleSignIn() {
    setError(null)
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/orycms/auth/login", {
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const data = (await response.json()) as {
        success: boolean
        error?: { message: string }
      }
      if (!response.ok || !data.success) {
        setError(data.error?.message ?? "Invalid email or password.")
        setIsSubmitting(false)
        return
      }
      router.push(adminDestination(searchParams.get("from")))
    } catch {
      setError("Network error. Please try again.")
      setIsSubmitting(false)
    }
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" && email && password && !isSubmitting) void handleSignIn()
  }

  if (loaded && user) return null

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
                <div className="text-[12px] text-muted-foreground">
                  By OrynticLabs Private Limited
                </div>
              </div>
            </div>
            <span className="rounded-full border border-border bg-surface/80 px-3 py-1 text-[11px]">
              Secure admin access
            </span>
          </div>

          <div className="max-w-[500px]">
            <p className="text-[11.5px] uppercase tracking-[0.12em] text-muted-foreground">
              Operations workspace
            </p>
            <h1 className="mt-3 text-[36px] font-semibold leading-tight tracking-tight xl:text-[42px]">
              Sign in to manage your admin workspace.
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
              This OryCMS console is reserved for authorized admin users only.
            </p>

            <div className="mt-8 grid gap-3">
              {trustSignals.map((signal) => {
                const Icon = signal.icon
                return (
                  <div key={signal.title} className="flex gap-3 rounded-xl border border-border bg-surface/80 p-4 shadow-xs backdrop-blur-sm">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium">{signal.title}</div>
                      <div className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                        {signal.body}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
            <span>30-day admin sessions</span>
            <span className="h-1 w-1 rounded-full bg-border-strong" />
            <span>HTTP-only cookies</span>
            <span className="h-1 w-1 rounded-full bg-border-strong" />
            <span>OryCMS roles</span>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">


        <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 shadow-[0_20px_60px_-20px_rgba(20,24,31,0.18)] lg:p-8">
          {step === "login" ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[22px] font-semibold tracking-tight">Welcome back</h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Sign in with your admin credentials.
                  </p>
                </div>
                <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-foreground text-background">
                  <Lock className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-6 space-y-4" onKeyDown={onKeyDown}>
                <label className="block space-y-1.5">
                  <span className="text-[12.5px] font-medium">Work email</span>
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

                <label className="block space-y-1.5">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-medium">Password</span>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null)
                        setStep("forgot")
                      }}
                      className="text-[11.5px] text-muted-foreground hover:text-foreground"
                    >
                      Forgot password?
                    </button>
                  </span>
                  <span className="relative block">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 pr-10 text-sm outline-none transition focus:border-chart-3 focus:ring-2 focus:ring-chart-3/15"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>

                {error ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[12.5px] text-destructive">
                    {error}
                  </div>
                ) : null}

                <button
                  type="button"
                  className="mt-1 h-10 w-full rounded-lg bg-foreground text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => void handleSignIn()}
                  disabled={!email || !password || isSubmitting}
                >
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </button>
              </div>

              <div className="mt-5 border-t border-border pt-5">
                <p className="text-center text-[12px] text-muted-foreground">
                  No account?{" "}
                  <span className="font-medium text-foreground/70">
                    Contact your workspace owner for an invite.
                  </span>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[22px] font-semibold tracking-tight">Forgot password?</h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Ask your administrator to reset your account.
                  </p>
                </div>
                <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-foreground text-background">
                  <KeyRound className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-border bg-surface-muted/60 p-4 text-[13px] leading-relaxed text-muted-foreground">
                  Self-service password reset is not yet available. Ask your workspace administrator
                  to reset your account from{" "}
                  <span className="font-medium text-foreground/80">Settings → Users</span>.
                </div>

                <button
                  type="button"
                  className="h-10 w-full rounded-lg border border-border bg-background text-[13px] font-medium transition-colors hover:bg-accent"
                  onClick={() => setStep("login")}
                >
                  <ArrowLeft className="mr-2 inline h-4 w-4" />
                  Back to sign in
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function adminDestination(from: string | null) {
  return from?.startsWith("/admin") && !from.startsWith("//") ? from : "/admin/dashboard"
}
