import { orycmsPrisma } from "@/lib/orycms/prisma"
import { getOryCMSVerificationSettings } from "@/lib/orycms/verification-settings"
import {
  Activity,
  Award,
  Calendar,
  CheckCircle2,
  Download,
  FileCheck,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Tag,
  User,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import AnnouncementBar from "@/components/layout/announcement-bar"
import HeaderServer from "@/components/layout/header-server"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"

export const revalidate = 0 // Ensure real-time lookups

type SnapshotRow = {
  slug: string
  product_id: string
  uin: string
  product_name: string
  brand: string
  pack_size: string
  sku: string
  batch_number: string
  mrp: string
  sale_price: string | null
  usp: string | null
  stock_quantity: number
  mfg_date: Date
  expiry_date: Date | null
  pack_timing: string
  pack_date: Date
  supervisor_name: string
  contractor_name: string
  verify_description: string | null
  verify_image: unknown
  literature: string | null
  msds: string | null
  license: string | null
  cir: string | null
  epr_number: string | null
  plastic_category: string | null
  leaflet_info: string | null
  created_at: Date
}

function formatDate(date: Date | string | null): string {
  if (!date) return "N/A"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "N/A"
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function ProductVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params

  // Retrieve the snapshot matching the unique slug
  const [snapshot] = await orycmsPrisma.$queryRaw<SnapshotRow[]>`
    SELECT * FROM orycms_verified_product_snapshots
    WHERE slug = ${slug}
    LIMIT 1
  `

  if (!snapshot) {
    return <InvalidVerificationView />
  }

  const settings = await getOryCMSVerificationSettings()
  const verifyImage = snapshot.verify_image && typeof snapshot.verify_image === "object" ? (snapshot.verify_image as { url: string }) : null

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col justify-between">
      <div>
        <AnnouncementBar />
        <HeaderServer />
        <CartDrawer />

        <div className="pt-[115px]">
          {/* Verification Status Banner */}
          <div className="bg-[#eff4e9] border-b border-[#d7e0da] py-3.5">
            <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#689c30]" />
                <span className="text-[13px] font-bold text-[#033927] uppercase tracking-wider">
                  Official Verification Secure Portal
                </span>
              </div>
              <span className="inline-flex items-center text-[12px] font-bold text-[#033927] font-mono bg-white border border-[#d7e0da] px-3 py-1 rounded-md">
                UIN: {snapshot.uin}
              </span>
            </div>
          </div>

          <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
            {/* Verification Success Box */}
            <div className="rounded-2xl border border-[#689c30]/20 bg-[#eff4e9]/40 p-6 shadow-xs flex flex-col md:flex-row items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-[#edf3e9] flex items-center justify-center text-[#689c30] shrink-0 border border-[#689c30]/10 shadow-inner">
                <ShieldCheck className="h-9 w-9" />
              </div>
              <div className="text-center md:text-left space-y-1">
                <h2 className="text-[16px] font-bold text-[#033927]">Genuine Product Verified</h2>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  This product is verified as an authentic, high-quality agricultural formulation manufactured and packaged under strict quality control standards by Adhunik Crop Care.
                </p>
                <div className="pt-1 flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="text-[11.5px] bg-[#edf3e9] border border-[#689c30]/20 text-[#033927] px-2.5 py-0.5 rounded-md font-mono font-semibold">
                    UIN: {snapshot.uin}
                  </span>
                </div>
              </div>
            </div>

            {/* 1. Header & Description Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div className="space-y-1 text-center md:text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#689c30]">
                  {snapshot.brand || "Adhunik Crop Care"}
                </span>
                <h1 className="text-xl font-extrabold text-[#033927]">{snapshot.product_name || "N/A"}</h1>
              </div>

              {/* Square Image Frame (no background visible in all devices) */}
              <div className="mx-auto max-w-[500px] w-full aspect-square overflow-hidden rounded-xl border border-slate-100 bg-neutral-100 shadow-xs relative">
                {verifyImage?.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={verifyImage.url}
                    alt={snapshot.product_name || "Product Image"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-[14px]">
                    No Image Available
                  </div>
                )}
              </div>

              {/* Product Verification Description */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Product Verification Details</h4>
                {snapshot.verify_description ? (
                  <div
                    className="prose prose-sm max-w-none text-[13.5px] text-slate-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: snapshot.verify_description }}
                  />
                ) : (
                  <p className="text-[13.5px] text-slate-500">N/A</p>
                )}
              </div>
            </div>

            {/* 2. Batch Information Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#033927] border-b border-slate-100 pb-2">Batch Information</h3>
              <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">1. Batch Number</div>
                  <div className="text-[13.5px] font-mono font-bold text-[#033927] bg-[#eff4e9]/55 px-2.5 py-1 rounded border border-[#689c30]/20 mt-1 inline-block">
                    {snapshot.batch_number || "N/A"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">2. Manufacturing Date (MFG)</div>
                  <div className="text-[13.5px] font-semibold text-slate-700 mt-1">
                    {formatDate(snapshot.mfg_date)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">3. Expiry Date</div>
                  <div className="text-[13.5px] font-semibold text-slate-700 mt-1">
                    {formatDate(snapshot.expiry_date)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">4. Pack Size</div>
                  <div className="text-[13.5px] font-semibold text-slate-700 mt-1">
                    {snapshot.pack_size || "N/A"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">5. SKU</div>
                  <div className="text-[13.5px] font-semibold text-slate-700 mt-1">
                    {snapshot.sku || "N/A"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">6. MRP (Maximum Retail Price)</div>
                  <div className="text-[16px] font-extrabold text-[#033927] mt-1">
                    {snapshot.mrp ? `₹${Number(snapshot.mrp).toFixed(2)}` : "N/A"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">7. USP (Unit Sale Price)</div>
                  <div className="text-[15px] font-bold text-[#689c30] mt-1">
                    {snapshot.usp ? `₹${Number(snapshot.usp).toFixed(2)}` : "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Packaging & QC Log Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#033927] border-b border-slate-100 pb-2">Packaging & QC Log</h3>
              <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">1. Supervisor Name</div>
                  <div className="text-[13.5px] font-semibold text-slate-700 mt-1">
                    {snapshot.supervisor_name || "N/A"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">2. Contractor Name</div>
                  <div className="text-[13.5px] font-semibold text-slate-700 mt-1">
                    {snapshot.contractor_name || "N/A"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">3. Pack Date</div>
                  <div className="text-[13.5px] font-semibold text-slate-700 mt-1">
                    {formatDate(snapshot.pack_date)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">4. Pack Time (Timing)</div>
                  <div className="text-[13.5px] font-semibold text-slate-700 mt-1">
                    {snapshot.pack_timing || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Regulatory & Compliance Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#033927] border-b border-slate-100 pb-2">Regulatory & Compliance</h3>
              <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">License Number</div>
                  <div className="text-[13.5px] font-semibold text-slate-700 mt-1">
                    {snapshot.license || "N/A"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">CIR Registration</div>
                  <div className="text-[13.5px] font-semibold text-slate-700 mt-1">
                    {snapshot.cir || "N/A"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">EPR Registration</div>
                  <div className="text-[13.5px] font-semibold text-slate-700 mt-1">
                    {snapshot.epr_number || "N/A"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">Plastic Category</div>
                  <div className="text-[13.5px] font-semibold text-slate-700 mt-1">
                    {snapshot.plastic_category || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Leaflet & Usage Instructions Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-[#033927] border-b border-slate-100 pb-2 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-[#689c30]" /> Leaflet & Usage Instructions
              </h3>
              {snapshot.leaflet_info ? (
                <div
                  className="prose prose-sm max-w-none text-[13.5px] text-slate-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: snapshot.leaflet_info }}
                />
              ) : (
                <div className="text-[13.5px] text-slate-500">N/A</div>
              )}
            </div>

            {/* 6. Official Documents Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#033927] border-b border-slate-100 pb-2">Official Documents</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {snapshot.literature ? (
                  <a
                    href={snapshot.literature}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:bg-slate-100 hover:border-slate-300 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-slate-700">Product Literature</div>
                        <div className="text-[11px] text-slate-400">View technical datasheet</div>
                      </div>
                    </div>
                    <Download className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-slate-400">Product Literature</div>
                      <div className="text-[11px] text-slate-400">N/A</div>
                    </div>
                  </div>
                )}

                {snapshot.msds ? (
                  <a
                    href={snapshot.msds}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:bg-slate-100 hover:border-slate-300 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-slate-700">MSDS Document</div>
                        <div className="text-[11px] text-slate-400">Material Safety Data Sheet</div>
                      </div>
                    </div>
                    <Download className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-slate-400">MSDS Document</div>
                      <div className="text-[11px] text-slate-400">N/A</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 7. Verification Support Contacts Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#033927] border-b border-slate-100 pb-2">Verification Support Contacts</h3>
              
              {/* Row 1: Email and Contact */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-[#689c30] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-slate-400 font-bold uppercase">Email Support</div>
                    {settings.email ? (
                      <a href={`mailto:${settings.email}`} className="text-[13px] font-semibold text-[#033927] hover:underline break-all">
                        {settings.email}
                      </a>
                    ) : (
                      <span className="text-[13px] font-semibold text-slate-500">N/A</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-[#689c30] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-slate-400 font-bold uppercase">Contact Number</div>
                    {settings.phone ? (
                      <a href={`tel:${settings.phone}`} className="text-[13px] font-semibold text-[#033927] hover:underline">
                        {settings.phone}
                      </a>
                    ) : (
                      <span className="text-[13px] font-semibold text-slate-500">N/A</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Corporate Address */}
              <div className="pt-2 flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#689c30] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">Corporate Address</div>
                  <p className="text-[13px] font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                    {settings.address || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

function InvalidVerificationView() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between antialiased">
      <div>
        <AnnouncementBar />
        <HeaderServer />
        <CartDrawer />
        
        <main className="mx-auto max-w-4xl px-4 pt-[130px] pb-20 flex items-center justify-center">
          <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-8 shadow-sm text-center space-y-5">
            <div className="h-16 w-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <XCircle className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-lg font-bold text-red-900">Verification Link Invalid</h1>
              <p className="text-[13.5px] text-slate-500 leading-relaxed">
                The verification code scanned does not exist in our registry. Please verify that you scanned the QR code from an authentic packaging label.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[#033927] hover:bg-[#689c30] hover:text-black font-semibold text-white transition-colors px-4 text-[12.5px] shadow-xs cursor-pointer select-none"
              >
                Go to Storefront
              </Link>
            </div>
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}
