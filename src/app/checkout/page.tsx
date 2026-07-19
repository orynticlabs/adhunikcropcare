"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CheckCircle2, ChevronRight, CreditCard,
  Leaf, Lock, Package, Phone, ShieldCheck, Tag,
  Truck, X,
} from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import CartDrawer from "@/features/cart/components/cart-drawer"
import SiteFooter from "@/components/layout/site-footer"
import { formatCurrency, useCart } from "@/features/cart/cart-context"
import { useAuth } from "@/features/auth/auth-context"

/* ── Constants ──────────────────────────────────────────────── */
const INDIA_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
]

const COUPONS: Record<string, number> = {
  ORGANIC20: 20,
  SOIL15: 15,
  CROP10: 10,
}

type PaymentMethod = "cash_on_delivery" | "razorpay"

type RazorpayResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayOptions = {
  amount: number
  currency: "INR"
  description: string
  handler: (response: RazorpayResponse) => void
  key: string
  modal?: { ondismiss?: () => void }
  name: string
  order_id: string
  prefill?: { contact?: string; email?: string; name?: string }
  theme?: { color: string }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void; on: (event: "payment.failed", handler: () => void) => void }
  }
}

/* ── Sub-components ─────────────────────────────────────────── */
function SectionCard({ title, step, children }: { title: string; step: number; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border/60 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#033927] text-[13px] font-bold text-white">
          {step}
        </span>
        <h2 className="font-display text-xl">{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  )
}

function Field({
  label, required = false, error, children,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground/80">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputCls = (error?: string) =>
  `h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none transition-colors focus:border-[#033927] focus:ring-2 focus:ring-[#033927]/10 ${
    error ? "border-red-400" : "border-border/60 hover:border-[#689c30]/40"
  }`

const primaryButtonCls =
  "group inline-flex items-center justify-center gap-2 rounded-full bg-[#033927] px-6 text-sm font-bold text-white transition-colors hover:bg-[#689c30] hover:!text-black disabled:cursor-not-allowed disabled:opacity-60"

function RazorpayLogo() {
  return (
    <span className="inline-flex h-8 items-center rounded-lg bg-white px-2.5 ring-1 ring-[#d9e6fb]">
      <Image
        src="/razorpay-logo.png"
        alt="Razorpay"
        width={94}
        height={20}
        className="h-5 w-auto object-contain"
      />
    </span>
  )
}

/* ── Main checkout page ─────────────────────────────────────── */
export default function CheckoutPage() {
  const router = useRouter()
  const { clearCart, items, subtotal, closeCart } = useCart()
  const { loadingUser, user } = useAuth()

  /* form fields */
  const [firstName, setFirstName]   = useState(user?.firstName ?? "")
  const [lastName,  setLastName]    = useState(user?.lastName ?? "")
  const [email,     setEmail]       = useState(user?.email ?? "")
  const [phone,     setPhone]       = useState(user?.phone ?? "")
  const [address1,  setAddress1]    = useState("")
  const [address2,  setAddress2]    = useState("")
  const [city,      setCity]        = useState("")
  const [state,     setState]       = useState("")
  const [pincode,   setPincode]     = useState("")
  const [delivery,  setDelivery]    = useState<"standard" | "express">("standard")
  const [payment,   setPayment]     = useState<PaymentMethod>("cash_on_delivery")
  const [coupon,    setCoupon]      = useState("")
  const [applied,   setApplied]     = useState<{ code: string; pct: number } | null>(null)
  const [couponErr, setCouponErr]   = useState("")
  const [errors,    setErrors]      = useState<Record<string, string>>({})
  const [placing, setPlacing] = useState(false)
  const [paymentErr, setPaymentErr] = useState("")
  const [toast, setToast] = useState("")

  /* derived totals */
  const shippingCost   = delivery === "express" ? 99 : subtotal >= 999 ? 0 : 49
  const discountAmount = applied ? Math.round(subtotal * applied.pct / 100) : 0
  const total          = subtotal + shippingCost - discountAmount

  useEffect(() => {
    if (!loadingUser && !user) {
      router.replace("/login?from=/checkout")
    }
  }, [loadingUser, router, user])

  useEffect(() => {
    if (!user) return
    setFirstName((value) => value || user.firstName)
    setLastName((value) => value || user.lastName)
    setEmail((value) => value || user.email)
    setPhone((value) => value || user.phone)
    if (typeof user.defaultAddress?.line === "string") {
      setAddress1((value) => value || String(user.defaultAddress?.line ?? ""))
    }
  }, [user])

  /* coupon */
  function applyCoupon() {
    const code = coupon.trim().toUpperCase()
    if (COUPONS[code]) {
      setApplied({ code, pct: COUPONS[code] })
      setCouponErr("")
    } else {
      setApplied(null)
      setCouponErr("Invalid coupon code. Try ORGANIC20, SOIL15, or CROP10.")
    }
  }

  /* validation */
  function validate() {
    const e: Record<string, string> = {}
    if (!firstName.trim())                     e.firstName = "Required"
    if (!lastName.trim())                      e.lastName  = "Required"
    if (!/\S+@\S+\.\S+/.test(email))          e.email     = "Enter a valid email"
    if (!/^\d{10}$/.test(phone))              e.phone     = "Enter a valid 10-digit number"
    if (!address1.trim())                      e.address1  = "Required"
    if (!city.trim())                          e.city      = "Required"
    if (!state)                                e.state     = "Select a state"
    if (!/^\d{6}$/.test(pincode))             e.pincode   = "Enter a valid 6-digit pincode"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handlePlaceOrder() {
    if (placing) return
    setPaymentErr("")
    if (!user) {
      router.push("/login?from=/checkout")
      return
    }
    if (!validate()) { window.scrollTo({ top: 0, behavior: "smooth" }); return }
    setPlacing(true)
    try {
      const csrfToken = await getCsrfToken()
      const idempotencyKey = getCheckoutAttemptKey()
      const result = await postJson<{
        order: { id: string; number: string }
        razorpay: null | { amount: number; currency: "INR"; keyId: string; orderId: string }
      }>("/api/auth/checkout/orders", buildCheckoutPayload(), csrfToken, idempotencyKey)

      if (payment === "cash_on_delivery") {
        closeCart()
        clearCart()
        clearCheckoutAttemptKey()
        showToast("Order placed successfully.")
        router.push(`/thank-you?order=${result.order.id}`)
        return
      }

      if (!result.razorpay?.orderId) throw new Error("Razorpay order was not created.")
      await openRazorpayCheckout({
        amount: result.razorpay.amount,
        email,
        keyId: result.razorpay.keyId,
        name: `${firstName} ${lastName}`,
        orderId: result.razorpay.orderId,
        phone,
        onCancel: () => {
          const message = "Payment was cancelled. Your order is saved as Pending Payment and can be retried from Order Details."
          setPaymentErr(message)
          showToast(message)
          setPlacing(false)
        },
        onFailure: () => {
          const message = "Payment failed. Your order is saved as Pending Payment and can be retried from Order Details."
          setPaymentErr(message)
          showToast(message)
          setPlacing(false)
        },
        onSuccess: async (response) => {
          const verifyKey = `verify-${response.razorpay_payment_id}`
          const verified = await postJson<{ order: { id: string } }>("/api/auth/checkout/verify", {
            orderId: result.order.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }, csrfToken, verifyKey)
          closeCart()
          clearCart()
          clearCheckoutAttemptKey()
          showToast("Payment verified successfully.")
          router.push(`/thank-you?order=${verified.order.id}`)
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to place order."
      setPaymentErr(message)
      showToast(message)
      setPlacing(false)
    }
  }

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast((current) => (current === message ? "" : current)), 3600)
  }

  function buildCheckoutPayload() {
    return {
      contact: { email, firstName, lastName, phone },
      coupon: applied,
      deliveryMethod: delivery,
      discountTotal: discountAmount,
      items: items.map((item) => ({
        id: item.id,
        image: item.img,
        name: item.name,
        price: item.priceValue,
        quantity: item.quantity,
        size: item.size,
      })),
      paymentMethod: payment,
      shippingAddress: { address1, address2, city, pincode, state },
      shippingTotal: shippingCost,
      subtotal,
      total,
    }
  }

  if (loadingUser || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AnnouncementBar /><Header /><CartDrawer />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 pt-36 text-center">
          <Lock className="h-12 w-12 text-muted-foreground/35" strokeWidth={1} />
          <h1 className="font-display text-3xl">Secure checkout</h1>
          <p className="max-w-sm text-sm text-muted-foreground">Please sign in to create and track your order securely.</p>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AnnouncementBar /><Header /><CartDrawer />
        <main className="flex flex-1 flex-col items-center justify-center gap-5 pt-36 pb-20 text-center px-4">
          <Package className="h-16 w-16 text-muted-foreground/40" strokeWidth={1} />
          <h1 className="font-display text-3xl">Your cart is empty</h1>
          <p className="text-muted-foreground max-w-xs">Add some products before heading to checkout.</p>
          <Link href="/#marketplace" className={`${primaryButtonCls} h-11`}>
            <Leaf className="h-4 w-4 text-white group-hover:!text-black" aria-hidden /> Shop Now
          </Link>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Header />
      <CartDrawer />
      {toast ? (
        <div className="fixed bottom-4 right-4 z-[140] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-border/60 bg-card p-3 text-sm shadow-luxe">
          {toast}
        </div>
      ) : null}

      <main className="bg-[#f6f8f5] pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl px-4">

          {/* ── Breadcrumb ───────────────────────────── */}
          <div className="mb-5 sm:mb-8 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Link href="/" className="hover:text-[#689c30] transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
            <Link href="/#marketplace" className="hover:text-[#689c30] transition-colors">Marketplace</Link>
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
            <span className="font-medium text-foreground">Checkout</span>
          </div>

          <div className="mb-6 sm:mb-8">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl">Checkout</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Review delivery details, choose payment, and place your order securely.
            </p>
          </div>

          {/* ── Two-column grid ───────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">

            {/* ══ LEFT: form ══════════════════════════════════════════ */}
            <div className="space-y-5">

              {/* Step 1 — Contact */}
              <SectionCard title="Contact Information" step={1}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name" required error={errors.firstName}>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)}
                      className={inputCls(errors.firstName)} placeholder="Ramesh" />
                  </Field>
                  <Field label="Last name" required error={errors.lastName}>
                    <input value={lastName} onChange={e => setLastName(e.target.value)}
                      className={inputCls(errors.lastName)} placeholder="Patel" />
                  </Field>
                  <Field label="Email address" required error={errors.email}>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className={inputCls(errors.email)} placeholder="you@example.com" />
                  </Field>
                  <Field label="Mobile number" required error={errors.phone}>
                    <div className="flex gap-2">
                      <span className="flex h-11 items-center rounded-xl border border-border/60 bg-white px-3 text-sm font-medium select-none">
                        +91
                      </span>
                      <input type="tel" value={phone} maxLength={10}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                        className={`${inputCls(errors.phone)} flex-1`} placeholder="9876543210" />
                    </div>
                  </Field>
                </div>
              </SectionCard>

              {/* Step 2 — Delivery Address */}
              <SectionCard title="Delivery Address" step={2}>
                <div className="grid gap-4">
                  <Field label="Address line 1" required error={errors.address1}>
                    <input value={address1} onChange={e => setAddress1(e.target.value)}
                      className={inputCls(errors.address1)} placeholder="House / Flat / Street" />
                  </Field>
                  <Field label="Address line 2">
                    <input value={address2} onChange={e => setAddress2(e.target.value)}
                      className={inputCls()} placeholder="Landmark, Area (optional)" />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="City" required error={errors.city}>
                      <input value={city} onChange={e => setCity(e.target.value)}
                        className={inputCls(errors.city)} placeholder="Pune" />
                    </Field>
                    <Field label="State" required error={errors.state}>
                      <select value={state} onChange={e => setState(e.target.value)}
                        className={`${inputCls(errors.state)} appearance-none text-black [color-scheme:light]`}>
                        <option value="">Select state</option>
                        {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label="Pincode" required error={errors.pincode}>
                      <input value={pincode} maxLength={6}
                        onChange={e => setPincode(e.target.value.replace(/\D/g, ""))}
                        className={inputCls(errors.pincode)} placeholder="411001" />
                    </Field>
                  </div>
                </div>
              </SectionCard>

              {/* Step 3 — Delivery Method */}
              <SectionCard title="Delivery Method" step={3}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      id: "standard" as const,
                      icon: Truck,
                      label: "Standard Delivery",
                      sub: "3–5 business days",
                      price: subtotal >= 999 ? "Free" : formatCurrency(49),
                      note: subtotal >= 999 ? "You qualify for free shipping!" : "Free above ₹999",
                    },
                    {
                      id: "express" as const,
                      icon: Package,
                      label: "Express Delivery",
                      sub: "1–2 business days",
                      price: formatCurrency(99),
                      note: "Priority dispatch & tracking",
                    },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDelivery(opt.id)}
                      className={`group min-h-24 rounded-2xl border p-4 text-left transition-colors ${
                        delivery === opt.id
                          ? "border-[#033927] bg-[#033927] text-white"
                          : "border-border/60 bg-white text-black hover:border-[#689c30] hover:bg-[#689c30]/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <opt.icon className={`h-5 w-5 shrink-0 ${delivery === opt.id ? "text-[#689c30]" : "text-black group-hover:text-[#689c30]"}`} aria-hidden />
                          <div>
                            <p className="text-sm font-semibold">{opt.label}</p>
                            <p className={`text-xs ${delivery === opt.id ? "text-white/75" : "text-muted-foreground"}`}>{opt.sub}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${delivery === opt.id ? "text-white" : ""}`}>
                          {opt.price}
                        </span>
                      </div>
                      <p className={`mt-2 text-[11px] ${delivery === opt.id ? "text-white/75" : "text-muted-foreground"}`}>{opt.note}</p>
                    </button>
                  ))}
                </div>
              </SectionCard>

              {/* Step 4 — Payment */}
              <SectionCard title="Payment Method" step={4}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      id: "cash_on_delivery" as const,
                      icon: Phone,
                      label: "Cash on Delivery",
                      sub: "Pay when the order reaches you",
                    },
                    {
                      id: "razorpay" as const,
                      icon: CreditCard,
                      label: "Online Payment",
                      sub: "UPI, cards, wallet, or netbanking",
                    },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayment(m.id)}
                      className={`group min-h-24 rounded-2xl border p-4 text-left transition-colors ${
                        payment === m.id
                          ? "border-[#033927] bg-[#033927] text-white"
                          : "border-border/60 bg-white text-black hover:border-[#689c30] hover:bg-[#689c30]/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${payment === m.id ? "bg-white/10 text-[#689c30]" : "bg-white text-black group-hover:text-[#689c30]"}`}>
                          <m.icon className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                            {m.label}
                            {m.id === "razorpay" ? <RazorpayLogo /> : null}
                          </span>
                          <span className={`mt-1 block text-xs ${payment === m.id ? "text-white/75" : "text-muted-foreground"}`}>{m.sub}</span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {payment === "cash_on_delivery" ? (
                  <div className="mt-5 rounded-2xl border border-[#e5dcc3] bg-[#fffaf0] p-4 text-sm">
                    <p className="font-semibold text-black">Cash on Delivery selected</p>
                    <p className="mt-1 text-muted-foreground">
                      Your order will be saved with payment status Pending. Please keep the exact amount ready at delivery.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-border/60 bg-white p-4 text-sm">
                    <p className="flex items-center gap-2 font-semibold text-black">
                      Razorpay secure checkout <RazorpayLogo />
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      We create your order first. Only after server-side signature verification will it be marked Paid.
                    </p>
                  </div>
                )}

                {paymentErr ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {paymentErr}
                  </div>
                ) : null}

                {/* Secure note */}
                <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 shrink-0 text-black" aria-hidden />
                  All transactions are 256-bit SSL encrypted and PCI-DSS compliant.
                </div>
              </SectionCard>
            </div>

            {/* ══ RIGHT: order summary ════════════════════════════════ */}
            <div className="h-fit space-y-4 lg:sticky lg:top-[7.5rem]">

              {/* Items */}
              <div className="overflow-hidden rounded-3xl border border-border/60 bg-white shadow-sm">
                <div className="border-b border-border/40 bg-white px-5 py-3.5">
                  <h2 className="font-display text-xl">Order Summary</h2>
                  <p className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</p>
                </div>

                <div className="divide-y divide-border/40 max-h-72 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3 p-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-white">
                        <Image src={item.img} alt={item.name} fill className="object-contain p-1.5" sizes="64px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{item.name}</p>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {item.size && (
                            <span className="rounded-full border border-border/60 bg-white px-2 py-0.5 text-[10px] font-semibold text-black">
                              {item.size}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">Qty {item.quantity}</span>
                        </div>
                      </div>
                      <p className="shrink-0 font-semibold text-sm">{formatCurrency(item.priceValue * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="border-t border-border/40 p-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black" aria-hidden />
                      <input
                        value={coupon}
                        onChange={e => { setCoupon(e.target.value.toUpperCase()); setApplied(null); setCouponErr("") }}
                        className="h-10 w-full rounded-xl border border-border/60 bg-background pl-9 pr-3 text-sm font-mono uppercase tracking-wider outline-none transition focus:border-[#689c30] focus:ring-2 focus:ring-[#689c30]/15"
                        placeholder="COUPON CODE"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className={`${primaryButtonCls} h-10 rounded-xl px-4`}
                    >
                      Apply
                    </button>
                  </div>
                  {applied && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-[#033927]">
                      <ShieldCheck className="h-3.5 w-3.5 text-black" aria-hidden />
                      <strong>{applied.code}</strong> applied — {applied.pct}% off saved!
                    </p>
                  )}
                  {couponErr && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                      <X className="h-3 w-3" aria-hidden /> {couponErr}
                    </p>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-border/40 space-y-2.5 p-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className={`font-medium ${shippingCost === 0 ? "text-[#033927]" : "text-foreground"}`}>
                      {shippingCost === 0 ? "Free" : formatCurrency(shippingCost)}
                    </span>
                  </div>
                  {applied && (
                    <div className="flex justify-between text-[#033927]">
                      <span>Discount ({applied.code})</span>
                      <span className="font-medium">−{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border/50 pt-3 font-display text-2xl">
                    <span>Total</span>
                    <span className="text-black">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="border-t border-border/40 p-4">
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className={`${primaryButtonCls} h-12 w-full`}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    {placing
                      ? "Processing..."
                      : payment === "razorpay"
                        ? `Pay Online · ${formatCurrency(total)}`
                        : `Place COD Order · ${formatCurrency(total)}`}
                  </button>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-black" aria-hidden />
                    Secure 256-bit SSL encrypted payment
                  </p>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: ShieldCheck, label: "Genuine Products" },
                  { icon: Truck,       label: "Pan India Delivery" },
                  { icon: Package,     label: "Easy Returns" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="group flex flex-col items-center gap-1.5 rounded-2xl border border-border/50 bg-white p-3 text-center transition-colors hover:border-[#689c30] hover:bg-[#689c30]/10">
                    <Icon className="h-5 w-5 text-black group-hover:text-[#689c30]" aria-hidden />
                    <span className="text-[11px] font-medium leading-tight text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>

              {/* Need help */}
              <div className="rounded-2xl border border-border/50 bg-white p-4 text-sm">
                <p className="font-semibold">Need help?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Call our farmer support line at <strong className="text-foreground">1800-200-CROP</strong> or email{" "}
                  <a href="mailto:hello@adhunikcrop.in" className="text-[#033927] hover:text-[#689c30] hover:underline">
                    hello@adhunikcrop.in
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

async function getCsrfToken() {
  const response = await fetch("/api/auth/csrf", { credentials: "include" })
  const json = await response.json()
  if (!response.ok || !json.success) throw new Error("Security token failed. Refresh and try again.")
  return json.data.csrfToken as string
}

async function postJson<T>(url: string, body: unknown, csrfToken: string, idempotencyKey?: string) {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    credentials: "include",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
      ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
    },
    method: "POST",
  })
  const json = await response.json()
  if (!response.ok || !json.success) throw new Error(json.error?.message ?? "Request failed.")
  return json.data as T
}

function getCheckoutAttemptKey() {
  const key = "acc_checkout_attempt_key"
  const existing = window.sessionStorage.getItem(key)
  if (existing) return existing
  const next = crypto.randomUUID()
  window.sessionStorage.setItem(key, next)
  return next
}

function clearCheckoutAttemptKey() {
  window.sessionStorage.removeItem("acc_checkout_attempt_key")
}

async function loadRazorpaySdk() {
  if (window.Razorpay) return
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay Checkout.")), { once: true })
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."))
    document.body.appendChild(script)
  })
}

async function openRazorpayCheckout(input: {
  amount: number
  email: string
  keyId: string
  name: string
  onCancel: () => void
  onFailure: () => void
  onSuccess: (response: RazorpayResponse) => Promise<void>
  orderId: string
  phone: string
}) {
  await loadRazorpaySdk()
  if (!window.Razorpay) throw new Error("Razorpay Checkout is unavailable.")
  const checkout = new window.Razorpay({
    amount: input.amount,
    currency: "INR",
    description: "Adhunik Crop Care Order",
    handler: (response) => {
      void input.onSuccess(response).catch(input.onFailure)
    },
    key: input.keyId,
    modal: {
      ondismiss: input.onCancel,
    },
    name: "Adhunik Crop Care",
    order_id: input.orderId,
    prefill: {
      contact: input.phone,
      email: input.email,
      name: input.name,
    },
    theme: {
      color: "#689c30",
    },
  })
  checkout.on("payment.failed", input.onFailure)
  checkout.open()
}
