"use client"

import { useState } from "react"
import { Check, ShoppingBag } from "lucide-react"
import { CartProductInput, useCart } from "@/lib/cart-context"

export default function AddToCartButton({ product }: { product: CartProductInput }) {
  const { addItem } = useCart()
  const [phase, setPhase] = useState<"idle" | "added">("idle")

  function handleClick() {
    if (phase === "added") return
    addItem(product)
    setPhase("added")
    setTimeout(() => setPhase("idle"), 1400)
  }

  const isAdded = phase === "added"

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-1.5 rounded-full h-8 px-3.5
        text-xs font-semibold tracking-wide
        transition-all duration-300 ease-out shadow-sm
        active:scale-95 cursor-pointer
        ${isAdded
          ? "bg-[--leaf] text-white scale-95"
          : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
        }
      `}
      aria-label={isAdded ? "Added to cart" : "Add to cart"}
    >
      <span
        className={`transition-all duration-200 ${
          isAdded ? "scale-100 opacity-100" : "scale-75 opacity-0 absolute"
        }`}
      >
        <Check className="h-3 w-3" aria-hidden />
      </span>
      <span
        className={`transition-all duration-200 ${
          isAdded ? "scale-75 opacity-0 absolute" : "scale-100 opacity-100"
        }`}
      >
        <ShoppingBag className="h-3 w-3" aria-hidden />
      </span>
      {isAdded ? "Added!" : "Add"}
    </button>
  )
}
