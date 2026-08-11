"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { CheckCircle2, AlertCircle, ShieldCheck, Loader2, ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react"

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const resolvedParams = use(searchParams)
  const token = resolvedParams?.token ?? ""

  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userFullName, setUserFullName] = useState("")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setValid(false)
      setErrorMessage("No password reset token provided in the URL.")
      return
    }

    setLoading(true)
    fetch(`/api/orycms/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json()
        if (res.ok && json.success && json.data) {
          setValid(true)
          setUserEmail(json.data.email || "")
          setUserFullName(json.data.fullName || "")
        } else {
          setValid(false)
          setErrorMessage(json.error?.message || "Password reset token is invalid or expired.")
        }
      })
      .catch((err) => {
        setValid(false)
        setErrorMessage(err instanceof Error ? err.message : "Failed to validate password reset token.")
      })
      .finally(() => setLoading(false))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.")
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }

    setSubmitting(true)
    setErrorMessage("")
    try {
      const res = await fetch("/api/orycms/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to reset password.")
      }
      setSuccess(true)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to reset password.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-foreground grid place-items-center text-white shadow-md">
          <ShieldCheck className="h-8 w-8 text-[#FF5A20]" />
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-foreground">
          OryCMS Admin Panel
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Reset your administrator password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl border border-border sm:rounded-2xl sm:px-10">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF5A20] mx-auto" />
              <p className="text-sm font-medium text-foreground">Validating password reset link…</p>
            </div>
          ) : success ? (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 grid place-items-center text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Password Reset Complete!</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your password for <strong className="text-gray-900">{userEmail}</strong> has been updated successfully. All previous active sessions have been signed out for security.
              </p>
              <div className="pt-4">
                <Link
                  href="/admin/login"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground py-3 px-4 text-sm font-semibold text-white shadow-xs hover:!bg-[#FF5A20] hover:!text-white transition-colors cursor-pointer select-none"
                >
                  Proceed to Admin Sign In <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : !valid ? (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 grid place-items-center text-amber-700">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Reset Link Invalid or Expired</h3>
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                {errorMessage}
              </p>
              <p className="text-xs text-gray-500">
                Password reset links are valid for <strong>15 minutes</strong> and single-use only. Please request a new password reset link from the login page.
              </p>
              <div className="pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center rounded-xl bg-white border border-border py-2.5 px-5 text-sm font-semibold text-foreground hover:!bg-foreground hover:!text-white transition-colors cursor-pointer select-none"
                >
                  Return to Admin Login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="bg-orange-50 p-3.5 rounded-xl border border-orange-200 text-xs text-orange-950">
                <p className="font-semibold">{userFullName || "Administrator"}</p>
                <p className="text-orange-900/80 mt-0.5">{userEmail}</p>
              </div>

              {errorMessage ? (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                    placeholder="Re-enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !password || password.length < 8 || password !== confirmPassword}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground py-3 px-4 text-sm font-semibold text-white shadow-xs hover:!bg-[#FF5A20] hover:!text-white transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Updating Password…
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" /> Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
