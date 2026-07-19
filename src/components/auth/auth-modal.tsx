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
  const { closeAuthModal, consumeAuthRedirectPath, login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalErr, setGlobalErr] = useState("")

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

function ResetPasswordForm({ onComplete, token }: { onComplete: () => void; token: string }) {
  const { resetPassword } = useAuth()
  const [password, setPasswordValue] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    if (!token) return setError("The password reset link is missing or invalid.")
    if (password !== confirm) return setError("Passwords do not match.")
    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return setError("Password must include 8 characters, an uppercase letter, and a number.")
    }
    setLoading(true)
    try {
      await resetPassword(token, password)
      onComplete()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not reset the password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-7">
        <h2 className="font-display text-3xl text-[#033927]">Reset password</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your customer account.</p>
      </div>
      {error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">New password <span className="text-red-500">*</span></label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPasswordValue(event.target.value)} className={`${inputCls(error)} pl-10 pr-10`} autoComplete="new-password" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">Confirm password <span className="text-red-500">*</span></label>
          <input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className={inputCls(error)} autoComplete="new-password" />
        </div>
        <PasswordStrength password={password} />
        <button type="submit" disabled={loading || !token} className={authSubmitButtonCls}>{loading ? "Saving..." : "Save new password"}</button>
      </form>
      <button type="button" onClick={onComplete} className="mt-6 text-sm font-semibold text-[#689c30] hover:underline">Back to sign in</button>
    </>
  )
}

function SignUpForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter()
  const { closeAuthModal, consumeAuthRedirectPath, sendSignupOtp, signup, verifySignupOtp } = useAuth()
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
  const [otp, setOtp] = useState("")
  const [otpMessage, setOtpMessage] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [emailVerificationToken, setEmailVerificationToken] = useState("")

  function validate() {
    const nextErrors: Record<string, string> = {}
    if (!firstName.trim()) nextErrors.firstName = "Required"
    if (!lastName.trim()) nextErrors.lastName = "Required"
    if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Enter a valid email"
    if (!emailVerificationToken) nextErrors.otp = "Verify your email OTP first"
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
      await signup({ firstName, lastName, email, emailVerificationToken, phone, password })
      const redirectPath = consumeAuthRedirectPath()
      closeAuthModal()
      if (redirectPath) router.push(redirectPath)
    } catch (error) {
      setGlobalErr(error instanceof Error ? error.message : "Could not create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOtp() {
    setGlobalErr("")
    setOtpMessage("")
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors((current) => ({ ...current, email: "Enter a valid email" }))
      return
    }
    setSendingOtp(true)
    try {
      setOtpMessage(await sendSignupOtp(email))
      setOtp("")
      setEmailVerificationToken("")
    } catch (error) {
      setGlobalErr(error instanceof Error ? error.message : "Could not send OTP.")
    } finally {
      setSendingOtp(false)
    }
  }

  async function handleVerifyOtp() {
    setGlobalErr("")
    if (!/^\d{6}$/.test(otp)) {
      setErrors((current) => ({ ...current, otp: "Enter the 6-digit OTP" }))
      return
    }
    setVerifyingOtp(true)
    try {
      setEmailVerificationToken(await verifySignupOtp(email, otp))
      setOtpMessage("Email verified. You can now create your account.")
      setErrors((current) => ({ ...current, otp: "" }))
    } catch (error) {
      setGlobalErr(error instanceof Error ? error.message : "Could not verify OTP.")
    } finally {
      setVerifyingOtp(false)
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
          <div className="flex flex-col gap-2 min-[420px]:flex-row">
            <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setEmailVerificationToken(""); setOtp(""); setOtpMessage("") }}
              className={`${inputCls(errors.email)} pl-10`}
              placeholder="you@example.com"
              autoComplete="email"
            />
            </div>
            <button type="button" onClick={handleSendOtp} disabled={sendingOtp || verifyingOtp || Boolean(emailVerificationToken)} className="h-11 w-full shrink-0 rounded-xl bg-[#033927] px-4 text-xs font-bold text-white disabled:opacity-60 min-[420px]:w-auto">
              {sendingOtp ? "Sending..." : emailVerificationToken ? "Verified" : otpMessage ? "Resend OTP" : "Send OTP"}
            </button>
          </div>
          {errors.email ? <p className="text-xs text-red-500">{errors.email}</p> : null}
          {otpMessage ? <p className="text-xs text-[#689c30]">{otpMessage}</p> : null}
        </div>

        {otpMessage && !emailVerificationToken ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground/80">Email OTP <span className="text-red-500">*</span></label>
            <div className="flex flex-col gap-2 min-[420px]:flex-row">
              <input inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} className={inputCls(errors.otp)} placeholder="6-digit OTP" />
              <button type="button" onClick={handleVerifyOtp} disabled={verifyingOtp || sendingOtp || otp.length !== 6} className="h-11 w-full shrink-0 rounded-xl border border-[#689c30] px-4 text-xs font-bold text-[#033927] disabled:opacity-60 min-[420px]:w-auto">{verifyingOtp ? "Verifying..." : "Verify OTP"}</button>
            </div>
            <p className="text-xs text-muted-foreground">The OTP expires 5 minutes after it is sent.</p>
            {errors.otp ? <p className="text-xs text-red-500">{errors.otp}</p> : null}
          </div>
        ) : null}

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
  const searchParams = useSearchParams()
  const handledAuthRequest = useRef<string | null>(null)
  const [resetToken, setResetToken] = useState("")
  const { authView, closeAuthModal, isAuthModalOpen, openAuthModal, setAuthView } = useAuth()

  useEffect(() => {
    const requestedView = searchParams.get("auth")
    if (requestedView !== "signin" && requestedView !== "signup" && requestedView !== "forgot" && requestedView !== "reset") {
      handledAuthRequest.current = null
      return
    }
    const requestKey = searchParams.toString()
    if (handledAuthRequest.current === requestKey) return
    handledAuthRequest.current = requestKey
    const requestedFrom = searchParams.get("from")
    const redirectTo = requestedFrom?.startsWith("/") && !requestedFrom.startsWith("//") ? requestedFrom : undefined
    if (requestedView === "reset") {
      const token = searchParams.get("token") ?? ""
      window.setTimeout(() => setResetToken(token), 0)
    }
    openAuthModal(requestedView, { redirectTo })

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete("auth")
    nextParams.delete("from")
    nextParams.delete("token")
    const nextQuery = nextParams.toString()
    window.history.replaceState(window.history.state, "", nextQuery ? `${pathname}?${nextQuery}` : pathname)
  }, [openAuthModal, pathname, searchParams])

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
  const dialogLabel = authView === "forgot" ? "Forgot password" : authView === "reset" ? "Reset password" : authView === "signin" ? "Sign in" : "Create account"

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-label={dialogLabel}>
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(3,32,22,0.52)] backdrop-blur-[2px]"
        onClick={closeAuthModal}
        aria-label="Close authentication dialog"
      />

      <div className="relative z-10 grid h-[100dvh] max-h-[100dvh] w-full max-w-5xl overflow-hidden border border-white/25 bg-card shadow-[0_28px_90px_rgba(1,20,14,0.34)] sm:h-auto sm:max-h-[min(92dvh,980px)] sm:rounded-[2rem] lg:grid-cols-[0.95fr_1.05fr]">
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

        <div className="scrollbar-none max-h-[100dvh] overflow-y-auto bg-card px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:max-h-[92dvh] sm:px-8 sm:pb-8 sm:pt-6 lg:px-10 lg:pb-10 lg:pt-8">
          <div className={`mb-6 flex items-center gap-2 sm:gap-3 ${authView === "forgot" || authView === "reset" ? "justify-end" : ""}`}>
            {authView !== "forgot" && authView !== "reset" ? (
              <div className="flex min-w-0 flex-1 items-center rounded-full bg-muted/45 p-1">
                {([
                  { id: "signin", label: "Sign in" },
                  { id: "signup", label: "Create account" },
                ] as { id: AuthView; label: string }[]).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAuthView(tab.id)}
                    className={`min-w-0 flex-1 rounded-full px-2.5 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                      authView === tab.id
                        ? "bg-[#033927] text-white shadow-sm"
                        : "text-muted-foreground hover:text-[#689c30]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              onClick={closeAuthModal}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-foreground/70 shadow-sm transition hover:border-[#689c30]/30 hover:text-[#689c30] sm:h-10 sm:w-10"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>

          {authView === "signin" ? (
            <SignInForm onForgot={() => setAuthView("forgot")} onSwitch={() => setAuthView("signup")} />
          ) : authView === "signup" ? (
            <SignUpForm onSwitch={() => setAuthView("signin")} />
          ) : authView === "forgot" ? (
            <ForgotPasswordForm onBack={() => setAuthView("signin")} />
          ) : <ResetPasswordForm token={resetToken} onComplete={() => { setResetToken(""); setAuthView("signin") }} />}
        </div>
      </div>
    </div>
  )
}
