"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  User, Package, MapPin, Heart, LogOut, ChevronRight, Edit3,
  Phone, Mail, Calendar, ShieldCheck, Leaf, Star, Truck,
  CheckCircle2, Clock, XCircle, Plus, Trash2, BadgeCheck,
  ArrowLeft, AlertCircle,
} from "lucide-react"
import { ProductCard } from "@/components/products/product-card"
import { useAuth } from "@/features/auth/auth-context"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import CartDrawer from "@/features/cart/components/cart-drawer"
import SiteFooter from "@/components/layout/site-footer"

/* ── Types ─────────────────────────────────────────────────────── */
type Tab = "profile" | "orders" | "addresses" | "wishlist"

interface Order {
  id: string
  date: string
  status: "delivered" | "processing" | "shipped" | "cancelled"
  items: { name: string; qty: number; price: number; img: string }[]
  total: number
}

interface Address {
  id: string
  label: string
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  phone: string
  isDefault: boolean
}

interface WishlistItem {
  id: string
  name: string
  price: number
  img: string
  inStock: boolean
}

/* ── Mock data ─────────────────────────────────────────────────── */
const MOCK_ORDERS: Order[] = [
  {
    id: "ACC-14823",
    date: "2024-12-15",
    status: "delivered",
    items: [
      { name: "Bio NPK Granules 1kg", qty: 2, price: 349, img: "https://adhunikcropcare.com/assets/img/products/bio-npk.jpg" },
      { name: "Humic Acid Powder", qty: 1, price: 199, img: "https://adhunikcropcare.com/assets/img/products/humic.jpg" },
    ],
    total: 897,
  },
  {
    id: "ACC-13201",
    date: "2024-11-28",
    status: "shipped",
    items: [
      { name: "Organic Soil Conditioner 5kg", qty: 1, price: 699, img: "https://adhunikcropcare.com/assets/img/products/soil.jpg" },
    ],
    total: 699,
  },
  {
    id: "ACC-11099",
    date: "2024-10-10",
    status: "processing",
    items: [
      { name: "Vermi Compost 10kg", qty: 3, price: 450, img: "https://adhunikcropcare.com/assets/img/products/vermi.jpg" },
    ],
    total: 1350,
  },
  {
    id: "ACC-09854",
    date: "2024-08-22",
    status: "cancelled",
    items: [
      { name: "Drip Irrigation Kit", qty: 1, price: 2499, img: "https://adhunikcropcare.com/assets/img/products/drip.jpg" },
    ],
    total: 2499,
  },
]

const MOCK_ADDRESSES: Address[] = [
  {
    id: "addr_1",
    label: "Home",
    name: "Ramesh Patel",
    line1: "Plot 12, Sector 4, Vrindavan Colony",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    phone: "9876543210",
    isDefault: true,
  },
  {
    id: "addr_2",
    label: "Farm",
    name: "Ramesh Patel",
    line1: "Survey No. 78, Near Sangam Nagar",
    line2: "Opposite Water Tank",
    city: "Nashik",
    state: "Maharashtra",
    pincode: "422001",
    phone: "9876543211",
    isDefault: false,
  },
]

const MOCK_WISHLIST: WishlistItem[] = [
  { id: "w1", name: "Bio NPK Granules 5kg", price: 849, img: "https://adhunikcropcare.com/assets/img/products/bio-npk.jpg", inStock: true },
  { id: "w2", name: "Organic Neem Oil 1L", price: 299, img: "https://adhunikcropcare.com/assets/img/products/neem.jpg", inStock: true },
  { id: "w3", name: "Potassium Humate Flakes", price: 549, img: "https://adhunikcropcare.com/assets/img/products/humate.jpg", inStock: false },
]

/* ── Helpers ───────────────────────────────────────────────────── */
function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function productHref(name: string) {
  return `/products/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`
}

function comparePrice(amount: number, uplift = 1.18) {
  return fmt(Math.ceil((amount * uplift) / 10) * 10)
}

const statusMeta: Record<Order["status"], { label: string; color: string; Icon: React.ElementType }> = {
  delivered:  { label: "Delivered",  color: "text-[--leaf] bg-[--leaf]/10",   Icon: CheckCircle2 },
  processing: { label: "Processing", color: "text-[--bark] bg-[--gold]/20",   Icon: Clock },
  shipped:    { label: "Shipped",    color: "text-[--moss] bg-[--moss]/10",   Icon: Truck },
  cancelled:  { label: "Cancelled",  color: "text-destructive bg-destructive/10", Icon: XCircle },
}

