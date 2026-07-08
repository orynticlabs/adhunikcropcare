import Image from "next/image"
import Link from "next/link"
import {
  Leaf, ArrowRight, Play,
  Sprout, FlaskConical, Droplets, Tractor, Bug,
  BookOpen, Recycle, ShieldCheck, Heart, Award,
  Star, Phone, Mail, MapPin, ChevronDown,
  ChevronLeft, ChevronRight,
  Info,
} from "lucide-react"
import Header from "@/components/layout/header"
import AnnouncementBar from "@/components/layout/announcement-bar"
import KnowledgeTabs from "@/components/home/knowledge-tabs"
import FAQAccordion from "@/components/home/faq-accordion"
import SmartAgriSection from "@/components/home/smart-agri-section"
import SizeCartButton from "@/features/cart/components/size-cart-button"
import CartDrawer from "@/features/cart/components/cart-drawer"
import TestimonialsCarousel from "@/components/home/testimonials-carousel"
import CropSuccessStories from "@/components/home/crop-success-stories"
import SiteFooter from "@/components/layout/site-footer"

/* ─── Data ───────────────────────────────────────────────── */
const CATEGORIES = [
  { icon: Sprout,       title: "Crop Fertilizers", desc: "NPK blends, micronutrients, growth boosters.", from: "from-[--leaf]/20", to: "to-[--moss]/30" },
  { icon: Leaf,         title: "Organic Range",    desc: "Compost, vermicompost, neem cake.",            from: "from-[--gold]/20", to: "to-[--leaf]/20" },
  { icon: FlaskConical, title: "Bio Products",     desc: "Rhizobium, mycorrhiza, beneficial microbes.",  from: "from-[--moss]/30", to: "to-[--leaf]/20" },
  { icon: Droplets,     title: "Soil Care",        desc: "pH balancers, conditioners, gypsum.",          from: "from-[--bark]/15", to: "to-[--gold]/20" },
  { icon: Tractor,      title: "Irrigation",       desc: "Drip systems, sprinklers, smart valves.",      from: "from-[--leaf]/25", to: "to-[--gold]/15" },
  { icon: Bug,          title: "Pest Management",  desc: "Bio-pesticides, IPM kits, traps.",             from: "from-[--moss]/20", to: "to-[--bark]/15" },
]

const PRODUCTS = [
  {
    name: "Adhunik Bio NPK",   price: "₹ 1,249", badge: "Bestseller",
    img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
    sizes: ["1 kg", "5 kg", "25 kg"], defaultSize: "5 kg",
  },
  {
    name: "Vermi+ Compost 25kg", price: "₹ 599", badge: "Organic",
    img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80",
    sizes: ["10 kg", "25 kg", "50 kg"], defaultSize: "25 kg",
  },
  {
    name: "NeemGuard Spray 1L", price: "₹ 449", badge: "Bio Pesticide",
    img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
    sizes: ["500 ml", "1 L", "5 L"], defaultSize: "1 L",
  },
  {
    name: "SoilRich Booster", price: "₹ 899", badge: "New",
    img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80",
    sizes: ["1 kg", "5 kg"], defaultSize: "1 kg",
  },
  {
    name: "DripFlow Starter Kit", price: "₹ 4,999", badge: "Smart",
    img: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80",
    sizes: undefined, defaultSize: undefined,   // kit — no size variants
  },
  {
    name: "MyCo Root Power", price: "₹ 749", badge: "Bio",
    img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
    sizes: ["250 g", "500 g", "1 kg"], defaultSize: "500 g",
  },
]

