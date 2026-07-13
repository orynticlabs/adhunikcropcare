"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { CreditCard, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, X } from "lucide-react"
import { formatCurrency, useCart } from "@/features/cart/cart-context"

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
        className={`absolute inset-y-0 right-0 flex h-full w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#f4f7f2_0%,#edf2ee_100%)] shadow-2xl transition-transform duration-300 ease-out sm:w-[28rem] lg:w-[31rem] ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
        inert={!isCartOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="border-b border-[#d9e2da] bg-[rgba(244,247,242,0.92)] px-5 py-5 backdrop-blur-md sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(145deg,#0d5a48,#033927)] text-white shadow-[0_10px_24px_rgba(3,57,39,0.18)]">
                <ShoppingBag className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-[2.1rem] leading-none text-[#203129]">Your cart</h2>
                <p className="mt-2 text-sm text-[#66756d]">
                  {count} {count === 1 ? "item" : "items"} ready for checkout
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeCart}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d4ddd6] bg-[rgba(255,255,255,0.8)] text-foreground/70 shadow-[0_8px_20px_rgba(31,42,34,0.08)] transition hover:border-[--leaf]/30 hover:text-[--leaf]"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        {items.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[1.75rem] border border-[#d8e1d9] bg-white p-4 shadow-[0_10px_28px_rgba(31,42,34,0.08)]"
                  >
                    <div className="grid grid-cols-[5.5rem_1fr] gap-4">
                      <div className="relative h-[5.5rem] w-[5.5rem] overflow-hidden rounded-[1.2rem] bg-accent/20">
                        <Image
                          src={item.img}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="88px"
                        />
                      </div>

                      <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-display text-[1.15rem] leading-tight text-[#203129] sm:text-[1.3rem]">
                            {item.name}
                          </h3>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {item.size && (
                              <span className="inline-flex items-center rounded-full border border-[--leaf]/20 bg-[--leaf]/8 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[--moss]">
                                {item.size}
                              </span>
                            )}
                            <p className="text-sm font-semibold text-[#203129]">
                              {item.badge ?? "Crop care"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6f7a73] transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-[1.05rem] w-[1.05rem]" aria-hidden />
                        </button>
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-3">
                        <div className="inline-flex h-11 items-center rounded-full border border-[#d2ddd3] bg-[#f4f7f2] p-1 shadow-inner">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#203129] transition hover:bg-white hover:text-[--leaf]"
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            <Minus className="h-4 w-4" aria-hidden />
                          </button>
                          <span className="min-w-10 text-center text-xl font-semibold text-[#203129]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#203129] transition hover:bg-white hover:text-[--leaf]"
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            <Plus className="h-4 w-4" aria-hidden />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="font-display text-[2rem] leading-none text-[#203129]">
                            {formatCurrency(item.priceValue * item.quantity)}
                          </div>
                          <div className="mt-2 text-sm text-[#66756d]">
                            {item.price} each
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="border-t border-[#d9e2da] bg-[rgba(244,247,242,0.96)] px-5 py-5 shadow-[0_-18px_42px_rgb(3_57_39/0.07)] sm:px-6">
              <div className="space-y-4 rounded-[1.8rem] bg-[linear-gradient(180deg,#f4f7f2_0%,#eef4ef_100%)] p-5 ring-1 ring-[#dbe5dd]">
                <div className="flex items-center justify-between text-lg text-[#66756d]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#203129]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-lg text-[#66756d]">
                  <span>Shipping</span>
                  <span className="font-semibold text-[--leaf]">Free</span>
                </div>
                <div className="flex items-center justify-between border-t border-[#d7e2d8] pt-5 font-display text-[2.15rem] text-[#203129]">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#0d5a48_0%,#033927_100%)] px-6 text-base font-semibold text-white shadow-[0_18px_36px_rgba(3,57,39,0.16)] transition hover:brightness-105 active:scale-[0.99]"
                >
                  <CreditCard className="h-4 w-4" aria-hidden />
                  Proceed to checkout
                </Link>

                <div className="flex items-center justify-center gap-2 text-sm text-[#66756d]">
                  <ShieldCheck className="h-4 w-4 text-[--leaf]" aria-hidden />
                  Secure checkout and farmer-friendly returns
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-[1.8rem] bg-[linear-gradient(145deg,rgba(13,90,72,0.12),rgba(104,156,48,0.12))] text-[--leaf] shadow-soft">
              <ShoppingBag className="h-8 w-8" aria-hidden />
            </span>
            <h3 className="mt-6 font-display text-3xl text-[#203129]">Your cart is empty</h3>
            <p className="mt-3 max-w-xs text-sm leading-6 text-[#66756d]">
              Add trusted crop care products from the marketplace to start an order.
            </p>
            <button
              type="button"
              onClick={closeCart}
              className="mt-7 inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0d5a48_0%,#033927_100%)] px-6 text-sm font-medium text-white shadow-[0_18px_36px_rgba(3,57,39,0.14)] transition hover:brightness-105"
            >
              Continue shopping
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
