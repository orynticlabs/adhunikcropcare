import Image from "next/image"
import { ArrowUpRight, Leaf, Mail, MapPin, Phone } from "lucide-react"

type SocialPlatform = "facebook" | "instagram" | "youtube" | "whatsapp"

type SocialLink = {
  href: string
  label: string
  platform: SocialPlatform
}

const COMPANY_EMAIL = process.env.NEXT_PUBLIC_COMPANY_EMAIL || "support@adhunikcropcare.com"
const COMPANY_PHONE = process.env.NEXT_PUBLIC_COMPANY_PHONE || "+919205762766"
const COMPANY_ADDRESS = process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "India"

const SOCIAL_LINKS = [
  { label: "Instagram", href: process.env.NEXT_PUBLIC_INSTAGRAM_URL, platform: "instagram" },
  { label: "Facebook", href: process.env.NEXT_PUBLIC_FACEBOOK_URL, platform: "facebook" },
  { label: "YouTube", href: process.env.NEXT_PUBLIC_YOUTUBE_URL, platform: "youtube" },
  { label: "WhatsApp", href: process.env.NEXT_PUBLIC_WHATSAPP_URL, platform: "whatsapp" },
].filter((link): link is SocialLink => Boolean(link.href))

const FOOTER_COLUMNS = [
  {
    heading: "Company",
    links: [
      ["About Us", "/about"],
      ["Contact Us", "/contact"],
      ["Certifications", "/certifications"],
      ["Field Journal", "/blog"],
    ],
  },
  {
    heading: "Crop Protection",
    links: [
      ["Insecticides", "/insecticides"],
      ["Herbicides", "/herbicides"],
      ["Fungicides", "/fungicides"],
      ["Bio-Pesticides", "/bio-products"],
      ["Bio Fertilizers", "/crop-fertilizers"],
    ],
  },
  {
    heading: "Farmer Support",
    links: [
      ["All Products", "/products"],
      ["Farmer Services", "/farmer-services"],
      ["Knowledge Center", "/knowledge-center"],
      ["Soil Care", "/soil-care"],
      ["Bulk Support", "/bulk-support"],
    ],
  },
]

function SocialLogo({ platform }: { platform: SocialPlatform }) {
  const paths: Record<SocialPlatform, string> = {
    instagram: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077",
    facebook: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
    youtube: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
  }

  const colors: Record<SocialPlatform, string> = {
    facebook: "#0866FF",
    instagram: "#FF0069",
    whatsapp: "#25D366",
    youtube: "#FF0000",
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill={colors[platform]} aria-hidden>
      <path d={paths[platform]} />
    </svg>
  )
}

export default function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#043927] text-cream">
      <div className="pointer-events-none absolute -right-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-[#689c30]/10 blur-3xl" />
      <Leaf className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rotate-12 text-white/[0.025]" strokeWidth={0.65} aria-hidden />

      <div className="relative mx-auto max-w-[1440px] px-4 pb-4 pt-10 sm:px-6 sm:pb-5 sm:pt-12 lg:px-12 lg:pt-14">
        <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)] lg:items-start lg:gap-12">
          <div className="max-w-xl">
            <Image
              src="/adhunikwhite.png"
              alt="Adhunik Crop Care"
              width={120}
              height={84}
              className="h-16 w-auto object-contain sm:h-[4.5rem]"
            />
            <div className="mt-4 h-1 w-14 rounded-full bg-[#D4AF37] sm:mt-5" />
            <p className="mt-4 max-w-lg text-sm leading-6 text-cream/60 sm:mt-5 sm:text-[15px] sm:leading-7">
              Adhunik Crop Care Pvt. Ltd. supports Indian agriculture with trusted
              crop protection solutions, organic plant care products, and practical
              farmer education to improve productivity and sustainable farming
              practices.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 sm:gap-x-8">
            {FOOTER_COLUMNS.map((column, columnIndex) => (
              <div key={column.heading} className={columnIndex === 2 ? "col-span-2 sm:col-span-1" : ""}>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                  <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37] sm:tracking-[0.22em]">
                    {column.heading}
                  </h4>
                </div>
                <ul className={`mt-4 gap-x-5 gap-y-2.5 ${columnIndex === 2 ? "grid grid-cols-2 sm:block sm:space-y-2.5" : "space-y-2.5"}`}>
                  {column.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="group inline-flex items-center gap-1 text-sm leading-5 text-cream/58 transition-colors duration-300 hover:text-white">
                        <span>{label}</span>
                        <ArrowUpRight className="h-3 w-3 shrink-0 translate-y-0.5 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-70" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-9 rounded-[1.5rem] bg-[#0a4935] px-4 py-5 shadow-[0_22px_55px_rgba(0,0,0,0.13)] sm:mt-10 sm:px-6 lg:px-7">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[1.05fr_1.25fr_.85fr_auto] lg:items-center lg:gap-6">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#D4AF37] text-[#043927]">
                <MapPin className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/75">Find us</p>
                <p className="mt-1 break-words text-sm leading-5 text-cream/70">{COMPANY_ADDRESS}</p>
              </div>
            </div>

            <a href={`mailto:${COMPANY_EMAIL}`} className="group flex min-w-0 items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.07] text-[#D4AF37] transition-colors group-hover:bg-[#D4AF37] group-hover:text-[#043927]">
                <Mail className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/75">Write to us</span>
                <span className="mt-1 block break-all text-sm leading-5 text-cream/70 transition-colors group-hover:text-white">{COMPANY_EMAIL}</span>
              </span>
            </a>

            <a href={`tel:${COMPANY_PHONE.replace(/[^+\d]/g, "")}`} className="group flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.07] text-[#D4AF37] transition-colors group-hover:bg-[#D4AF37] group-hover:text-[#043927]">
                <Phone className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/75">Call us</span>
                <span className="mt-1 block break-words text-sm leading-5 text-cream/70 transition-colors group-hover:text-white">{COMPANY_PHONE}</span>
              </span>
            </a>

            {SOCIAL_LINKS.length > 0 ? (
              <div>
                <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/75 lg:text-right">Follow us</p>
                <div className="flex flex-nowrap gap-2">
                  {SOCIAL_LINKS.map((social) => (
                    <a
                      key={social.platform}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Follow Adhunik Crop Care on ${social.label}`}
                      title={social.label}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <SocialLogo platform={social.platform} />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-xl bg-black/10 px-4 py-3.5 sm:px-5 lg:flex-row">
          <p className="text-center text-[10px] uppercase leading-5 tracking-widest text-cream/38 lg:text-left">
            © 2026 Adhunik Crop Care Pvt. Ltd. <span className="mx-1 text-cream/15">|</span> Developed By{" "}
            <a href="https://orynticlabs.com" target="_blank" rel="noopener noreferrer" className="font-medium text-[#e84118] transition-opacity hover:opacity-80">
              OrynticLabs Private Limited
            </a>
          </p>

          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-widest text-cream/40" aria-label="Policies">
            {[
              ["Privacy", "/privacy-policy"],
              ["Terms", "/terms-and-conditions"],
              ["Refunds", "/refund-policy"],
              ["Cookies", "/cookie-policy"],
            ].map(([label, href], index) => (
              <span key={href} className="inline-flex items-center gap-4">
                {index > 0 ? <span className="h-1 w-1 rounded-full bg-[#D4AF37]/35" /> : null}
                <a href={href} className="transition-colors hover:text-white">{label}</a>
              </span>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