/* ── Sub-views ─────────────────────────────────────────────────── */
function ProfileView({ onEdit }: { onEdit: () => void }) {
  const { user } = useAuth()
  if (!user) return null
  return (
    <div className="space-y-6">
      {/* Avatar + name */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[--leaf]/15 text-3xl font-display font-bold text-[--leaf]">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[--leaf] text-white shadow">
            <BadgeCheck className="h-3.5 w-3.5" />
          </span>
        </div>
        <div>
          <h3 className="font-display text-2xl">{user.firstName} {user.lastName}</h3>
          <p className="text-sm text-muted-foreground">Member since {fmtDate(user.joinedAt)}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[--leaf] font-medium">
            <Leaf className="h-3 w-3" /> Verified Farmer Account
          </p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { icon: Mail,     label: "Email",  value: user.email },
          { icon: Phone,    label: "Phone",  value: `+91 ${user.phone}` },
          { icon: Calendar, label: "Joined", value: fmtDate(user.joinedAt) },
          { icon: ShieldCheck, label: "Account", value: "Verified" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[--leaf]/10">
              <Icon className="h-4 w-4 text-[--leaf]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-sm font-medium">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Loyalty */}
      <div className="rounded-2xl border border-[--gold]/40 bg-gradient-to-br from-[--moss]/5 to-[--gold]/5 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-[--gold]" />
            <span className="text-sm font-semibold">Loyalty Points</span>
          </div>
          <span className="font-display text-2xl text-[--moss]">1,250 pts</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border/40">
          <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[--leaf] to-[--gold]" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          750 more points to reach <strong className="text-foreground">Gold Tier</strong>
        </p>
      </div>

      <button
        onClick={onEdit}
        className="flex h-11 items-center gap-2 rounded-full border border-[--leaf] px-6 text-sm font-semibold text-[--leaf] transition hover:bg-[--leaf] hover:text-white"
      >
        <Edit3 className="h-4 w-4" /> Edit Profile
      </button>
    </div>
  )
}

function EditProfileView({ onBack }: { onBack: () => void }) {
  const { user, updateProfile } = useAuth()
  const [firstName, setFirstName] = useState(user?.firstName ?? "")
  const [lastName,  setLastName]  = useState(user?.lastName  ?? "")
  const [phone,     setPhone]     = useState(user?.phone     ?? "")
  const [saved,     setSaved]     = useState(false)

  const inputCls = "h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-sm outline-none transition focus:border-[--leaf] focus:ring-2 focus:ring-[--leaf]/15"

  function save() {
    updateProfile({ firstName, lastName, phone })
    setSaved(true)
    setTimeout(() => { setSaved(false); onBack() }, 1200)
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[--leaf] transition">
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </button>
      <h3 className="font-display text-2xl">Edit Profile</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">First name</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">Last name</label>
          <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-foreground/80">Email (cannot change)</label>
          <input value={user?.email} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-foreground/80">Mobile number</label>
          <div className="flex gap-2">
            <span className="flex h-11 items-center rounded-xl border border-border/60 bg-muted/30 px-3 text-sm font-medium select-none">+91</span>
            <input value={phone} maxLength={10} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} className={`${inputCls} flex-1`} />
          </div>
        </div>
      </div>
      <button
        onClick={save}
        className="flex h-11 items-center gap-2 rounded-full bg-[--leaf] px-6 text-sm font-bold text-white shadow transition hover:bg-[--moss]"
      >
        {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> : "Save Changes"}
      </button>
    </div>
  )
}

