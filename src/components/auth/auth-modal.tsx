"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  X,
} from "lucide-react"
import { AuthSidePanel } from "@/components/auth/auth-side-panel"
import { type AuthView, useAuth } from "@/features/auth/auth-context"

const inputCls = (err?: string) =>
  `h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition-colors focus:border-[#689c30] focus:ring-2 focus:ring-[#689c30]/15 ${
    err ? "border-red-400" : "border-border/60 hover:border-[#689c30]/40"
  }`

const authSubmitButtonCls =
  "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#033927] text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#689c30] hover:!text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#689c30]/30 disabled:opacity-60"

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Special character", ok: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter((check) => check.ok).length
  const colors = ["bg-destructive/70", "bg-[#e9c46a]/80", "bg-[#689c30]/60", "bg-[#689c30]", "bg-[#689c30]"]
  const labels = ["", "Weak", "Fair", "Good", "Strong"]

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              index < score ? colors[score] : "bg-border/50"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Strength: <span className="font-medium text-foreground">{labels[score]}</span>
      </p>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1.5">
            <CheckCircle2
              className={`h-3 w-3 shrink-0 ${check.ok ? "text-[#689c30]" : "text-border"}`}
            />
            <span className="text-[11px] text-muted-foreground">{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SignInForm({ onForgot, onSwitch }: { onForgot: () => void; onSwitch: () => void }) {
  const router = useRouter()
  const { closeAuthModal, consumeAuthRedirectPath, login, resendVerification } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalErr, setGlobalErr] = useState("")
  const [resending, setResending] = useState(false)

  async function resend() {
    setResending(true)
    try {
      setGlobalErr(await resendVerification(email))
    } catch (error) {
      setGlobalErr(error instanceof Error ? error.message : "Could not resend the confirmation email.")
    } finally {
      setResending(false)
    }
  }

  function validate() {
    const nextErrors: Record<string, string> = {}
    if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Enter a valid email"
    if (password.length < 6) nextErrors.password = "Password must be at least 6 characters"
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setGlobalErr("")
    if (!validate()) return
    setLoading(true)

    try {
      await login(email, password)
      const redirectPath = consumeAuthRedirectPath()
      closeAuthModal()
      if (redirectPath) {
        router.push(redirectPath)
      }
    } catch (error) {
      setGlobalErr(error instanceof Error ? error.message : "Could not sign in. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="font-display text-3xl text-[#033927]">Sign in</h2>
        <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to continue</p>
      </div>

      {globalErr ? (
        <div className="mb-5 space-y-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <p>{globalErr}</p>
          {globalErr.includes("Confirm your email") ? (
            <button type="button" onClick={resend} disabled={resending} className="font-semibold text-[#689c30] hover:underline disabled:opacity-60">{resending ? "Sending..." : "Resend verification email"}</button>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">
            Email address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`${inputCls(errors.email)} pl-10`}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          {errors.email ? <p className="text-xs text-red-500">{errors.email}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground/80">
              Password <span className="text-red-500">*</span>
            </label>
            <button type="button" onClick={onForgot} className="text-xs text-[#689c30] hover:underline">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${inputCls(errors.password)} pl-10 pr-10`}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass((value) => !value)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black transition-colors hover:text-[#689c30]"
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? <p className="text-xs text-red-500">{errors.password}</p> : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={authSubmitButtonCls}
        >
          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
          ) : (
            <>
              Sign In <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-[#689c30] hover:underline">
          Sign up free
        </button>
      </p>
    </>
  )
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    setMessage("")
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address.")
      return
    }
    setLoading(true)
    try {
      setMessage(await forgotPassword(email))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not request a password reset.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-7">
        <h2 className="font-display text-3xl text-[#033927]">Forgot password</h2>
        <p className="mt-1 text-sm text-muted-foreground">Enter your customer email and we will send a secure reset link.</p>
      </div>
      {message ? <div className="mb-5 rounded-xl border border-[#689c30]/25 bg-[#689c30]/10 px-4 py-3 text-sm text-[#033927]">{message}</div> : null}
      {error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">Email address <span className="text-red-500">*</span></label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={`${inputCls(error)} pl-10`} placeholder="you@example.com" autoComplete="email" />
          </div>
        </div>
        <button type="submit" disabled={loading} className={authSubmitButtonCls}>{loading ? "Sending..." : "Send reset link"}</button>
      </form>
      <button type="button" onClick={onBack} className="mt-6 text-sm font-semibold text-[#689c30] hover:underline">Back to sign in</button>
    </>
  )
}

function SignUpForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter()
  const { closeAuthModal, consumeAuthRedirectPath, signup } = useAuth()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalErr, setGlobalErr] = useState("")

  function validate() {
    const nextErrors: Record<string, string> = {}
    if (!firstName.trim()) nextErrors.firstName = "Required"
    if (!lastName.trim()) nextErrors.lastName = "Required"
    if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Enter a valid email"
    if (!/^\d{10}$/.test(phone)) nextErrors.phone = "Enter a valid 10-digit number"
    if (password.length < 8) nextErrors.password = "Minimum 8 characters"
    if (password !== confirm) nextErrors.confirm = "Passwords do not match"
    if (!agree) nextErrors.agree = "Please accept the terms"
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setGlobalErr("")
    if (!validate()) return
    setLoading(true)

    try {
      const result = await signup({ firstName, lastName, email, phone, password })
      consumeAuthRedirectPath()
      closeAuthModal()
      router.push(`/verify-email?sent=1&email=${encodeURIComponent(result.email)}`)
    } catch (error) {
      setGlobalErr(error instanceof Error ? error.message : "Could not create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-7">
        <h2 className="font-display text-3xl text-[#033927]">Create account</h2>
        <p className="mt-1 text-sm text-muted-foreground">Fill in your details to get started</p>
      </div>

      {globalErr ? (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {globalErr}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground/80">
              First name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className={`${inputCls(errors.firstName)} pl-10`}
                placeholder="Ramesh"
              />
            </div>
            {errors.firstName ? <p className="text-xs text-red-500">{errors.firstName}</p> : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground/80">
              Last name <span className="text-red-500">*</span>
            </label>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className={inputCls(errors.lastName)}
              placeholder="Patel"
            />
            {errors.lastName ? <p className="text-xs text-red-500">{errors.lastName}</p> : null}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">
            Email address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`${inputCls(errors.email)} pl-10`}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          {errors.email ? <p className="text-xs text-red-500">{errors.email}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">
            Mobile number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <span className="flex h-11 items-center rounded-xl border border-border/60 bg-accent/20 px-3 text-sm font-medium text-foreground/70 select-none">
              +91
            </span>
            <div className="relative flex-1">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                maxLength={10}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                className={`${inputCls(errors.phone)} pl-10`}
                placeholder="9876543210"
              />
            </div>
          </div>
          {errors.phone ? <p className="text-xs text-red-500">{errors.phone}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${inputCls(errors.password)} pl-10 pr-10`}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPass((value) => !value)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black transition-colors hover:text-[#689c30]"
              aria-label={showPass ? "Hide" : "Show"}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? <p className="text-xs text-red-500">{errors.password}</p> : null}
          <PasswordStrength password={password} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">
            Confirm password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showConf ? "text" : "password"}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={`${inputCls(errors.confirm)} pl-10 pr-10`}
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConf((value) => !value)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black transition-colors hover:text-[#689c30]"
              aria-label={showConf ? "Hide" : "Show"}
            >
              {showConf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirm ? <p className="text-xs text-red-500">{errors.confirm}</p> : null}
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agree}
              onChange={(event) => setAgree(event.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border accent-[#033927]"
            />
            <span className="text-xs leading-relaxed text-muted-foreground">
              I agree to the{" "}
              <Link href="/terms-and-conditions" className="font-medium text-[#689c30] hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="font-medium text-[#689c30] hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agree ? <p className="ml-7 mt-1 text-xs text-red-500">{errors.agree}</p> : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={authSubmitButtonCls}
        >
          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
          ) : (
            <>
              Create Account <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-[#689c30]" />
        Your data is safe and never shared with third parties
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-[#689c30] hover:underline">
          Sign in
        </button>
      </p>
    </>
  )
}

export function AuthModal() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const handledAuthRequest = useRef<string | null>(null)
  const { authView, closeAuthModal, isAuthModalOpen, openAuthModal, setAuthView } = useAuth()

  useEffect(() => {
    const requestedView = searchParams.get("auth")
    if (requestedView !== "signin" && requestedView !== "signup" && requestedView !== "forgot") {
      handledAuthRequest.current = null
      return
    }
    const requestKey = searchParams.toString()
    if (handledAuthRequest.current === requestKey) return
    handledAuthRequest.current = requestKey
    const requestedFrom = searchParams.get("from")
    const redirectTo = requestedFrom?.startsWith("/") && !requestedFrom.startsWith("//") ? requestedFrom : undefined
    openAuthModal(requestedView, { redirectTo })

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete("auth")
    nextParams.delete("from")
    const nextQuery = nextParams.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [openAuthModal, pathname, router, searchParams])

  useEffect(() => {
    if (!isAuthModalOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAuthModal()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [closeAuthModal, isAuthModalOpen])

  if (!isAuthModalOpen) {
    return null
  }

  const isSignIn = authView !== "signup"
  const dialogLabel = authView === "forgot" ? "Forgot password" : authView === "signin" ? "Sign in" : "Create account"

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label={dialogLabel}>
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(3,32,22,0.52)] backdrop-blur-[2px]"
        onClick={closeAuthModal}
        aria-label="Close authentication dialog"
      />

      <div className="relative z-10 grid max-h-[min(92vh,980px)] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/25 bg-card shadow-[0_28px_90px_rgba(1,20,14,0.34)] lg:grid-cols-[0.95fr_1.05fr]">
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[rgba(255,255,255,0.85)] text-foreground/70 shadow-sm backdrop-blur transition hover:border-[#689c30]/30 hover:text-[#689c30]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <AuthSidePanel
          eyebrow={isSignIn ? "Member access" : "Grower network"}
          title={isSignIn ? <>Welcome back<br />to Adhunik</> : <>Join 50,000+<br />farmers today</>}
          description={
            isSignIn
              ? "Access your orders, manage addresses, and explore premium agri products tailored for Indian farmers."
              : "Get exclusive access to premium organic products, expert crop advice, and member-only discounts."
          }
          items={
            isSignIn
              ? [
                  "ISO 9001 certified agricultural products",
                  "Reliable pan-India delivery for every order",
                  "24x7 farmer support when you need guidance",
                ]
              : [
                  "Free shipping on your first order",
                  "Early access to new launches and seasonal offers",
                  "Personalised crop recommendations for your needs",
                  "Loyalty rewards on every purchase you place",
                ]
          }
          itemIcon={isSignIn ? ShieldCheck : CheckCircle2}
        />

        <div className="max-h-[92vh] overflow-y-auto bg-card px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          {authView !== "forgot" ? <div className="mb-6 flex items-center rounded-full bg-muted/45 p-1">
            {([
              { id: "signin", label: "Sign in" },
              { id: "signup", label: "Create account" },
            ] as { id: AuthView; label: string }[]).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAuthView(tab.id)}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  authView === tab.id
                    ? "bg-[#033927] text-white shadow-sm"
                    : "text-muted-foreground hover:text-[#689c30]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div> : null}

          {authView === "signin" ? (
            <SignInForm onForgot={() => setAuthView("forgot")} onSwitch={() => setAuthView("signup")} />
          ) : authView === "signup" ? (
            <SignUpForm onSwitch={() => setAuthView("signin")} />
          ) : <ForgotPasswordForm onBack={() => setAuthView("signin")} />}
        </div>
      </div>
    </div>
  )
}