const TUTORIALS = [
  { title: "Soil testing 101",      duration: "8 min",  lang: "Hindi",   img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=300&q=80" },
  { title: "Drip irrigation setup", duration: "14 min", lang: "Marathi", img: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=300&q=80" },
  { title: "Organic pest control",  duration: "11 min", lang: "Tamil",   img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&q=80" },
]

const TESTIMONIALS = [
  { quote: "Adhunik's bio NPK gave us 32% better yield. The team visits us every season — it feels like a partnership.", name: "Ramesh Patel",  role: "Wheat farmer, Gujarat",    initial: "R" },
  { quote: "Switching to organic was scary. Adhunik made it easy with their farmer hub and free soil testing.",          name: "Lakshmi Devi", role: "Cotton farmer, Telangana", initial: "L" },
  { quote: "The smart irrigation kit paid for itself in one season. Premium quality, premium results.",                   name: "Arjun Singh",  role: "Vineyard owner, Nashik",   initial: "A" },
]

const SUSTAINABILITY = [
  { icon: Recycle,     title: "100% biodegradable", desc: "Packaging that returns to soil." },
  { icon: ShieldCheck, title: "Zero chemical residue", desc: "Certified safe across crops." },
  { icon: Heart,       title: "Fair-trade sourced", desc: "Farmer-first procurement." },
  { icon: Award,       title: "Carbon-neutral ops", desc: "Verified by SGS, 2024." },
]

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-1 text-[--gold]">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-current" aria-hidden />
      ))}
    </div>
  )
}

function productHref(name: string) {
  return `/products/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`
}

