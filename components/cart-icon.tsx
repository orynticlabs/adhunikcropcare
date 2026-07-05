"use client"

import { useCart } from "@/lib/cart-context"

/* Custom SVG cart — more distinctive than the lucide icon */
function CartSVG({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* basket body */}
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      {/* shelf line */}
      <line x1="3" y1="6" x2="21" y2="6" />
      {/* handles */}
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

export default function CartIcon() {
  const { count, animKey } = useCart()

  return (
    <div className="relative flex items-center justify-center">
      {/*
        key={animKey} forces a remount on every add,
        restarting the CSS animation reliably each time.
      */}
      <div key={animKey} className={animKey > 0 ? "animate-cart-bounce" : ""}>
        <CartSVG className="h-4 w-4" />
      </div>

      {count > 0 && (
        <span
          key={`badge-${animKey}`}
          className={`
            pointer-events-none absolute -right-2.5 -top-2.5
            flex min-w-[10px] h-[12px] items-center justify-center
            rounded-full bg-[--leaf] px-1
            text-[8px] font-bold leading-none text-[var(--forest)]
            shadow-sm ring-2 ring-[var(--forest)] select-none
            ${animKey > 0 ? "animate-badge-pop" : ""}
          `}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  )
}
