"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft, BadgeCheck, ChevronRight, CreditCard, Landmark,
  Leaf, Lock, Package, Phone, ShieldCheck, Smartphone, Tag,
  Truck, X,
} from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import CartDrawer from "@/features/cart/components/cart-drawer"
import SiteFooter from "@/components/layout/site-footer"
import { formatCurrency, useCart } from "@/features/cart/cart-context"

/* ── Constants ──────────────────────────────────────────────── */
const INDIA_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
]

const BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra", "Other"]

const COUPONS: Record<string, number> = {
  ORGANIC20: 20,
  SOIL15: 15,
  CROP10: 10,
}

/* ── Sub-components ─────────────────────────────────────────── */
function SectionCard({ title, step, children }: { title: string; step: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[--leaf] text-[13px] font-bold text-white">
          {step}
        </span>
        <h2 className="font-display text-xl">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
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
  `h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition-colors focus:border-[--leaf] focus:ring-2 focus:ring-[--leaf]/15 ${
    error ? "border-red-400" : "border-border/60 hover:border-[--leaf]/40"
  }`

/* ── Success screen ─────────────────────────────────────────── */
function OrderSuccess({ orderNumber }: { orderNumber: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnnouncementBar />
      <Header />
      <CartDrawer />
      <main className="flex flex-1 flex-col items-center justify-center px-4 pt-36 pb-20 text-center">
        <div className="max-w-md">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[--leaf]/10">
            <BadgeCheck className="h-12 w-12 text-[--leaf]" strokeWidth={1.5} aria-hidden />
          </div>
          <h1 className="mt-6 font-display text-4xl sm:text-5xl">Order Placed!</h1>
          <p className="mt-3 text-muted-foreground">
            Thank you for trusting Adhunik Crop Care. Your order has been confirmed and will be dispatched within 24–48 hours.
          </p>
          <div className="mt-6 rounded-2xl border border-border/50 bg-card p-5 text-left">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Order ID</p>
            <p className="mt-1 font-display text-2xl text-[--moss]">{orderNumber}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              A confirmation SMS and email will be sent shortly. You can track your order using the order ID above.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[--leaf] px-6 text-sm font-semibold text-white shadow-luxe hover:bg-[--moss]/90 transition"
            >
              <Leaf className="h-4 w-4" aria-hidden /> Continue Shopping
            </Link>
            <Link
              href="/products/adhunik-bio-npk"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-6 text-sm font-medium hover:border-[--leaf] hover:text-[--leaf] transition"
            >
              View Products
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

/* ── Main checkout page ─────────────────────────────────────── */
export default function CheckoutPage() {
  const { items, subtotal, closeCart } = useCart()

  /* form fields */
  const [firstName, setFirstName]   = useState("")
  const [lastName,  setLastName]    = useState("")
  const [email,     setEmail]       = useState("")
  const [phone,     setPhone]       = useState("")
  const [address1,  setAddress1]    = useState("")
  const [address2,  setAddress2]    = useState("")
  const [city,      setCity]        = useState("")
  const [state,     setState]       = useState("")
  const [pincode,   setPincode]     = useState("")
  const [delivery,  setDelivery]    = useState<"standard" | "express">("standard")
  const [payment,   setPayment]     = useState<"upi" | "card" | "netbanking" | "cod">("upi")
  const [upiId,     setUpiId]       = useState("")
  const [bank,      setBank]        = useState("")
  const [cardNum,   setCardNum]     = useState("")
  const [cardExp,   setCardExp]     = useState("")
  const [cardCvv,   setCardCvv]     = useState("")
  const [cardName,  setCardName]    = useState("")
  const [coupon,    setCoupon]      = useState("")
  const [applied,   setApplied]     = useState<{ code: string; pct: number } | null>(null)
  const [couponErr, setCouponErr]   = useState("")
  const [errors,    setErrors]      = useState<Record<string, string>>({})
  const [placed,    setPlaced]      = useState(false)
  const [orderNum]                  = useState(() => `ACC-${Math.floor(Math.random() * 90000) + 10000}`)

  /* derived totals */
  const shippingCost   = delivery === "express" ? 99 : subtotal >= 999 ? 0 : 49
  const discountAmount = applied ? Math.round(subtotal * applied.pct / 100) : 0
  const total          = subtotal + shippingCost - discountAmount

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
    if (payment === "upi"        && !upiId.trim())   e.upiId   = "Enter your UPI ID"
    if (payment === "netbanking" && !bank)            e.bank    = "Select a bank"
    if (payment === "card") {
      if (!/^\d{16}$/.test(cardNum.replace(/\s/g, ""))) e.cardNum = "Enter a valid 16-digit card number"
      if (!/^\d{2}\/\d{2}$/.test(cardExp))              e.cardExp = "Format: MM/YY"
      if (!/^\d{3,4}$/.test(cardCvv))                   e.cardCvv = "Enter 3 or 4 digit CVV"
      if (!cardName.trim())                              e.cardName = "Required"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handlePlaceOrder() {
    if (!validate()) { window.scrollTo({ top: 0, behavior: "smooth" }); return }
    closeCart()
    setPlaced(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (placed) return <OrderSuccess orderNumber={orderNum} />
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AnnouncementBar /><Header /><CartDrawer />
        <main className="flex flex-1 flex-col items-center justify-center gap-5 pt-36 pb-20 text-center px-4">
          <Package className="h-16 w-16 text-muted-foreground/40" strokeWidth={1} />
          <h1 className="font-display text-3xl">Your cart is empty</h1>
          <p className="text-muted-foreground max-w-xs">Add some products before heading to checkout.</p>
          <Link href="/#marketplace" className="inline-flex h-11 items-center gap-2 rounded-full bg-[--leaf] px-6 text-sm font-semibold text-white hover:bg-[--moss]/90 transition">
            <Leaf className="h-4 w-4" aria-hidden /> Shop Now
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

      <main className="pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4">

          {/* ── Breadcrumb ───────────────────────────── */}
          <div className="mb-5 sm:mb-8 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Link href="/" className="hover:text-[--leaf] transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
            <Link href="/#marketplace" className="hover:text-[--leaf] transition-colors">Marketplace</Link>
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
            <span className="font-medium text-foreground">Checkout</span>
          </div>

          <h1 className="mb-6 sm:mb-8 font-display text-3xl sm:text-4xl lg:text-5xl">Checkout</h1>

          {/* ── Two-column grid ───────────────────────── */}
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">

            {/* ══ LEFT: form ══════════════════════════════════════════ */}
            <div className="divide-y divide-border/40 space-y-8 [&>*]:pt-8 [&>*:first-child]:pt-0">

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
                      <span className="flex h-11 items-center rounded-xl border border-border/60 bg-accent px-3 text-sm font-medium select-none">
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
                        className={inputCls(errors.state)}>
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
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        delivery === opt.id
                          ? "border-[--leaf] bg-[--leaf]/6 ring-2 ring-[--leaf]/20"
                          : "border-border/60 hover:border-[--leaf]/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <opt.icon className={`h-5 w-5 shrink-0 ${delivery === opt.id ? "text-[--leaf]" : "text-muted-foreground"}`} aria-hidden />
                          <div>
                            <p className="text-sm font-semibold">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.sub}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${delivery === opt.id ? "text-[--leaf]" : ""}`}>
                          {opt.price}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">{opt.note}</p>
                    </button>
                  ))}
                </div>
              </SectionCard>

              {/* Step 4 — Payment */}
              <SectionCard title="Payment Method" step={4}>
                {/* Method tabs */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "upi"        as const, icon: Smartphone, label: "UPI"          },
                    { id: "card"       as const, icon: CreditCard,  label: "Card"         },
                    { id: "netbanking" as const, icon: Landmark,    label: "Net Banking"  },
                    { id: "cod"        as const, icon: Phone,        label: "Cash on Delivery" },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayment(m.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all ${
                        payment === m.id
                          ? "border-[--leaf] bg-[--leaf]/6 ring-2 ring-[--leaf]/20"
                          : "border-border/60 hover:border-[--leaf]/50"
                      }`}
                    >
                      <m.icon className={`h-5 w-5 ${payment === m.id ? "text-[--leaf]" : "text-muted-foreground"}`} aria-hidden />
                      <span className="text-center text-[11px] font-semibold leading-tight">{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* UPI */}
                {payment === "upi" && (
                  <div className="mt-5 grid gap-3">
                    <Field label="UPI ID" required error={errors.upiId}>
                      <input value={upiId} onChange={e => setUpiId(e.target.value)}
                        className={inputCls(errors.upiId)} placeholder="yourname@upi" />
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      {["GPay", "PhonePe", "Paytm", "BHIM"].map(app => (
                        <span key={app} className="rounded-full border border-border/50 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card */}
                {payment === "card" && (
                  <div className="mt-5 grid gap-4">
                    <Field label="Card number" required error={errors.cardNum}>
                      <input
                        value={cardNum}
                        onChange={e => setCardNum(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim())}
                        className={inputCls(errors.cardNum)} placeholder="1234 5678 9012 3456" maxLength={19} />
                    </Field>
                    <Field label="Cardholder name" required error={errors.cardName}>
                      <input value={cardName} onChange={e => setCardName(e.target.value)}
                        className={inputCls(errors.cardName)} placeholder="Name on card" />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Expiry" required error={errors.cardExp}>
                        <input value={cardExp}
                          onChange={e => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 4)
                            setCardExp(v.length > 2 ? `${v.slice(0,2)}/${v.slice(2)}` : v)
                          }}
                          className={inputCls(errors.cardExp)} placeholder="MM/YY" maxLength={5} />
                      </Field>
                      <Field label="CVV" required error={errors.cardCvv}>
                        <input type="password" value={cardCvv} maxLength={4}
                          onChange={e => setCardCvv(e.target.value.replace(/\D/g, ""))}
                          className={inputCls(errors.cardCvv)} placeholder="•••" />
                      </Field>
                    </div>
                  </div>
                )}

                {/* Net Banking */}
                {payment === "netbanking" && (
                  <div className="mt-5">
                    <Field label="Select bank" required error={errors.bank}>
                      <select value={bank} onChange={e => setBank(e.target.value)}
                        className={inputCls(errors.bank)}>
                        <option value="">Choose your bank</option>
                        {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </Field>
                  </div>
                )}

                {/* COD */}
                {payment === "cod" && (
                  <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm">
                    <p className="font-semibold text-amber-800">Cash on Delivery selected</p>
                    <p className="mt-1 text-amber-700">
                      Please keep the exact amount ready at the time of delivery. COD is available for orders up to ₹10,000.
                    </p>
                  </div>
                )}

                {/* Secure note */}
                <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 shrink-0 text-[--leaf]" aria-hidden />
                  All transactions are 256-bit SSL encrypted and PCI-DSS compliant.
                </div>
              </SectionCard>
            </div>

            {/* ══ RIGHT: order summary ════════════════════════════════ */}
            <div className="h-fit space-y-4 lg:sticky lg:top-[7.5rem]">

              {/* Items */}
              <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
                <div className="border-b border-border/40 bg-accent/30 px-5 py-3.5">
                  <h2 className="font-display text-xl">Order Summary</h2>
                  <p className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</p>
                </div>

                <div className="divide-y divide-border/40 max-h-72 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3 p-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-accent/30">
                        <Image src={item.img} alt={item.name} fill className="object-cover" sizes="64px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{item.name}</p>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {item.size && (
                            <span className="rounded-full bg-[--leaf]/10 px-2 py-0.5 text-[10px] font-semibold text-[--moss]">
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
                      <Tag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
                      <input
                        value={coupon}
                        onChange={e => { setCoupon(e.target.value.toUpperCase()); setApplied(null); setCouponErr("") }}
                        className="h-10 w-full rounded-xl border border-border/60 bg-background pl-9 pr-3 text-sm font-mono uppercase tracking-wider outline-none transition focus:border-[--leaf] focus:ring-2 focus:ring-[--leaf]/15"
                        placeholder="COUPON CODE"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="h-10 rounded-xl border border-[--leaf] px-4 text-sm font-semibold text-[--leaf] hover:bg-[--leaf] hover:text-white transition"
                    >
                      Apply
                    </button>
                  </div>
                  {applied && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-[--leaf]">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
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
                    <span className={`font-medium ${shippingCost === 0 ? "text-[--leaf]" : "text-foreground"}`}>
                      {shippingCost === 0 ? "Free" : formatCurrency(shippingCost)}
                    </span>
                  </div>
                  {applied && (
                    <div className="flex justify-between text-[--leaf]">
                      <span>Discount ({applied.code})</span>
                      <span className="font-medium">−{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border/50 pt-3 font-display text-2xl">
                    <span>Total</span>
                    <span className="text-[--moss]">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="border-t border-border/40 p-4">
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[--leaf] text-sm font-bold text-white shadow-luxe transition hover:bg-[--moss]/90 active:scale-[0.99]"
                  >
                    <Lock className="h-4 w-4" aria-hidden />
                    Place Order · {formatCurrency(total)}
                  </button>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-[--leaf]" aria-hidden />
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
                  <div key={label} className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/50 bg-card p-3 text-center">
                    <Icon className="h-5 w-5 text-[--leaf]" aria-hidden />
                    <span className="text-[11px] font-medium leading-tight text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>

              {/* Need help */}
              <div className="rounded-2xl border border-border/50 bg-card p-4 text-sm">
                <p className="font-semibold">Need help?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Call our farmer support line at <strong className="text-foreground">1800-200-CROP</strong> or email{" "}
                  <a href="mailto:hello@adhunikcrop.in" className="text-[--leaf] hover:underline">
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
