"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { CheckCircle2, X } from "lucide-react"

export interface AuthUser {
  defaultAddress?: Record<string, unknown> | null
  email: string
  emailVerified: boolean
  firstName: string
  id: string
  joinedAt: string
  lastName: string
  phone: string
}

interface AuthCtx {
  user: AuthUser | null
  authView: AuthView
  isAuthModalOpen: boolean
  loadingUser: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: SignupData) => Promise<{ user: AuthUser }>
  sendSignupOtp: (email: string) => Promise<string>
  verifySignupOtp: (email: string, otp: string) => Promise<string>
  logout: () => Promise<void>
  updateProfile: (data: Partial<AuthUser>) => Promise<void>
  forgotPassword: (email: string) => Promise<string>
  resetPassword: (token: string, password: string) => Promise<void>
  resendVerification: (email: string) => Promise<string>
  verifyEmail: (token: string) => Promise<"already_verified" | "verified">
  openAuthModal: (view?: AuthView, options?: AuthModalOptions) => void
  closeAuthModal: () => void
  setAuthView: (view: AuthView) => void
  consumeAuthRedirectPath: () => string | null
}

export interface SignupData {
  email: string
  emailVerificationToken: string
  firstName: string
  lastName: string
  password: string
  phone: string
}

export type AuthView = "forgot" | "reset" | "signin" | "signup"

type AuthModalOptions = {
  redirectTo?: string
}

