"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, CheckCircle2, Eye, EyeOff, Leaf, Lock, Mail, Phone, User } from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"
import { useAuth } from "@/features/auth/auth-context"

type Mode = "login" | "signup" | "forgot" | "reset" | "verify" | "logout"

const inputCls =
  "h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-sm outline-none transition focus:border-[#689c30] focus:ring-2 focus:ring-[#689c30]/15"
const buttonCls =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#033927] px-5 text-sm font-bold text-white shadow-soft transition-colors hover:bg-[#689c30] hover:!text-black disabled:opacity-60"

export function FrontendAuthPage({ mode }: { mode: Mode }) {
  return (
    <Suspense fallback={<AuthShell><AuthCard title="Loading" subtitle="Preparing secure form..." /></AuthShell>}>
      <AuthFlow mode={mode} />
    </Suspense>
  )
}

function AuthFlow({ mode }: { mode: Mode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { forgotPassword, loadingUser, login, logout, resetPassword, signup, user, verifyEmail } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    confirm: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    phone: "",
  })
  const token = searchParams.get("token") ?? ""
  const requestedFrom = safePath(searchParams.get("from"))
  const from = requestedFrom ?? "/account"
  const fromQuery = requestedFrom ? `?from=${encodeURIComponent(requestedFrom)}` : ""

  useEffect(() => {
    if (mode !== "logout") return
    void logout().finally(() => router.replace("/"))
  }, [logout, mode, router])

  useEffect(() => {
    if ((mode === "login" || mode === "signup") && requestedFrom === "/checkout") {
      router.replace("/checkout")
    }
  }, [mode, requestedFrom, router])

  useEffect(() => {
    if (loadingUser || !user) return
    if (mode === "login" || mode === "signup") {
      router.replace(from)
    }
  }, [from, loadingUser, mode, router, user])

  useEffect(() => {
    if (mode !== "verify" || !token) return
    setLoading(true)
    verifyEmail(token)
      .then(() => setMessage("Email verified successfully."))
      .catch((error) => setMessage(error instanceof Error ? error.message : "Verification failed."))
      .finally(() => setLoading(false))
  }, [mode, token, verifyEmail])

  if (mode === "logout") {
    return (
      <AuthShell>
        <AuthCard title="Signing out" subtitle="Closing your secure session..." />
      </AuthShell>
    )
  }

  if ((mode === "login" || mode === "signup") && requestedFrom === "/checkout") {
    return (
      <AuthShell>
        <AuthCard title="Opening secure checkout" subtitle="Please sign in using the account popup..." />
      </AuthShell>
    )
  }

  if ((mode === "login" || mode === "signup") && (loadingUser || user)) {
    return (
      <AuthShell>
        <AuthCard title="Checking session" subtitle="Redirecting you securely..." />
      </AuthShell>
    )
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setMessage("")
    setLoading(true)
    try {
      if (mode === "login") {
        await login(form.email, form.password)
        router.push(from)
      }
      if (mode === "signup") {
        if (form.password !== form.confirm) throw new Error("Passwords do not match.")
        const result = await signup(form)
        if (requestedFrom) {
          router.push(requestedFrom)
        } else if (result.verifyToken) {
          setMessage(`/verify-email?token=${encodeURIComponent(result.verifyToken)}`)
        } else {
          router.push(from)
        }
      }
      if (mode === "forgot") {
        const result = await forgotPassword(form.email)
        setMessage(result.resetToken ? `/reset-password?token=${encodeURIComponent(result.resetToken)}` : "If this email exists, reset instructions are ready.")
      }
      if (mode === "reset") {
        if (!token) throw new Error("Reset token is missing.")
        if (form.password !== form.confirm) throw new Error("Passwords do not match.")
        await resetPassword(token, form.password)
        router.push("/login")
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const title =
    mode === "signup" ? "Create your account" :
    mode === "forgot" ? "Forgot password" :
    mode === "reset" ? "Reset password" :
    mode === "verify" ? "Verify email" :
    user ? "Welcome back" : "Sign in"
  const subtitle =
    mode === "signup" ? "Join Adhunik Crop Care for faster orders and saved details." :
    mode === "forgot" ? "Enter your email to create a secure password reset link." :
    mode === "reset" ? "Choose a new password for your account." :
    mode === "verify" ? "Confirming your email address." :
    "Access your account, orders, wishlist, and saved addresses."

  return (
    <AuthShell>
      <AuthCard title={title} subtitle={subtitle}>
        {mode === "verify" ? (
          <div className="space-y-5">
            <StatusMessage message={message || (loading ? "Verifying..." : token ? "Ready." : "Verification token is missing.")} />
            <Link href="/account" className={buttonCls}>Continue to account <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field icon={User} label="First name" value={form.firstName} onChange={(firstName) => setForm((p) => ({ ...p, firstName }))} required />
                <Field label="Last name" value={form.lastName} onChange={(lastName) => setForm((p) => ({ ...p, lastName }))} required />
              </div>
            ) : null}

            {mode !== "reset" ? (
              <Field icon={Mail} label="Email" type="email" value={form.email} onChange={(email) => setForm((p) => ({ ...p, email }))} required />
            ) : null}

            {mode === "signup" ? (
              <Field icon={Phone} label="Mobile number" type="tel" value={form.phone} onChange={(phone) => setForm((p) => ({ ...p, phone: phone.replace(/\D/g, "").slice(0, 10) }))} required />
            ) : null}

            {mode !== "forgot" ? (
              <PasswordField show={showPassword} setShow={setShowPassword} value={form.password} onChange={(password) => setForm((p) => ({ ...p, password }))} />
            ) : null}

            {mode === "signup" || mode === "reset" ? (
              <Field icon={Lock} label="Confirm password" type="password" value={form.confirm} onChange={(confirm) => setForm((p) => ({ ...p, confirm }))} required />
            ) : null}

            {mode === "login" ? (
              <div className="text-right">
                <Link href="/forgot-password" className="text-xs font-semibold text-[#689c30] hover:underline">Forgot password?</Link>
              </div>
            ) : null}

            {message ? <StatusMessage message={message} /> : null}

            <button type="submit" disabled={loading} className={buttonCls}>
              {loading ? "Please wait..." : mode === "signup" ? "Create Account" : mode === "forgot" ? "Create reset link" : mode === "reset" ? "Save new password" : "Sign In"}
              {!loading ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>New here? <Link href={`/signup${fromQuery}`} className="font-semibold text-[#689c30] hover:underline">Create account</Link></>
          ) : mode === "signup" ? (
            <>Already have an account? <Link href={`/login${fromQuery}`} className="font-semibold text-[#689c30] hover:underline">Sign in</Link></>
          ) : (
            <Link href={`/login${fromQuery}`} className="font-semibold text-[#689c30] hover:underline">Back to login</Link>
          )}
        </div>
      </AuthCard>
    </AuthShell>
  )
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Header />
      <CartDrawer />
      <main className="px-4 pb-16 pt-32 sm:pt-40">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-luxe lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden bg-[linear-gradient(135deg,#033927_0%,#689c30_100%)] p-10 text-white lg:block">
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Leaf className="h-6 w-6" />
                </div>
                <h1 className="font-display text-4xl leading-tight">Secure account access for Adhunik farmers.</h1>
                <p className="mt-4 text-sm leading-6 text-white/75">Manage profile, orders, wishlist, saved address, invoices, shipment tracking, and reorder from one place.</p>
              </div>
              <p className="text-xs text-white/65">Protected with HttpOnly cookies, CSRF checks, and refresh-token sessions.</p>
            </div>
          </div>
          <div className="p-6 sm:p-10">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function AuthCard({ children, subtitle, title }: { children?: React.ReactNode; subtitle: string; title: string }) {
  return (
    <div>
      <h2 className="font-display text-3xl text-[#033927]">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  onChange,
  required,
  type = "text",
  value,
}: {
  icon?: React.ElementType
  label: string
  onChange: (value: string) => void
  required?: boolean
  type?: string
  value: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground/80">{label}{required ? " *" : ""}</span>
      <span className="relative block">
        {Icon ? <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /> : null}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} ${Icon ? "pl-10" : ""}`} required={required} />
      </span>
    </label>
  )
}

function PasswordField({ onChange, setShow, show, value }: { onChange: (value: string) => void; setShow: (show: boolean) => void; show: boolean; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground/80">Password *</span>
      <span className="relative block">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} pl-10 pr-10`} required />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black transition-colors hover:text-[#689c30]" aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
      <p className="mt-1.5 text-xs text-muted-foreground">Minimum 8 characters with one uppercase letter and one number.</p>
    </label>
  )
}

function StatusMessage({ message }: { message: string }) {
  const isPath = message.startsWith("/")
  return (
    <div className="rounded-2xl border border-[#689c30]/20 bg-[#689c30]/8 p-3 text-sm text-foreground">
      <div className="flex gap-2">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#689c30]" />
        <div className="min-w-0">
          <p>{isPath ? "Development link:" : message}</p>
          {isPath ? <Link href={message} className="break-all font-semibold text-[#689c30] hover:underline">{message}</Link> : null}
        </div>
      </div>
    </div>
  )
}

function safePath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null
  return value
}
