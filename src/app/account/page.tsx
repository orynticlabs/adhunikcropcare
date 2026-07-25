"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  User, Package, MapPin, LogOut, ChevronRight, Edit3,
  Phone, Mail, Calendar, ShieldCheck, Leaf, Star, Truck,
  CheckCircle2, Clock, XCircle, Plus, Trash2, BadgeCheck,
  ArrowLeft, AlertCircle,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/features/auth/auth-context"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import CartDrawer from "@/features/cart/components/cart-drawer"
import SiteFooter from "@/components/layout/site-footer"
import { DefaultMemojiAvatar } from "@/components/auth/default-memoji-avatar"

/* ── Types ─────────────────────────────────────────────────────── */
type Tab = "profile" | "orders" | "addresses"
const MAX_SAVED_ADDRESSES = 4

interface Order {
  id: string
  created_at?: string
  date?: string
  invoice_url?: string | null
  items: { img?: string; image?: string; name: string; price: number; qty?: number; quantity?: number }[]
  number?: string
  payment_method?: "cash_on_delivery" | "razorpay"
  payment_status?: string
  status: "delivered" | "processing" | "shipped" | "cancelled" | "payment_pending"
  total: number | string
  tracking?: string | null
}

interface Address {
  id: string
  label: string
  name: string
  firstName?: string
  lastName?: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  phone: string
  isDefault: boolean
}

/* ── Helpers ───────────────────────────────────────────────────── */
function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function orderDate(order: Order) {
  return order.created_at ?? order.date ?? new Date().toISOString()
}

function orderTotal(order: Order) {
  return typeof order.total === "string" ? Number(order.total) : order.total
}

const statusMeta: Record<Order["status"], { label: string; color: string; Icon: React.ElementType }> = {
  delivered:  { label: "Delivered",  color: "text-[#689c30] bg-[#689c30]/10",   Icon: CheckCircle2 },
  processing: { label: "Processing", color: "text-[#3d2b1f] bg-[#e9c46a]/20",   Icon: Clock },
  shipped:    { label: "Shipped",    color: "text-[#033927] bg-[#033927]/10",   Icon: Truck },
  cancelled:  { label: "Cancelled",  color: "text-destructive bg-destructive/10", Icon: XCircle },
  payment_pending: { label: "Payment Pending", color: "text-[#3d2b1f] bg-[#e9c46a]/20", Icon: Clock },
}