type Toast = { id: string; message: string; type: "success" | "error" }

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authRedirectPath, setAuthRedirectPath] = useState<string | null>(null)
  const [authView, setAuthView] = useState<AuthView>("signin")
  const [csrfToken, setCsrfToken] = useState("")
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)
  const [toast, setToast] = useState<Toast | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)

  async function bootstrap() {
    try {
      await getCsrf()
      const me = await fetchJson<{ user: AuthUser | null }>("/api/auth/me", { method: "GET" }, false)
      if (me) setUser(me.user)
    } catch {
      // Keep the current in-memory session on transient /me failures during navigation.
    } finally {
      setLoadingUser(false)
    }
  }

  async function login(email: string, password: string) {
    const data = await authFetch<{ user: AuthUser }>("/api/auth/login", {
      body: JSON.stringify({ email, password }),
      method: "POST",
    })
    setUser(data.user)
    notifyAuthTabs("login")
    pushToast("Signed in successfully.", "success")
  }

  async function signup(data: SignupData) {
    const result = await authFetch<{ user: AuthUser }>("/api/auth/signup", {
      body: JSON.stringify(data),
      method: "POST",
    })
    setUser(result.user)
    notifyAuthTabs("login")
    pushToast("Account created and signed in successfully.", "success")
    return result
  }

  async function sendSignupOtp(email: string) {
    const result = await authFetch<{ message: string }>("/api/auth/send-signup-otp", {
      body: JSON.stringify({ email }),
      method: "POST",
    })
    pushToast(result.message, "success")
    return result.message
  }

  async function verifySignupOtp(email: string, otp: string) {
    const result = await authFetch<{ verificationToken: string }>("/api/auth/verify-email", {
      body: JSON.stringify({ email, otp }),
      method: "POST",
    })
    pushToast("Email verified successfully.", "success")
    return result.verificationToken
  }

  async function logout() {
    try {
      await authFetch("/api/auth/logout", { method: "POST" })
      pushToast("Signed out.", "success")
    } finally {
      setUser(null)
      setCsrfToken("")
      notifyAuthTabs("logout")
    }
  }

  async function updateProfile(data: Partial<AuthUser>) {
    const result = await authFetch<{ user: AuthUser }>("/api/auth/profile", {
      body: JSON.stringify(data),
      method: "PATCH",
    })
    setUser(result.user)
    pushToast("Profile saved.", "success")
  }

  async function forgotPassword(email: string) {
    const result = await authFetch<{ message: string }>("/api/auth/forgot-password", {
      body: JSON.stringify({ email }),
      method: "POST",
    })
    pushToast(result.message, "success")
    return result.message
  }

  async function resetPassword(token: string, password: string) {
    await authFetch("/api/auth/reset-password", {
      body: JSON.stringify({ password, token }),
      method: "POST",
    })
    pushToast("Password reset successfully.", "success")
  }

  async function verifyEmail(token: string) {
    const result = await authFetch<{ status: "already_verified" | "verified" }>("/api/auth/verify-email", {
      body: JSON.stringify({ token }),
      method: "POST",
    })
    pushToast(result.status === "already_verified" ? "Email was already verified." : "Email verified successfully.", "success")
    return result.status
  }

  async function resendVerification(email: string) {
    const result = await authFetch<{ message: string }>("/api/auth/resend-verification", {
      body: JSON.stringify({ email }),
      method: "POST",
    })
    pushToast(result.message, "success")
    return result.message
  }

  async function authFetch<T = unknown>(url: string, init: RequestInit = {}) {
    const token = await getCsrf()
    try {
      return await fetchJson<T>(url, {
        ...init,
        headers: {
          "content-type": "application/json",
          "x-csrf-token": token,
          ...(init.headers ?? {}),
        },
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes("Security check failed")) {
        const freshToken = await getCsrf(true)
        try {
          return await fetchJson<T>(url, {
            ...init,
            headers: {
              "content-type": "application/json",
              "x-csrf-token": freshToken,
              ...(init.headers ?? {}),
            },
          })
        } catch (retryError) {
          pushToast(retryError instanceof Error ? retryError.message : "Request failed.", "error")
          throw retryError
        }
      }
      if (error instanceof Error && error.message === "Authentication required.") {
        setUser(null)
        notifyAuthTabs("expired")
      }
      pushToast(error instanceof Error ? error.message : "Request failed.", "error")
      throw error
    }
  }

  async function getCsrf(force = false) {
    if (csrfToken && !force) return csrfToken
    const csrf = await fetchJson<{ csrfToken: string }>("/api/auth/csrf")
    setCsrfToken(csrf.csrfToken)
    return csrf.csrfToken
  }

  function openAuthModal(view: AuthView = "signin", options?: AuthModalOptions) {
    setAuthView(view)
    setAuthRedirectPath(options?.redirectTo ?? null)
    setIsAuthModalOpen(true)
  }

  function closeAuthModal() {
    setIsAuthModalOpen(false)
    setAuthRedirectPath(null)
  }

  function consumeAuthRedirectPath() {
    const redirectPath = authRedirectPath
    setAuthRedirectPath(null)
    return redirectPath
  }

  function pushToast(message: string, type: Toast["type"]) {
    const item = { id: crypto.randomUUID(), message, type }
    setToast(item)
    window.setTimeout(() => setToast((current) => (current?.id === item.id ? null : current)), 3200)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void bootstrap(), 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== "acc_auth_event") return
      void bootstrap()
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        authView,
        closeAuthModal,
        consumeAuthRedirectPath,
        forgotPassword,
        isAuthModalOpen,
        loadingUser,
        login,
        logout,
        openAuthModal,
        resendVerification,
        resetPassword,
        setAuthView,
        signup,
        sendSignupOtp,
        verifySignupOtp,
        updateProfile,
        user,
        verifyEmail,
      }}
    >
      {children}
      <AuthToast toast={toast} />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside AuthProvider")
  return ctx
}

async function fetchJson<T>(url: string, init: RequestInit = {}, throwOnError = true) {
  const response = await fetch(url, { cache: "no-store", credentials: "include", ...init })
  const json = (await response.json().catch(() => ({ success: false, error: { message: "Request failed." } }))) as {
    data?: T
    error?: { message: string }
    success: boolean
  }
  if (!response.ok || !json.success) {
    if (throwOnError) throw new Error(json.error?.message ?? "Request failed.")
    return null as T
  }
  return json.data as T
}

function notifyAuthTabs(event: string) {
  try {
    localStorage.setItem("acc_auth_event", `${event}:${Date.now()}`)
  } catch {
    // Ignore private-mode storage failures.
  }
}

function AuthToast({ toast }: { toast: Toast | null }) {
  if (!toast) return null

  return (
    <div className="fixed bottom-4 right-4 z-[140] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-border/60 bg-card p-3 text-sm shadow-luxe">
      <div className="flex items-start gap-3">
        {toast.type === "success" ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#689c30]" />
        ) : (
          <X className="mt-0.5 h-4 w-4 text-destructive" />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  )
}
