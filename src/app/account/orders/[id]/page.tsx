"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Ban, FileText, Package, RotateCcw, Truck } from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/features/auth/auth-context"

type OrderItem = { image?: string; img?: string; name: string; price: number; qty?: number; quantity?: number }
type Shipment = {
  awb_code?: string | null
  courier_name?: string | null
  status?: string
  tracking_url?: string | null
  estimated_delivery_date?: string | null
  shiprocket_shipment_id?: string | null
} | null
type ShipmentEvent = { id: string; status: string; location?: string | null; activity?: string | null; occurred_at: string }
type Order = {
  contact?: { email?: string; firstName?: string; lastName?: string; phone?: string } | null
  created_at: string
  id: string
  invoice_number?: string | null
  invoice_url?: string | null
  items: OrderItem[]
  number?: string
  payment_method?: "cash_on_delivery" | "razorpay"
  payment_status: string
  payment_timeline?: { at: string; event: string; status: string }[]
  razorpay_order_id?: string | null
  refund_status?: string
  shipment?: Shipment
  shipmentEvents?: ShipmentEvent[]
  shipping_address?: { address1?: string; address2?: string; city?: string; pincode?: string; state?: string } | null
  status: string
  total: number | string
  tracking?: string | null
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { loadingUser, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState("")
  const [toast, setToast] = useState("")

  useEffect(() => {
    if (loadingUser) return
    if (!user) {
      router.replace(`/login?from=/account/orders/${params.id}`)
      return
    }
    fetch(`/api/auth/orders/${params.id}`, { credentials: "include" })
      .then(async (response) => {
        const json = await response.json()
        if (!response.ok || !json.success) throw new Error("Order not found.")
        setOrder(json.data)
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [loadingUser, params.id, router, user])

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
      <main className="px-4 pb-20 pt-32 sm:pt-40">
        <div className="mx-auto max-w-5xl">
          <Link href="/account?tab=orders" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#689c30] hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>

          <div className="rounded-[2rem] border border-border/50 bg-card p-6 shadow-soft sm:p-8">
            {loading ? (
              <div className="space-y-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-52" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-28 rounded-full" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 w-full rounded-2xl" />
                  ))}
                </div>
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-56 w-full rounded-2xl" />
              </div>
            ) : !order ? (
              <div className="py-12 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
                <h1 className="mt-4 font-display text-2xl">Order not found</h1>
                <p className="mt-2 text-sm text-muted-foreground">This order does not exist for your account.</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Order Details</p>
                    <h1 className="mt-2 font-display text-3xl text-[#033927]">{order.number ?? order.id}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge label={`Payment: ${order.payment_status}`} />
                    <Badge label={order.payment_method === "razorpay" ? "Razorpay Online" : "Cash on Delivery"} />
                    <Badge label={`Shipment: ${order.status}`} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <InfoCard icon={FileText} label="Invoice" value={order.invoice_number ?? "Generated"} href={`/api/auth/orders/${order.id}/invoice`} />
                  <InfoCard icon={Truck} label="Tracking" value={trackingSummary(order)} href={order.shipment?.tracking_url ?? undefined} />
                  <InfoCard icon={RotateCcw} label="Reorder" value="Add items again" href="/products" />
                </div>

                <div className="flex flex-wrap gap-3">
                  {canRetry(order) ? (
                    <button
                      type="button"
                      disabled={retrying}
                      onClick={() => void retryPayment(order)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#033927] px-6 text-sm font-bold text-white transition-colors hover:bg-[#689c30] hover:!text-black"
                    >
                      {retrying ? "Opening..." : "Retry Payment"}
                    </button>
                  ) : null}
                  {canCancel(order) ? (
                    <button
                      type="button"
                      onClick={() => void cancelCurrentOrder(order)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-destructive/30 px-6 text-sm font-bold text-destructive transition hover:bg-destructive/10"
                    >
                      <Ban className="h-4 w-4" />
                      Cancel Order
                    </button>
                  ) : null}
                </div>

                {canRetry(order) ? (
                  <div className="rounded-2xl border border-[#e9c46a]/40 bg-[#e9c46a]/10 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="font-display text-2xl text-[#033927]">Payment pending</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Your order is saved. Retry Razorpay payment securely whenever you are ready.</p>
                        {retryError ? <p className="mt-2 text-sm text-red-600">{retryError}</p> : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                {order.shipment ? (
                  <div className="rounded-2xl border border-border/50 bg-background/60 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="font-display text-2xl text-[#033927]">Shipment Tracking</h2>
                      <span className="rounded-full bg-[#689c30]/10 px-3 py-1 text-xs font-semibold capitalize text-[#689c30]">{order.shipment.status ?? "Created"}</span>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <TrackField label="AWB Number" value={order.shipment.awb_code ?? "Pending"} />
                      <TrackField label="Courier" value={order.shipment.courier_name ?? "Assigning"} />
                      <TrackField
                        label="Estimated Delivery"
                        value={order.shipment.estimated_delivery_date ? new Date(order.shipment.estimated_delivery_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "To be confirmed"}
                      />
                      <TrackField label="Tracking Number" value={order.shipment.awb_code ?? "Pending"} />
                    </div>
                    {order.shipment.tracking_url ? (
                      <a
                        href={order.shipment.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#033927] px-6 text-sm font-bold text-white transition-colors hover:bg-[#689c30] hover:!text-black"
                      >
                        <Truck className="h-4 w-4" />
                        Track on courier site
                      </a>
                    ) : null}

                    {order.shipmentEvents && order.shipmentEvents.length > 0 ? (
                      <div className="mt-6 space-y-3">
                        <p className="text-sm font-semibold">Delivery Timeline</p>
                        {order.shipmentEvents.map((event) => (
                          <div key={event.id} className="flex gap-3">
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#689c30]" />
                            <div>
                              <p className="text-sm font-semibold capitalize">{event.status}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.occurred_at).toLocaleString("en-IN")}
                                {event.location ? ` · ${event.location}` : ""}
                                {event.activity ? ` · ${event.activity}` : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="rounded-2xl border border-border/50 bg-background/60 p-5">
                  <h2 className="font-display text-2xl text-[#033927]">Payment Timeline</h2>
                  <div className="mt-4 space-y-3">
                    {(order.payment_timeline?.length ? order.payment_timeline : [{ at: order.created_at, event: "order.created", status: order.payment_status }]).map((item, index) => (
                      <div key={`${item.event}-${index}`} className="flex gap-3">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#689c30]" />
                        <div>
                          <p className="text-sm font-semibold capitalize">{item.event.replace(/[._]/g, " ")}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.at).toLocaleString("en-IN")} · {item.status.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border/50">
                  <div className="border-b border-border/50 bg-muted/20 px-5 py-3 text-sm font-semibold">Products</div>
                  <div className="divide-y divide-border/40">
                    {order.items.map((item) => {
                      const qty = item.qty ?? item.quantity ?? 1
                      const image = item.img ?? item.image
                      return (
                        <div key={item.name} className="flex items-center gap-4 px-5 py-4">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted/30">
                            {image ? <Image src={image} alt={item.name} fill sizes="64px" className="object-cover" /> : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Qty {qty}</p>
                          </div>
                          <p className="text-sm font-bold">{fmt(item.price * qty)}</p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between bg-muted/15 px-5 py-4">
                    <span className="font-semibold">Total</span>
                    <span className="font-display text-2xl text-[#033927]">{fmt(typeof order.total === "string" ? Number(order.total) : order.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )

  async function retryPayment(currentOrder: Order) {
    setRetryError("")
    setRetrying(true)
    try {
      const csrfToken = await getCsrfToken()
      const result = await postJson<{
        order: Order
        razorpay: { amount: number; currency: "INR"; keyId: string; orderId: string }
      }>("/api/auth/checkout/retry", { orderId: currentOrder.id }, csrfToken)
      await openRazorpayCheckout({
        amount: result.razorpay.amount,
        email: currentOrder.contact?.email ?? user?.email ?? "",
        keyId: result.razorpay.keyId,
        name: `${currentOrder.contact?.firstName ?? user?.firstName ?? ""} ${currentOrder.contact?.lastName ?? user?.lastName ?? ""}`.trim(),
        onCancel: () => {
          setRetryError("Payment was cancelled. You can retry again from this page.")
          showToast("Payment cancelled.")
          setRetrying(false)
        },
        onFailure: () => {
          setRetryError("Payment failed. You can retry again from this page.")
          showToast("Payment failed.")
          setRetrying(false)
        },
        onSuccess: async (response) => {
          await postJson("/api/auth/checkout/verify", {
            orderId: currentOrder.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }, csrfToken, `verify-${response.razorpay_payment_id}`)
          showToast("Payment verified.")
          router.push(`/thank-you?order=${currentOrder.id}`)
        },
        orderId: result.razorpay.orderId,
        phone: currentOrder.contact?.phone ?? user?.phone ?? "",
      })
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : "Unable to retry payment.")
      showToast(error instanceof Error ? error.message : "Unable to retry payment.")
      setRetrying(false)
    }
  }

  async function cancelCurrentOrder(currentOrder: Order) {
    try {
      const csrfToken = await getCsrfToken()
      const result = await postJson<{ order: Order }>(`/api/auth/orders/${currentOrder.id}/cancel`, {}, csrfToken)
      setOrder(result.order)
      showToast("Order cancelled.")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to cancel order.")
    }
  }

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast((current) => (current === message ? "" : current)), 3600)
  }
}

function canRetry(order: Order) {
  return order.payment_method === "razorpay" &&
    ["pending_payment", "failed"].includes(order.payment_status) &&
    !["cancelled", "shipped", "delivered"].includes(order.status) &&
    (order.refund_status ?? "none") === "none"
}

function canCancel(order: Order) {
  return !["cancelled", "shipped", "delivered"].includes(order.status) && order.payment_status !== "refunded"
}

function trackingSummary(order: Order) {
  if (order.shipment?.awb_code) {
    return `${order.shipment.courier_name ? `${order.shipment.courier_name} · ` : ""}${order.shipment.awb_code}`
  }
  return order.tracking ?? "Pending"
}

function TrackField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-full bg-[#689c30]/10 px-3 py-1 text-xs font-semibold capitalize text-[#689c30]">{label}</span>
}

function InfoCard({ href, icon: Icon, label, value }: { href?: string; icon: React.ElementType; label: string; value: string }) {
  const body = (
    <div className="rounded-2xl border border-border/50 bg-background/60 p-4 transition hover:border-[#689c30]/30">
      <Icon className="h-5 w-5 text-[#689c30]" />
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
  return href ? <Link href={href}>{body}</Link> : body
}

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
    modal: { ondismiss: input.onCancel },
    name: "Adhunik Crop Care",
    order_id: input.orderId,
    prefill: { contact: input.phone, email: input.email, name: input.name },
    theme: { color: "#689c30" },
  })
  checkout.on("payment.failed", input.onFailure)
  checkout.open()
}
