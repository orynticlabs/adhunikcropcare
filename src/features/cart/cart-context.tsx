"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  animKey: number       // increments on every add → forces animation replay
  isCartOpen: boolean
  addItem: (product?: CartProductInput) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
}

export interface CartProductInput {
  name: string
  price: string
  img: string
  badge?: string
  size?: string       // pack / variant label, e.g. "5 kg", "1 L"
}

export interface CartItem extends CartProductInput {
  id: string          // encodes name + size so same product in two sizes = two line items
  quantity: number
  priceValue: number
}

const INITIAL_CART_ITEMS: CartItem[] = []
const CART_STORAGE_KEY = "adhunik-cart"

function productId(name: string, size?: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  if (!size) return base
  const sizeSlug = size.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  return `${base}--${sizeSlug}`
}

function parsePrice(price: string) {
  return Number(price.replace(/[^\d]/g, "")) || 0
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

const CartContext = createContext<CartContextValue>({
  items: [],
  count: 0,
  subtotal: 0,
  animKey: 0,
  isCartOpen: false,
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  openCart: () => {},
  closeCart: () => {},
})

/* ── Audio: soft two-tone "ding" (no external file needed) ── */
function playAddSound() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()

    // D5 → G5  (a pleasant ascending perfect fourth)
    const notes = [587.33, 783.99]
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      const t = ctx.currentTime + i * 0.11
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.07, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28)
      osc.start(t)
      osc.stop(t + 0.28)
    })
  } catch {
    // AudioContext blocked or unavailable — silently ignore
  }
}

/* ── Haptics: short buzz on supported devices ─────────────── */
function vibrateDevice() {
  try {
    if ("vibrate" in navigator) navigator.vibrate(28)
  } catch {
    // ignore
  }
}

/* ── Provider ─────────────────────────────────────────────── */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(INITIAL_CART_ITEMS)
  const [animKey, setAnimKey] = useState(0)
  const [hydrated, setHydrated] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY)
      if (saved) setItems(sanitizeCartItems(JSON.parse(saved)))
    } catch {
      // Ignore corrupted or unavailable storage.
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage can be unavailable in private/restricted contexts.
    }
  }, [hydrated, items])

  const addItem = useCallback((product?: CartProductInput) => {
    if (product) {
      const id = productId(product.name, product.size)

      setItems((current) => {
        const existing = current.find((item) => item.id === id)

        if (existing) {
          return current.map((item) =>
            item.id === id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }

        return [
          ...current,
          {
            ...product,
            id,
            priceValue: parsePrice(product.price),
            quantity: 1,
          },
        ]
      })
    }

    setAnimKey((k) => k + 1)
    playAddSound()
    vibrateDevice()
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, quantity) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  const count = items.reduce((total, item) => total + item.quantity, 0)
  const subtotal = items.reduce(
    (total, item) => total + item.priceValue * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        animKey,
        isCartOpen,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}

function sanitizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is CartItem => {
    if (!item || typeof item !== "object") return false
    const candidate = item as Partial<CartItem>
    return (
      typeof candidate.id === "string" &&
      typeof candidate.name === "string" &&
      typeof candidate.price === "string" &&
      typeof candidate.img === "string" &&
      typeof candidate.quantity === "number" &&
      typeof candidate.priceValue === "number"
    )
  })
}
