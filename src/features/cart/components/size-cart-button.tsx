"use client"

import { useState } from "react"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import { useCart } from "@/features/cart/cart-context"

interface Product {
  name: string
  price: string
  img: string
  badge?: string
  sizes?: string[]
  defaultSize?: string
}

function makeId(name: string, size?: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  if (!size) return base
  const s = size.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  return `${base}--${s}`
}

export default function SizeCartButton({ product }: { product: Product }) {
  const { items, addItem, updateQuantity, removeItem } = useCart()

  /* local selected size — null until user clicks Add or picks a size pill */
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  /* derive the active cart item from selected size */
  const activeId   = makeId(product.name, selectedSize ?? undefined)
  const cartItem   = items.find(i => i.id === activeId)
  const qty        = cartItem?.quantity ?? 0
  const inCart     = qty > 0
  const hasSizes   = !!product.sizes?.length

  /* ── Handlers ─────────────────────────────────────────── */
  function handleAdd() {
    const size = selectedSize ?? product.defaultSize ?? product.sizes?.[0]
    setSelectedSize(size ?? null)
    addItem({ name: product.name, price: product.price, img: product.img, badge: product.badge, size })
  }

  function handleSizePick(size: string) {
    if (inCart && selectedSize && size !== selectedSize) {
      /* swap: remove old size line item, add new size line item */
      removeItem(activeId)
      addItem({ name: product.name, price: product.price, img: product.img, badge: product.badge, size })
    }
    setSelectedSize(size)
  }

  function handleIncrease() { updateQuantity(activeId, qty + 1) }
  function handleDecrease() {
    updateQuantity(activeId, qty - 1)
    if (qty - 1 <= 0) setSelectedSize(null)
  }

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-2">

      {/* Size pills — visible only when in cart (or always if product has sizes?) */}
      {hasSizes && inCart && (
        <div className="flex flex-wrap gap-1">
          {product.sizes!.map(size => (
            <button
              key={size}
              type="button"
              onClick={() => handleSizePick(size)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all duration-200 ${
                selectedSize === size
                  ? "border-[--leaf] bg-[--leaf]/10 text-[--leaf]"
                  : "border-border text-muted-foreground hover:border-[--leaf]/50 hover:text-[--leaf]"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      )}

      {/* Add to Cart button (when not in cart) */}
      <div
        className={`transition-all duration-300 ease-out ${
          inCart ? "opacity-0 pointer-events-none h-0 overflow-hidden" : "opacity-100"
        }`}
      >
        <button
          type="button"
          onClick={handleAdd}
          className="flex w-full h-9 items-center justify-center gap-1.5 rounded-full border border-primary bg-primary text-primary-foreground text-[13px] font-medium transition-colors hover:border-[--leaf] hover:bg-[--leaf] hover:text-white"
        >
          <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
          Add to Cart
        </button>
      </div>

      {/* Qty selector (when in cart) */}
      <div
        className={`transition-all duration-300 ease-out ${
          inCart ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden"
        }`}
      >
        <div className="flex h-9 items-center justify-between rounded-full border-2 border-[--leaf] bg-background px-1">
          <button
            type="button"
            onClick={handleDecrease}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[--leaf] transition hover:bg-[--leaf] hover:text-white"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" aria-hidden />
          </button>
          <span className="min-w-8 text-center text-sm font-bold text-[--leaf]">
            {qty}
          </span>
          <button
            type="button"
            onClick={handleIncrease}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[--leaf] text-white transition hover:bg-[--moss]"
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>

    </div>
  )
}
