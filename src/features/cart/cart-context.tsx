"use client"

import {
  createContext,
  useCallback,
  useContext,
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

const INITIAL_CART_ITEMS: CartItem[] = [
  {
    id: "adhunik-bio-npk",
    name: "Adhunik Bio NPK",
    price: "₹ 1,249",
    priceValue: 1249,
    quantity: 1,
    badge: "Bestseller",
    img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
  },
  {
    id: "vermi-compost-25kg",
    name: "Vermi+ Compost 25kg",
    price: "₹ 599",
    priceValue: 599,
    quantity: 1,
    badge: "Organic",
    img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80",
  },
  {
    id: "neemguard-spray-1l",
    name: "NeemGuard Spray 1L",
    price: "₹ 449",
    priceValue: 449,
    quantity: 1,
    badge: "Bio Pesticide",
    img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
  },
]

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
  const [isCartOpen, setIsCartOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    } else {
      setItems((current) =>
        current.map((item, index) =>
          index === 0 ? { ...item, quantity: item.quantity + 1 } : item
        )
      )
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
