"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { CheckCircle2, X } from "lucide-react"

export interface AuthUser {
  avatar?: string | null
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
  signup: (data: SignupData) => Promise<{ verifyToken?: string | null }>
  logout: () => Promise<void>
  updateProfile: (data: Partial<AuthUser>) => Promise<void>
  forgotPassword: (email: string) => Promise<{ resetToken?: string | null }>
  resetPassword: (token: string, password: string) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  openAuthModal: (view?: AuthView, options?: AuthModalOptions) => void
  closeAuthModal: () => void
  setAuthView: (view: AuthView) => void
  consumeAuthRedirectPath: () => string | null
}

export interface SignupData {
  email: string
  firstName: string
  lastName: string
  password: string
  phone: string
}

export type AuthView = "signin" | "signup"

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

  useEffect(() => {
    void bootstrap()
  }, [])

  async function bootstrap() {
    try {
      await getCsrf()
      const me = await fetchJson<{ user: AuthUser | null }>("/api/auth/me", { method: "GET" }, false)
      setUser(me?.user ?? null)
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
    pushToast("Signed in successfully.", "success")
  }

  async function signup(data: SignupData) {
    const result = await authFetch<{ user: AuthUser; verifyToken?: string | null }>("/api/auth/signup", {
      body: JSON.stringify(data),
      method: "POST",
    })
    setUser(result.user)
    pushToast("Account created successfully.", "success")
    return { verifyToken: result.verifyToken }
  }

  async function logout() {
    await authFetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    pushToast("Signed out.", "success")
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
    const result = await authFetch<{ resetToken?: string | null }>("/api/auth/forgot-password", {
      body: JSON.stringify({ email }),
      method: "POST",
    })
    pushToast("If the email exists, a reset link has been prepared.", "success")
    return result
  }

  async function resetPassword(token: string, password: string) {
    await authFetch("/api/auth/reset-password", {
      body: JSON.stringify({ password, token }),
      method: "POST",
    })
    pushToast("Password reset successfully.", "success")
  }

  async function verifyEmail(token: string) {
    await authFetch("/api/auth/verify-email", {
      body: JSON.stringify({ token }),
      method: "POST",
    })
    pushToast("Email verified.", "success")
    const me = await fetchJson<{ user: AuthUser | null }>("/api/auth/me")
    setUser(me.user)
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
      pushToast(error instanceof Error ? error.message : "Request failed.", "error")
      throw error
    }
  }

  async function getCsrf() {
    if (csrfToken) return csrfToken
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
        resetPassword,
        setAuthView,
        signup,
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
  const response = await fetch(url, { credentials: "include", ...init })
  const json = (await response.json()) as {
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
