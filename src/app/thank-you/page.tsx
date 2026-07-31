import Link from "next/link"
import {
  BadgeCheck,
  ChevronRight,
  Clock3,
  Headphones,
  Leaf,
  PackageCheck,
  ReceiptText,
  Truck,
} from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import HeaderServer from "@/components/layout/header-server"
import CartDrawer from "@/features/cart/components/cart-drawer"
import SiteFooter from "@/components/layout/site-footer"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { currentUser } from "@/lib/storefront-auth"

const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: "Cash on Delivery",
  razorpay: "Razorpay Online Payment",
}

export const dynamic = "force-dynamic"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatOrderId(value?: string) {
  return value?.trim() || "ACC-CONFIRMED"
}

type OrderItem = { image?: string; img?: string; name?: string; price?: number; quantity?: number; qty?: number; size?: string }
type ThankYouOrder = {
  created_at: Date
  id: string
  items: OrderItem[]
  number: string
  payment_method: string
  payment_status: string
  status: string
  total: string | number
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; total?: string; payment?: string }>
}) {
  const params = await searchParams
  const order = await loadOrder(params.order)
  const orderId = order?.number ?? formatOrderId(params.order)
  const totalValue = Number(order?.total ?? params.total)
  const total = Number.isFinite(totalValue) && totalValue > 0 ? formatCurrency(totalValue) : "Confirmed"
  const paymentMethod = order ? PAYMENT_LABELS[order.payment_method] ?? order.payment_method : PAYMENT_LABELS[params.payment ?? ""] ?? "Payment confirmed"
  const isPaid = order?.payment_status === "paid"

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-foreground">
      <AnnouncementBar />
      <HeaderServer />
      <CartDrawer />

      <main>
        <section className="relative overflow-hidden bg-[#17382d] text-white pt-28 sm:pt-36 lg:pt-40 pb-12 sm:pb-16 lg:pb-20">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,57,39,0.96),rgba(23,56,45,0.86)_45%,rgba(104,156,48,0.7))]" />
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_20%,#e9c46a_0,transparent_24%),radial-gradient(circle_at_78%_18%,#bdd879_0,transparent_20%)]" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                <Link href="/">Home</Link>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                <span className="text-[#bdd879]">Thank You</span>
              </nav>

              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
                <BadgeCheck className="h-4 w-4 text-[#e9c46a]" aria-hidden />
                {isPaid ? "Payment confirmed" : "Order confirmed"}
              </div>

              <h1 className="mt-6 max-w-3xl font-display text-5xl leading-none tracking-tight sm:text-6xl lg:text-7xl">
                Thank you for your order.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                Your Adhunik Crop Care order has been stored successfully. We are preparing your crop-care products for dispatch and will share tracking details shortly.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/products"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-bold text-white shadow-xl transition-colors hover:bg-[#689c30] hover:!text-black"
                >
                  <Leaf className="h-4 w-4" aria-hidden />
                  Continue Shopping
                </Link>
                <Link
                  href="/account"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#033927] px-7 text-sm font-semibold text-white shadow-xl transition-colors hover:bg-[#689c30] hover:!text-black"
                >
                  View Account
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.22)] backdrop-blur-md sm:p-6">
              <div className="rounded-[1.5rem] bg-[#fbf8f2] p-6 text-[#17382d] shadow-xl sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#689c30]">Order confirmed</p>
                    <p className="mt-2 font-display text-3xl">{orderId}</p>
                  </div>
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-[#dfeacb] text-[#0d5a48]">
                    <ReceiptText className="h-6 w-6" aria-hidden />
                  </span>
                </div>

                <div className="mt-7 space-y-4 border-t border-[#d9ddd4] pt-5 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#66756d]">Amount</span>
                    <span className="font-display text-2xl text-[#033927]">{total}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#66756d]">Payment</span>
                    <span className="font-semibold">{paymentMethod}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#66756d]">Payment status</span>
                    <span className="font-semibold capitalize">{(order?.payment_status ?? "confirmed").replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#66756d]">Dispatch</span>
                    <span className="font-semibold">24-48 hours</span>
                  </div>
                </div>

                {order?.items?.length ? (
                  <div className="mt-6 rounded-2xl border border-[#d9ddd4] bg-white/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#689c30]">Items</p>
                    <div className="mt-3 space-y-2">
                      {order.items.slice(0, 4).map((item, index) => (
                        <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate">{item.name}</span>
                          <span className="shrink-0 text-[#66756d]">Qty {item.quantity ?? item.qty ?? 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 rounded-2xl bg-[#e8f0df] p-4 text-sm leading-6 text-[#4e5c50]">
                  A confirmation SMS and email will be sent shortly. Keep this order ID handy for support or tracking.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-18">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-3">
            {[
              {
                icon: PackageCheck,
                title: "Order packed",
                copy: "Your items move to quality check and packing.",
              },
              {
                icon: Truck,
                title: "Tracking shared",
                copy: "You will receive dispatch updates by SMS and email.",
              },
              {
                icon: Headphones,
                title: "Farmer support",
                copy: "Need help with usage or delivery? Our team is ready.",
              },
            ].map(({ icon: Icon, title, copy }) => (
              <article key={title} className="rounded-[1.75rem] border border-[#d9ddd4] bg-white p-6 shadow-[0_12px_35px_rgba(3,57,39,0.06)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e4ebdd] text-[#689c30]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="mt-5 font-display text-2xl text-[#17382d]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#66756d]">{copy}</p>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-8 max-w-7xl px-4">
            <div className="flex flex-col gap-4 rounded-[1.75rem] bg-[#d5dfaa] p-6 text-[#17382d] sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#17382d] text-white">
                  <Clock3 className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-sm font-semibold">
                  Estimated confirmation window: order updates usually arrive within 10 minutes.
                </p>
              </div>
              <Link href="/contact" className="inline-flex h-11 items-center justify-center rounded-full bg-[#033927] px-6 text-sm font-bold text-white transition-colors hover:bg-[#689c30] hover:!text-black">
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

async function loadOrder(orderId?: string) {
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) return null
  const user = await currentUser()
  if (!user) return null
  const [order] = await orycmsPrisma.$queryRaw<ThankYouOrder[]>`
    SELECT id, number, status, payment_status, payment_method, items, total, created_at
    FROM storefront_orders
    WHERE id = ${orderId}::uuid AND user_id = ${user.id}::uuid
    LIMIT 1
  `
  return order ?? null
}
