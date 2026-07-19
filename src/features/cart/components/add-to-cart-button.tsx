"use client"

import { useState } from "react"
import { Check, ShoppingBag } from "lucide-react"
import { CartProductInput, useCart } from "@/features/cart/cart-context"

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
        transition-colors duration-300 ease-out shadow-sm cursor-pointer
        ${isAdded
          ? "bg-[#033927] text-white"
          : "bg-[#033927] text-white hover:bg-[#689c30] hover:!text-black"
        }
      `}
      aria-label={isAdded ? "Added to cart" : "Add to cart"}
    >
      <span
        className={`transition-all duration-200 ${
          isAdded ? "opacity-100" : "opacity-0 absolute"
        }`}
      >
        <Check className="h-3 w-3" aria-hidden />
      </span>
      <span
        className={`transition-all duration-200 ${
          isAdded ? "opacity-0 absolute" : "opacity-100"
        }`}
      >
        <ShoppingBag className="h-3 w-3" aria-hidden />
      </span>
      {isAdded ? "Added!" : "Add"}
    </button>
  )
}