function paymentLabel(method?: string) {
  return method === "razorpay" ? "Razorpay Online" : "Cash on Delivery"
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function readAddresses(raw: unknown, user?: { firstName: string; lastName: string; phone: string } | null): Address[] {
  if (!raw || typeof raw !== "object") return []
  const value = raw as Record<string, unknown>
  const defaultId = text(value.defaultId)

  if (Array.isArray(value.addresses)) {
    return value.addresses
      .map((item, index) => normalizeAddress(item, defaultId, index, user))
      .filter((item): item is Address => Boolean(item))
  }

  const line = text(value.line)
  if (!line) return []
  return [{
    city: "",
    id: "legacy-default",
    isDefault: true,
    label: "Default",
    line1: line,
    name: user ? `${user.firstName} ${user.lastName}`.trim() : "",
    phone: user?.phone ?? "",
    pincode: "",
    state: "",
  }]
}

function normalizeAddress(item: unknown, defaultId: string, index: number, user?: { firstName: string; lastName: string; phone: string } | null): Address | null {
  if (!item || typeof item !== "object") return null
  const value = item as Record<string, unknown>
  const line1 = text(value.address1) || text(value.line1)
  if (!line1) return null
  const id = text(value.id) || `address-${index + 1}`
  return {
    city: text(value.city),
    id,
    isDefault: Boolean(value.isDefault) || id === defaultId,
    label: text(value.label) || `Address ${index + 1}`,
    line1,
    line2: text(value.address2) || text(value.line2),
    name: text(value.name) || (user ? `${user.firstName} ${user.lastName}`.trim() : ""),
    phone: text(value.phone) || user?.phone || "",
    pincode: text(value.pincode),
    state: text(value.state),
  }
}

function addressesJson(addresses: Address[]) {
  const normalized = addresses.map((address) => ({
    address1: address.line1,
    address2: address.line2 ?? "",
    city: address.city,
    firstName: address.firstName ?? address.name.split(/\s+/)[0] ?? "",
    id: address.id,
    isDefault: address.isDefault,
    label: address.label,
    lastName: address.lastName ?? address.name.split(/\s+/).slice(1).join(" ") ?? "",
    name: address.name,
    phone: address.phone,
    pincode: address.pincode,
    state: address.state,
  }))
  const defaultId = normalized.find((address) => address.isDefault)?.id ?? normalized[0]?.id ?? null
  return { addresses: normalized.map((address) => ({ ...address, isDefault: address.id === defaultId })), defaultId }
}

function formatAddress(address?: Address) {
  if (!address) return "Not set"
  return [address.line1, address.line2, address.city, address.state, address.pincode].filter(Boolean).join(", ")
}

/* ── Sub-views ─────────────────────────────────────────────────── */
function ProfileView({ onEdit }: { onEdit: () => void }) {
  const { user } = useAuth()
  if (!user) return null
  const defaultAddress = readAddresses(user.defaultAddress, user).find((address) => address.isDefault)
  return (
    <div className="space-y-6">
      {/* Avatar + name */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#689c30]/15 text-3xl font-display font-bold text-[#689c30]">
            <DefaultMemojiAvatar seed={`${user.id}:${user.email}`} className="h-full w-full object-cover" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#689c30] text-white shadow">
            <BadgeCheck className="h-3.5 w-3.5" />
          </span>
        </div>
        <div>
          <h3 className="font-display text-2xl">{user.firstName} {user.lastName}</h3>
          <p className="text-sm text-muted-foreground">Member since {fmtDate(user.joinedAt)}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[#689c30] font-medium">
            <Leaf className="h-3 w-3" /> {user.emailVerified ? "Verified Adhunik Account" : "Email verification pending"}
          </p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { icon: Mail,     label: "Email",  value: user.email },
          { icon: Phone,    label: "Phone",  value: `+91 ${user.phone}` },
          { icon: Calendar, label: "Joined", value: fmtDate(user.joinedAt) },
          { icon: ShieldCheck, label: "Account", value: user.emailVerified ? "Verified" : "Pending verification" },
          { icon: MapPin, label: "Default Address", value: formatAddress(defaultAddress) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#689c30]/10">
              <Icon className="h-4 w-4 text-[#689c30]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-sm font-medium">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Loyalty */}
      <div className="rounded-2xl border border-[#e9c46a]/40 bg-gradient-to-br from-[#033927]/5 to-[#e9c46a]/5 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-[#e9c46a]" />
            <span className="text-sm font-semibold">Loyalty Points</span>
          </div>
          <span className="font-display text-2xl text-[#033927]">1,250 pts</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border/40">
          <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[#689c30] to-[#e9c46a]" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          750 more points to reach <strong className="text-foreground">Gold Tier</strong>
        </p>
      </div>

      <button
        onClick={onEdit}
        className="flex h-11 items-center gap-2 rounded-full bg-[#033927] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#689c30] hover:!text-black"
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
  const [saving, setSaving] = useState(false)

  const inputCls = "h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-sm outline-none transition focus:border-[#689c30] focus:ring-2 focus:ring-[#689c30]/15"

  async function save() {
    setSaving(true)
    try {
      await updateProfile({ defaultAddress: user?.defaultAddress ?? null, firstName, lastName, phone })
      setSaved(true)
      setTimeout(() => { setSaved(false); onBack() }, 900)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#689c30] transition">
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
        <p className="sm:col-span-2 rounded-2xl border border-[#689c30]/20 bg-[#689c30]/8 p-4 text-sm text-muted-foreground">
          Manage delivery addresses from the Addresses tab so checkout and your profile stay synced.
        </p>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="flex h-11 items-center gap-2 rounded-full bg-[#033927] px-6 text-sm font-bold text-white shadow transition-colors hover:bg-[#689c30] hover:!text-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> : saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  )
}

function OrdersView({ loading, orders }: { loading: boolean; orders: Order[] }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-2xl">My Orders</h3>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5">
              <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : null}
      {!loading && orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-muted/15 py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="font-medium">No orders yet.</p>
          <Link href="/products" className="text-sm font-semibold text-[#689c30] hover:underline">Start shopping</Link>
        </div>
      ) : null}
      {orders.map(order => {
        const meta = statusMeta[order.status] ?? statusMeta.processing
        const StatusIcon = meta.Icon
        return (
          <div key={order.id} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-muted/20 px-5 py-3.5">
              <div>
                <p className="text-xs text-muted-foreground">Order ID</p>
                <p className="font-display text-base text-[#033927]">{order.number ?? order.id}</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-muted-foreground">Placed on</p>
                <p className="text-sm font-medium">{fmtDate(orderDate(order))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-semibold">{fmt(orderTotal(order))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className="text-sm font-semibold">{paymentLabel(order.payment_method)}</p>
                <p className="text-[11px] capitalize text-muted-foreground">{(order.payment_status ?? "pending").replace(/_/g, " ")}</p>
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
                    {item.img || item.image ? <Image src={item.img ?? item.image ?? ""} alt={item.name} fill sizes="56px" className="object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {item.qty ?? item.quantity ?? 1}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">{fmt(item.price * (item.qty ?? item.quantity ?? 1))}</p>
                </div>
              ))}
            </div>

            {/* Footer actions */}
            <div className="flex flex-wrap gap-3 border-t border-border/40 px-5 py-3.5">
              {order.status === "delivered" && (
                <button className="flex items-center gap-1.5 text-xs font-semibold text-[#689c30] hover:underline">
                  <Star className="h-3.5 w-3.5" /> Write a Review
                </button>
              )}
              {order.status !== "cancelled" && (
                <button className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <Truck className="h-3.5 w-3.5" /> Track Order
                </button>
              )}
              <Link href={`/account/orders/${order.id}`} className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
                <Package className="h-3.5 w-3.5" /> View Details
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AddressesView() {
  const { user, updateProfile } = useAuth()
  const savedAddresses = useMemo(() => readAddresses(user?.defaultAddress, user), [user])
  const isAddressLimitReached = savedAddresses.length >= MAX_SAVED_ADDRESSES
  const emptyForm = useMemo<Address>(() => ({
    city: "",
    firstName: user?.firstName ?? "",
    id: "",
    isDefault: savedAddresses.length === 0,
    label: "Home",
    lastName: user?.lastName ?? "",
    line1: "",
    line2: "",
    name: user ? `${user.firstName} ${user.lastName}`.trim() : "",
    phone: user?.phone ?? "",
    pincode: "",
    state: "",
  }), [savedAddresses.length, user])
  const [editing, setEditing] = useState<Address | null>(null)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [pincodeLoading, setPincodeLoading] = useState(false)

  useEffect(() => {
    if (!editing) return
    if (!/^\d{6}$/.test(editing.pincode)) {
      // Clear stale city/state whenever pincode is incomplete or being edited
      setEditing((current) => current ? { ...current, city: "", state: "" } : null)
      return
    }
    setPincodeLoading(true)
    fetch(`/api/pincode?pincode=${editing.pincode}`)
      .then((response) => response.json())
      .then((json) => {
        if (json.success && json.data) {
          setEditing((current) => current ? { ...current, city: json.data.city, state: json.data.state } : null)
          setError("")
        } else {
          setError(json.error?.message ?? "We could not find this pincode.")
        }
      })
      .catch(() => undefined)
      .finally(() => setPincodeLoading(false))
  }, [editing?.pincode])

  useEffect(() => {
    if (editing) return
    setError("")
  }, [editing])

  async function persist(nextAddresses: Address[]) {
    if (!user) return
    const normalized = nextAddresses.length > 0 && !nextAddresses.some((address) => address.isDefault)
      ? nextAddresses.map((address, index) => ({ ...address, isDefault: index === 0 }))
      : nextAddresses
    await updateProfile({
      defaultAddress: addressesJson(normalized),
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    })
  }

  async function removeAddress(id: string) {
    if (!window.confirm("Delete this saved address?")) return
    await persist(savedAddresses.filter((address) => address.id !== id))
  }

  async function setDefault(id: string) {
    await persist(savedAddresses.map((address) => ({ ...address, isDefault: address.id === id })))
  }

  async function saveAddress() {
    if (!editing) return
    if (!editing.id && isAddressLimitReached) {
      setError(`You can save up to ${MAX_SAVED_ADDRESSES} addresses. Delete or edit an address to continue.`)
      return
    }
    const nextAddress = {
      ...editing,
      city: editing.city.trim(),
      id: editing.id || `addr-${Date.now()}`,
      label: editing.label.trim() || "Address",
      line1: editing.line1.trim(),
      line2: editing.line2?.trim() ?? "",
      name: `${editing.firstName?.trim() || editing.name.split(/\s+/)[0] || ""} ${editing.lastName?.trim() || editing.name.split(/\s+/).slice(1).join(" ") || ""}`.trim(),
      firstName: editing.firstName?.trim() || editing.name.split(/\s+/)[0] || "",
      lastName: editing.lastName?.trim() || editing.name.split(/\s+/).slice(1).join(" ") || "",
      phone: editing.phone.replace(/\D/g, "").slice(0, 10),
      pincode: editing.pincode.replace(/\D/g, "").slice(0, 6),
      state: editing.state.trim(),
    }
    if (!nextAddress.firstName || !nextAddress.lastName) {
      setError("First name and last name are required.")
      return
    }
    if (!/^\d{10}$/.test(nextAddress.phone)) {
      setError("Enter a valid 10-digit mobile number.")
      return
    }
    if (!nextAddress.pincode) {
      setError("Pincode is required.")
      return
    }
    if (!/^\d{6}$/.test(nextAddress.pincode)) {
      setError("Enter a valid 6-digit pincode.")
      return
    }
    if (!nextAddress.line1) {
      setError("Address line 1 is required.")
      return
    }
    if (!nextAddress.city || !nextAddress.state) {
      setError("Enter a valid pincode to detect city and state.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const otherAddresses = savedAddresses.filter((address) => address.id !== nextAddress.id)
      const shouldDefault = nextAddress.isDefault || otherAddresses.length === 0
      await persist([
        ...otherAddresses.map((address) => ({ ...address, isDefault: shouldDefault ? false : address.isDefault })),
        { ...nextAddress, isDefault: shouldDefault },
      ])
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl">Saved Addresses</h3>
        <button
          onClick={() => setEditing(emptyForm)}
          disabled={isAddressLimitReached}
          className="flex h-9 items-center gap-2 rounded-full bg-[#033927] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#689c30] hover:!text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" /> Add New
        </button>
      </div>
      {isAddressLimitReached ? (
        <p className="rounded-2xl border border-[#689c30]/25 bg-[#689c30]/10 p-3 text-sm font-medium text-muted-foreground">
          You can save up to {MAX_SAVED_ADDRESSES} addresses. Delete an address or edit an existing one.
        </p>
      ) : null}

      {editing && (
        <div className="rounded-2xl border border-[#689c30]/30 bg-[#689c30]/5 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="font-display text-xl">{editing.id ? "Edit Address" : "Add Address"}</h4>
            <button onClick={() => setEditing(null)} className="text-sm font-semibold text-muted-foreground hover:text-[#689c30]">Cancel</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <AddressInput label="Label" value={editing.label} onChange={(label) => setEditing({ ...editing, label })} />
            <AddressInput required label="Mobile number" value={editing.phone} maxLength={10} onChange={(phone) => setEditing({ ...editing, phone: phone.replace(/\D/g, "") })} />
            <AddressInput
              required
              label="First name"
              value={editing.firstName ?? ""}
              onChange={(firstName) => setEditing({ ...editing, firstName, name: `${firstName} ${editing.lastName ?? ""}`.trim() })}
            />
            <AddressInput
              required
              label="Last name"
              value={editing.lastName ?? ""}
              onChange={(lastName) => setEditing({ ...editing, lastName, name: `${editing.firstName ?? ""} ${lastName}`.trim() })}
            />
            <AddressInput
              required
              label={pincodeLoading ? "Pincode (Detecting…)" : "Pincode"}
              value={editing.pincode}
              maxLength={6}
              onChange={(pincode) => setEditing({ ...editing, pincode: pincode.replace(/\D/g, "") })}
            />
            <AddressInput required label="Address line 1" value={editing.line1} onChange={(line1) => setEditing({ ...editing, line1 })} className="sm:col-span-2" />
            <AddressInput label="Address line 2" value={editing.line2 ?? ""} onChange={(line2) => setEditing({ ...editing, line2 })} className="sm:col-span-2" />
            <AddressInput
              required
              readOnly
              label="City"
              value={editing.city}
              onChange={() => undefined}
              placeholder={pincodeLoading ? "Detecting…" : "Auto-detected from pincode"}
            />
            <AddressInput
              required
              readOnly
              label="State"
              value={editing.state}
              onChange={() => undefined}
              placeholder={pincodeLoading ? "Detecting…" : "Auto-detected from pincode"}
            />
            <p className="sm:col-span-2 text-xs text-muted-foreground bg-[#689c30]/10 p-2.5 rounded-xl border border-[#689c30]/20">
              City and state are automatically detected from your pincode and cannot be edited manually.
            </p>
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm font-semibold">
            <input
              checked={editing.isDefault}
              onChange={(event) => setEditing({ ...editing, isDefault: event.target.checked })}
              type="checkbox"
              className="h-4 w-4 accent-[#033927]"
            />
            Make this my default address
          </label>
          {error ? <p className="mt-3 text-sm font-semibold text-destructive">{error}</p> : null}
          <button
            onClick={saveAddress}
            disabled={saving}
            className="mt-5 flex h-11 items-center gap-2 rounded-full bg-[#033927] px-6 text-sm font-bold text-white transition-colors hover:bg-[#689c30] hover:!text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Address"}
          </button>
        </div>
      )}

      {savedAddresses.length === 0 && !editing && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-muted-foreground">No saved addresses yet.</p>
        </div>
      )}

      {savedAddresses.map(addr => (
        <div
          key={addr.id}
          className={`rounded-2xl border p-5 transition-all ${
            addr.isDefault ? "border-[#689c30] ring-2 ring-[#689c30]/15" : "border-border/50 bg-card"
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#689c30]/10 px-2.5 py-0.5 text-xs font-semibold text-[#689c30]">
                {addr.label}
              </span>
              {addr.isDefault && (
                <span className="rounded-full bg-[#033927] px-2.5 py-0.5 text-xs font-semibold text-white">
                  Default
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setEditing(addr)} className="text-xs font-medium text-[#689c30] hover:underline">Edit</button>
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
              className="mt-3 text-xs font-medium text-muted-foreground hover:text-[#689c30] transition"
            >
              Set as default
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function AddressInput({
  className = "",
  label,
  maxLength,
  onChange,
  placeholder,
  readOnly = false,
  required = false,
  value,
}: {
  className?: string
  label: string
  maxLength?: number
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  required?: boolean
  value: string
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold text-foreground/80">{label}{required ? <span className="ml-0.5 text-red-500">*</span> : null}</span>
      <input
        value={value}
        maxLength={maxLength}
        readOnly={readOnly}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`h-11 w-full rounded-xl border border-border/60 px-4 text-sm outline-none transition ${
          readOnly
            ? "bg-muted/40 text-muted-foreground cursor-not-allowed border-border/40 select-none"
            : "bg-background focus:border-[#689c30] focus:ring-2 focus:ring-[#689c30]/15"
        }`}
      />
    </label>
  )
}

/* ── Main Account Page ─────────────────────────────────────────── */
export default function AccountPage() {
  const { loadingUser, user, logout, openAuthModal } = useAuth()
  const router = useRouter()
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<Tab>("profile")
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    if (!loadingUser && !user) {
      openAuthModal("signin", { redirectTo: "/account" })
      router.replace("/")
    }
  }, [loadingUser, openAuthModal, router, user])

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab")
    if (requestedTab === "orders" || requestedTab === "addresses" || requestedTab === "profile") {
      setTab(requestedTab)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    setLoadingOrders(true)
    fetch("/api/auth/orders", { credentials: "include" })
      .then(async (response) => {
        const json = await response.json()
        if (!response.ok || !json.success) throw new Error(json.error?.message ?? "Failed to load orders.")
        setOrders(Array.isArray(json.data) ? json.data : [])
      })
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false))
  }, [user])

  if (loadingUser || !user) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Header />
        <main className="px-4 pt-36">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-6">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-[220px_1fr]">
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full rounded-xl" />
                ))}
              </div>
              <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-6">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: "profile",   label: "Profile",    Icon: User    },
    { id: "orders",    label: "Orders",     Icon: Package },
    { id: "addresses", label: "Addresses",  Icon: MapPin  },
  ]

  async function handleLogout() {
    await logout()
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
            <Link href="/" className="hover:text-[#689c30] transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">My Account</span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">

            {/* ── Sidebar ── */}
            <aside className="h-fit space-y-3">
              {/* User card */}
              <div className="rounded-2xl border border-border/50 bg-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#689c30]/15 font-display text-lg font-bold text-[#689c30]">
                    <DefaultMemojiAvatar seed={`${user.id}:${user.email}`} className="h-full w-full rounded-xl object-cover" />
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
                          ? "bg-[#689c30]/10 text-[#689c30]"
                          : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                      {id === "orders" && (
                        <span className="ml-auto rounded-full bg-[#689c30]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#689c30]">
                          {orders.length}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Orders", value: orders.length },
                  { label: "Addresses", value: readAddresses(user.defaultAddress, user).length },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl border border-border/50 bg-card p-4 text-center">
                    <p className="font-display text-2xl text-[#033927]">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Help box */}
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-[#689c30]" />
                  <span className="text-sm font-semibold">Need help?</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Call <strong className="text-foreground">+919205762766</strong> or email{" "}
                  <a href="mailto:support@adhunikcropcare.com" className="text-[#689c30] hover:underline">
                    support@adhunikcropcare.com
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
              {tab === "orders"    && <OrdersView loading={loadingOrders} orders={orders} />}
              {tab === "addresses" && <AddressesView />}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