/* ─── Page ───────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnnouncementBar />
      <Header />
      <CartDrawer />

      <main>
        {/* ══ Hero ═══════════════════════════════════════════ */}
        <section id="home" className="relative isolate overflow-hidden pt-32 pb-10 sm:pt-48 sm:pb-14">
          {/* Background farm image */}
          <div className="absolute inset-0 -z-10">
            <Image
              src="/hero-field-Dp98Y55X.jpg"
              alt="Lush organic farmland"
              fill
              className="object-cover scale-110"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background" />
          </div>

          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-20 -left-20 h-96 w-96 rounded-full bg-[--leaf]/30 blur-3xl animate-blob" />
          <div
            className="pointer-events-none absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-[--gold]/25 blur-3xl animate-blob"
            style={{ animationDelay: "5s" }}
          />

          <div className="relative mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 mb-5 sm:mb-6 rounded-full bg-background/80 text-foreground border border-border/60 px-3 sm:px-4 py-1.5 backdrop-blur text-xs font-semibold">
                <Leaf className="h-3.5 w-3.5 text-[--leaf]" aria-hidden />
                ISO Certified Company · ISO 9001
              </div>

              {/* Heading */}
              <h1 className="text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
                Cultivating{" "}
                <span className="text-gradient-nature italic">tomorrow&apos;s</span>{" "}
                harvest,
                <br className="hidden sm:block" /> rooted in nature.
              </h1>

              <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-base sm:text-lg text-foreground/70 px-2 sm:px-0">
                Adhunik Crop Care delivers trusted pesticides, insecticides, fungicides, weedicides, and organic plant care solutions designed to improve crop health, increase productivity, and support sustainable farming across India.
              </p>

              {/* CTAs */}
              <div className="mt-7 sm:mt-9 flex flex-wrap items-center justify-center gap-3">
                <button className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 sm:px-7 h-11 sm:h-12 text-sm font-medium hover:bg-primary/90 transition shadow-luxe">
                  Explore Products <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
                <button className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 backdrop-blur px-6 sm:px-7 h-11 sm:h-12 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition">
                  <Info className="h-4 w-4" aria-hidden /> Learn About ACCPL
                </button>
              </div>

              {/* Stats */}
              <div className="mt-6 sm:mt-7 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-foreground/60">
                {[
                  { val: "180",  label: "Projects Develop"  },
                  { val: "100",  label: "Service Guarantee" },
                  { val: "7500", label: "Satisfied Clients" },
                  { val: "115",  label: "Team Member"       },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="font-display text-2xl text-foreground">{s.val}</div>
                    <div className="text-xs uppercase tracking-widest">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-foreground/50">
            <ChevronDown className="h-6 w-6 animate-bounce-soft" aria-hidden />
          </div>
        </section>

        {/* ══ Categories ══════════════════════════════════════ */}
        <section id="crop-fertilizers" className="relative py-10 sm:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mx-auto max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[--moss]">
                <Leaf className="h-3 w-3" aria-hidden /> What we grow
              </div>
              <h2 className="mt-4 sm:mt-5 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.1] tracking-tight">
                Solutions for every season.
              </h2>
              <p className="mt-3 sm:mt-4 text-foreground/70">
                Browse our complete range — from soil to harvest, designed for India&apos;s climate.
              </p>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map(({ icon: Icon, title, desc, from, to }) => (
                <div
                  key={title}
                  className={`group relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br ${from} ${to} p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-luxe`}
                >
                  <div className="relative grain" />
                  <div className="relative">
                    <div className="mb-6 inline-grid h-14 w-14 place-items-center rounded-2xl bg-background/80 text-[--moss] shadow-soft group-hover:scale-110 transition">
                      <Icon className="h-7 w-7" aria-hidden />
                    </div>
                    <h3 className="font-display text-2xl">{title}</h3>
                    <p className="mt-2 text-foreground/70">{desc}</p>
                    <a
                      href="#"
                      className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[--moss] hover:gap-2 transition-all"
                    >
                      Explore <ArrowRight className="h-4 w-4" aria-hidden />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Knowledge Centre ════════════════════════════════ */}
        <section
          id="knowledge-center"
          className="relative py-12 sm:py-16 bg-gradient-to-b from-transparent via-accent/30 to-transparent"
        >
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mx-auto max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[--moss]">
                <Leaf className="h-3 w-3" aria-hidden /> Seasonal guidance
              </div>
              <h2 className="mt-5 font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight">
                Recommendations tuned to the calendar.
              </h2>
            </div>
            <KnowledgeTabs />
          </div>
        </section>

        {/* ══ Marketplace ═════════════════════════════════════ */}
        <section id="marketplace" className="relative py-10 sm:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[--moss]">
                  <Leaf className="h-3 w-3" aria-hidden /> Marketplace
                </div>
                <h2 className="mt-4 sm:mt-5 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.1] tracking-tight">
                  Trusted by farmers, loved for results.
                </h2>
              </div>
              <div className="flex gap-2">
                <button className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground transition">
                  <ChevronLeft className="h-4 w-4" aria-label="Previous" />
                </button>
                <button className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground transition">
                  <ChevronRight className="h-4 w-4" aria-label="Next" />
                </button>
              </div>
            </div>

            <div className="mt-7 sm:mt-10 flex gap-4 sm:gap-5 overflow-x-auto pb-4 sm:pb-6 snap-x snap-mandatory scrollbar-none -mx-4 px-4">
              {PRODUCTS.map((p) => (
                <div
                  key={p.name}
                  className="group min-w-[240px] sm:min-w-[300px] lg:min-w-[320px] snap-start overflow-hidden rounded-2xl sm:rounded-3xl border border-border/40 bg-card shadow-soft hover:shadow-luxe transition-all flex-shrink-0"
                >
                  <Link
                    href={productHref(p.name)}
                    className="relative block aspect-square overflow-hidden bg-accent/40"
                    aria-label={`View ${p.name}`}
                  >
                    <Image
                      src={p.img}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 sm:top-4 sm:left-4 rounded-full bg-background/90 text-foreground border border-border/40 px-2.5 py-0.5 text-xs font-semibold shadow">
                      {p.badge}
                    </span>
                  </Link>
                  <div className="p-4 sm:p-5">
                    <Link href={productHref(p.name)} className="font-display text-lg sm:text-xl hover:text-[--leaf]">
                      {p.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-1">
                      <Stars />
                      <span className="ml-1 text-xs text-muted-foreground">(284)</span>
                    </div>
                    <div className="mt-3 sm:mt-4">
                      <span className="font-display text-xl sm:text-2xl">{p.price}</span>
                      <div className="mt-2 sm:mt-3">
                        <SizeCartButton product={p} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Farmer Services ═════════════════════════════════ */}
        <section
          id="farmer-services"
          className="relative py-10 sm:py-16 bg-gradient-to-b from-accent/20 via-transparent to-accent/20"
        >
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[--moss]">
                  <Leaf className="h-3 w-3" aria-hidden /> Farmer Education Hub
                </div>
                <h2 className="mt-4 sm:mt-5 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.1] tracking-tight">
                  Knowledge that grows with you.
                </h2>
                <p className="mt-4 sm:mt-5 text-foreground/70 max-w-lg">
                  Practical, regional, and free. Learn from agronomists, watch
                  tutorials in your language, and join thousands of farmers
                  building sustainable practices.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    { val: "12,400+", label: "Video tutorials" },
                    { val: "18",      label: "Indian languages" },
                    { val: "96%",     label: "Completion rate" },
                    { val: "Free",    label: "Forever" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-2xl border border-border/40 bg-card/80 p-5 shadow-soft"
                    >
                      <div className="font-display text-3xl text-[--moss]">{s.val}</div>
                      <div className="text-sm text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>

                <button className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 h-10 text-sm font-medium hover:bg-primary/90 transition shadow">
                  <BookOpen className="h-4 w-4" aria-hidden /> Open Knowledge Center
                </button>
              </div>

              {/* Tutorial video cards */}
              <div className="relative">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[--leaf]/30 to-[--gold]/20 blur-2xl pointer-events-none" />
                <div className="relative grid gap-4">
                  {TUTORIALS.map((t, i) => (
                    <div
                      key={t.title}
                      className={`group relative overflow-hidden rounded-3xl border border-border/40 bg-card shadow-soft hover:shadow-luxe transition-all ${
                        i === 1 ? "lg:translate-x-8" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4 p-3">
                        <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-2xl">
                          <Image src={t.img} alt={t.title} fill className="object-cover" />
                          <div className="absolute inset-0 grid place-items-center bg-black/30">
                            <Play className="h-6 w-6 fill-white text-white" aria-hidden />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-display text-lg">{t.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {t.duration} · {t.lang}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ Smart Agriculture (client) ══════════════════════ */}
        <SmartAgriSection />

        {/* ══ Certifications / Sustainability ═════════════════ */}
        <section id="certifications" className="relative py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-luxe">
                <Image
                  src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80"
                  alt="Soil and seedling"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-[--moss]/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl glass border border-border/30 p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-[--leaf]/20 text-[--moss]">
                      <Leaf className="h-6 w-6" aria-hidden />
                    </div>
                    <div>
                      <div className="font-display text-lg">2.4M tons CO₂ saved</div>
                      <p className="text-xs text-muted-foreground">
                        By switching farms to organic.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[--moss]">
                  <Leaf className="h-3 w-3" aria-hidden /> Sustainability Commitment
                </div>
                <h2 className="mt-5 font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight">
                  Eco-first. Always.
                </h2>
                <p className="mt-5 text-foreground/70 max-w-lg">
                  We believe luxury isn&apos;t a label — it&apos;s a responsibility. Every
                  Adhunik product is engineered for yield without compromising the
                  earth.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {SUSTAINABILITY.map(({ icon: Icon, title, desc }) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-border/40 bg-card/60 p-5"
                    >
                      <Icon className="h-6 w-6 text-[--moss]" aria-hidden />
                      <h4 className="mt-3 font-display text-lg">{title}</h4>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ Testimonials carousel ═══════════════════════════ */}
        <section className="relative overflow-hidden py-12 sm:py-16 bg-gradient-to-b from-accent/20 to-transparent">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mx-auto max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[--moss]">
                <Leaf className="h-3 w-3" aria-hidden /> Voices from the field
              </div>
              <h2 className="mt-5 font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight">
                Farmers, not customers.
              </h2>
            </div>

            <TestimonialsCarousel />
          </div>
        </section>

        {/* ══ FAQ ═════════════════════════════════════════════ */}
        <section id="contact-us" className="relative py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4">
            <div className="text-center mx-auto max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[--moss]">
                <Leaf className="h-3 w-3" aria-hidden /> FAQ
              </div>
              <h2 className="mt-5 font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight">
                Questions, answered.
              </h2>
            </div>
            <FAQAccordion />
          </div>
        </section>

        <CropSuccessStories />
      </main>

      <SiteFooter />
    </div>
  )
}
