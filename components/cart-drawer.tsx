"use client"

import { useEffect } from "react"
import Image from "next/image"
import { CreditCard, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, X } from "lucide-react"
import { formatCurrency, useCart } from "@/lib/cart-context"

export default function CartDrawer() {
  const {
    items,
    count,
    subtotal,
    isCartOpen,
    updateQuantity,
    removeItem,
    closeCart,
  } = useCart()

  useEffect(() => {
    if (!isCartOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeCart()
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [closeCart, isCartOpen])

  return (
    <div
      className={`fixed inset-0 z-[90] transition ${
        isCartOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!isCartOpen}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          isCartOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeCart}
        tabIndex={isCartOpen ? 0 : -1}
        aria-label="Close cart"
      />

      <aside
        className={`absolute inset-y-0 right-0 flex h-full w-full flex-col bg-background shadow-2xl transition-transform duration-300 ease-out sm:w-[27rem] lg:w-[30rem] ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
        inert={!isCartOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-green-600 text-white">
                <ShoppingBag className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-2xl leading-none">Your cart</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {count} {count === 1 ? "item" : "items"} ready for checkout
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground/70 shadow-sm transition hover:bg-accent hover:text-foreground"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {items.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="grid grid-cols-[5rem_1fr] gap-4 rounded-lg border border-border/60 bg-card p-3 shadow-soft"
                  >
                    <div className="relative h-20 w-20 overflow-hidden rounded-md bg-accent">
                      <Image
                        src={item.img}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-display text-lg leading-tight">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-xs font-medium text-[--moss]">
                            {item.badge ?? "Crop care"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="inline-flex h-9 items-center rounded-full border border-border bg-background p-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-accent"
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-accent"
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="font-display text-lg">
                            {formatCurrency(item.priceValue * item.quantity)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {item.price} each
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="border-t border-border bg-background px-5 py-5 shadow-[0_-12px_36px_rgb(0_0_0/0.06)] sm:px-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-medium text-green-700">Free</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 font-display text-2xl">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <button
                type="button"
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-green-700 px-6 text-sm font-semibold text-white shadow-luxe transition hover:bg-green-800 active:scale-[0.99]"
              >
                <CreditCard className="h-4 w-4" aria-hidden />
                Checkout
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-green-700" aria-hidden />
                Secure checkout and farmer-friendly returns
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-green-50 text-green-700">
              <ShoppingBag className="h-7 w-7" aria-hidden />
            </span>
            <h3 className="mt-5 font-display text-2xl">Your cart is empty</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Add trusted crop care products from the marketplace to start an order.
            </p>
            <button
              type="button"
              onClick={closeCart}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Continue shopping
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