function OrdersView() {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-2xl">My Orders</h3>
      {MOCK_ORDERS.map(order => {
        const meta = statusMeta[order.status]
        const StatusIcon = meta.Icon
        return (
          <div key={order.id} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-muted/20 px-5 py-3.5">
              <div>
                <p className="text-xs text-muted-foreground">Order ID</p>
                <p className="font-display text-base text-[--moss]">{order.id}</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-muted-foreground">Placed on</p>
                <p className="text-sm font-medium">{fmtDate(order.date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-semibold">{fmt(order.total)}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.color}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {meta.label}
              </span>
            </div>

            {/* Items */}
            <div className="divide-y divide-border/30">
              {order.items.map(item => (
                <div key={item.name} className="flex items-center gap-4 px-5 py-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted/30">
                    <Image src={item.img} alt={item.name} fill sizes="56px" className="object-cover" onError={() => {}} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {item.qty}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">{fmt(item.price * item.qty)}</p>
                </div>
              ))}
            </div>

            {/* Footer actions */}
            <div className="flex flex-wrap gap-3 border-t border-border/40 px-5 py-3.5">
              {order.status === "delivered" && (
                <button className="flex items-center gap-1.5 text-xs font-semibold text-[--leaf] hover:underline">
                  <Star className="h-3.5 w-3.5" /> Write a Review
                </button>
              )}
              {order.status !== "cancelled" && (
                <button className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <Truck className="h-3.5 w-3.5" /> Track Order
                </button>
              )}
              <button className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground ml-auto">
                <Package className="h-3.5 w-3.5" /> View Details
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AddressesView() {
  const [addresses, setAddresses] = useState<Address[]>(MOCK_ADDRESSES)

  function removeAddress(id: string) {
    setAddresses(prev => prev.filter(a => a.id !== id))
  }

  function setDefault(id: string) {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl">Saved Addresses</h3>
        <button className="flex h-9 items-center gap-2 rounded-full border border-[--leaf] px-4 text-sm font-semibold text-[--leaf] transition hover:bg-[--leaf] hover:text-white">
          <Plus className="h-3.5 w-3.5" /> Add New
        </button>
      </div>

      {addresses.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-muted-foreground">No saved addresses yet.</p>
        </div>
      )}

      {addresses.map(addr => (
        <div
          key={addr.id}
          className={`rounded-2xl border p-5 transition-all ${
            addr.isDefault ? "border-[--leaf] ring-2 ring-[--leaf]/15" : "border-border/50 bg-card"
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[--leaf]/10 px-2.5 py-0.5 text-xs font-semibold text-[--leaf]">
                {addr.label}
              </span>
              {addr.isDefault && (
                <span className="rounded-full bg-[--moss] px-2.5 py-0.5 text-xs font-semibold text-white">
                  Default
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button className="text-xs font-medium text-[--leaf] hover:underline">Edit</button>
              <button
                onClick={() => removeAddress(addr.id)}
                className="text-muted-foreground hover:text-destructive transition"
                aria-label="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <p className="font-semibold text-sm">{addr.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
            {addr.line1}
            {addr.line2 && <>, {addr.line2}</>}<br />
            {addr.city}, {addr.state} — {addr.pincode}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" /> +91 {addr.phone}
          </p>

          {!addr.isDefault && (
            <button
              onClick={() => setDefault(addr.id)}
              className="mt-3 text-xs font-medium text-muted-foreground hover:text-[--leaf] transition"
            >
              Set as default
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function WishlistView() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(MOCK_WISHLIST)

  return (
    <div className="space-y-5">
      <h3 className="font-display text-2xl">My Wishlist ({wishlist.length})</h3>
      {wishlist.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Heart className="h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-muted-foreground">Your wishlist is empty.</p>
          <Link href="/products" className="text-sm font-semibold text-[--leaf] hover:underline">
            Browse Products
          </Link>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {wishlist.map(item => (
          <div key={item.id} className="relative">
            <button
              onClick={() => setWishlist(prev => prev.filter(w => w.id !== item.id))}
              className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-card/90 text-muted-foreground shadow transition hover:bg-destructive/10 hover:text-destructive"
              aria-label="Remove from wishlist"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <ProductCard
              href={productHref(item.name)}
              name={item.name}
              image={item.img}
              price={fmt(item.price)}
              originalPrice={comparePrice(item.price)}
              subtitle={item.inStock ? "Saved for later from your wishlist" : "Currently unavailable in stock"}
              overlayLabel={item.inStock ? "Wishlist" : "Out of Stock"}
              imageSizes="(max-width: 640px) 50vw, 33vw"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main Account Page ─────────────────────────────────────────── */
export default function AccountPage() {
  const { user, logout, openAuthModal } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("profile")
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    if (!user) {
      openAuthModal("signin", { redirectTo: "/account" })
      router.replace("/")
    }
  }, [openAuthModal, router, user])

  if (!user) return null

  const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: "profile",   label: "Profile",    Icon: User    },
    { id: "orders",    label: "Orders",     Icon: Package },
    { id: "addresses", label: "Addresses",  Icon: MapPin  },
    { id: "wishlist",  label: "Wishlist",   Icon: Heart   },
  ]

  function handleLogout() {
    logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Header />
      <CartDrawer />

      <main className="pt-28 sm:pt-36 lg:pt-40 pb-20">
        <div className="mx-auto max-w-6xl px-4">

          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-[--leaf] transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">My Account</span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">

            {/* ── Sidebar ── */}
            <aside className="h-fit space-y-3">
              {/* User card */}
              <div className="rounded-2xl border border-border/50 bg-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[--leaf]/15 font-display text-lg font-bold text-[--leaf]">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{user.firstName} {user.lastName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <nav className="space-y-0.5">
                  {tabs.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => { setTab(id); setEditMode(false) }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                        tab === id
                          ? "bg-[--leaf]/10 text-[--leaf]"
                          : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                      {id === "orders" && (
                        <span className="ml-auto rounded-full bg-[--leaf]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[--leaf]">
                          {MOCK_ORDERS.length}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Orders", value: MOCK_ORDERS.length },
                  { label: "Wishlist", value: MOCK_WISHLIST.length },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl border border-border/50 bg-card p-4 text-center">
                    <p className="font-display text-2xl text-[--moss]">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Help box */}
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-[--leaf]" />
                  <span className="text-sm font-semibold">Need help?</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Call <strong className="text-foreground">1800-200-CROP</strong> or email{" "}
                  <a href="mailto:hello@adhunikcrop.in" className="text-[--leaf] hover:underline">
                    hello@adhunikcrop.in
                  </a>
                </p>
              </div>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl border border-border/50 px-4 py-3 text-sm font-medium text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/8 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </aside>

            {/* ── Content ── */}
            <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 min-h-[400px]">
              {tab === "profile"   && !editMode && <ProfileView onEdit={() => setEditMode(true)} />}
              {tab === "profile"   && editMode  && <EditProfileView onBack={() => setEditMode(false)} />}
              {tab === "orders"    && <OrdersView />}
              {tab === "addresses" && <AddressesView />}
              {tab === "wishlist"  && <WishlistView />}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
