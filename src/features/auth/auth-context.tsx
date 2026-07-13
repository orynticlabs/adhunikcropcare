"use client"

import { createContext, useContext, useState } from "react"

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar?: string
  joinedAt: string
}

interface AuthCtx {
  user: AuthUser | null
  authView: AuthView
  isAuthModalOpen: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<AuthUser>) => void
  openAuthModal: (view?: AuthView, options?: AuthModalOptions) => void
  closeAuthModal: () => void
  setAuthView: (view: AuthView) => void
  consumeAuthRedirectPath: () => string | null
}

export interface SignupData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}

export type AuthView = "signin" | "signup"

type AuthModalOptions = {
  redirectTo?: string
}

const AuthContext = createContext<AuthCtx | null>(null)

const STORAGE_KEY = "acc_user"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") {
      return null
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
      return null
    }
  })
  const [authView, setAuthView] = useState<AuthView>("signin")
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authRedirectPath, setAuthRedirectPath] = useState<string | null>(null)

  function persist(u: AuthUser | null) {
    setUser(u)
    if (typeof window === "undefined") {
      return
    }
    if (u) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    else window.localStorage.removeItem(STORAGE_KEY)
  }

  async function login(email: string, password: string) {
    await new Promise(r => setTimeout(r, 800))
    void password
    const mock: AuthUser = {
      id: "u_" + Date.now(),
      firstName: email.split("@")[0].split(".")[0] || "Farmer",
      lastName: email.split("@")[0].split(".")[1] || "User",
      email,
      phone: "9876543210",
      joinedAt: new Date().toISOString(),
    }
    persist(mock)
  }

  async function signup(data: SignupData) {
    await new Promise(r => setTimeout(r, 1000))
    const newUser: AuthUser = {
      id: "u_" + Date.now(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      joinedAt: new Date().toISOString(),
    }
    persist(newUser)
  }

  function logout() {
    persist(null)
  }

  function updateProfile(data: Partial<AuthUser>) {
    if (!user) return
    const updated = { ...user, ...data }
    persist(updated)
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

  return (
    <AuthContext.Provider
      value={{
        user,
        authView,
        isAuthModalOpen,
        login,
        signup,
        logout,
        updateProfile,
        openAuthModal,
        closeAuthModal,
        setAuthView,
        consumeAuthRedirectPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside AuthProvider")
  return ctx
}
