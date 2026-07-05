import Image from "next/image"
import {
  Leaf, ArrowRight, Play,
  Sprout, FlaskConical, Droplets, Tractor, Bug,
  BookOpen, Recycle, ShieldCheck, Heart, Award,
  Star, Phone, Mail, MapPin, ChevronDown,
  ChevronLeft, ChevronRight,
} from "lucide-react"
import Header from "@/components/header"
import AnnouncementBar from "@/components/announcement-bar"
import KnowledgeTabs from "@/components/knowledge-tabs"
import FAQAccordion from "@/components/faq-accordion"
import SmartAgriSection from "@/components/smart-agri-section"
import NewsletterForm from "@/components/newsletter-form"
import AddToCartButton from "@/components/add-to-cart-button"
import CartDrawer from "@/components/cart-drawer"

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
  { name: "Adhunik Bio NPK",   price: "₹ 1,249", badge: "Bestseller",   img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80" },
  { name: "Vermi+ Compost 25kg", price: "₹ 599",  badge: "Organic",      img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80" },
  { name: "NeemGuard Spray 1L",  price: "₹ 449",  badge: "Bio Pesticide",img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80" },
  { name: "SoilRich Booster",    price: "₹ 899",  badge: "New",          img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80" },
  { name: "DripFlow Starter Kit",price: "₹ 4,999",badge: "Smart",        img: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80" },
  { name: "MyCo Root Power",     price: "₹ 749",  badge: "Bio",          img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80" },
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

/* ─── Page ───────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnnouncementBar />
      <Header />
      <CartDrawer />

      <main>
        {/* ══ Hero ═══════════════════════════════════════════ */}
        <section id="home" className="relative isolate overflow-hidden pt-40 pb-24 sm:pt-48 sm:pb-32">
          {/* Background farm image */}
          <div className="absolute inset-0 -z-10">
            <Image
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80"
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
              <div className="inline-flex items-center gap-1.5 mb-6 rounded-full bg-background/80 text-foreground border border-border/60 px-4 py-1.5 backdrop-blur text-xs font-semibold">
                <Leaf className="h-3.5 w-3.5 text-[--leaf]" aria-hidden />
                Certified Organic · ISO 9001 · Eco Mark
              </div>

              {/* Heading */}
              <h1 className="text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
                Cultivating{" "}
                <span className="text-gradient-nature italic">tomorrow&apos;s</span>{" "}
                harvest,
                <br className="hidden sm:block" /> rooted in nature.
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg text-foreground/70">
                Premium crop care from soil to harvest. Organic fertilizers, bio
                products and smart agriculture solutions trusted by 250,000+
                farmers across India.
              </p>

              {/* CTAs */}
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <button className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 h-12 text-sm font-medium hover:bg-primary/90 transition shadow-luxe">
                  Explore Marketplace <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
                <button className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 backdrop-blur px-7 h-12 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition">
                  <Play className="h-4 w-4" aria-hidden /> Watch Story
                </button>
              </div>

              {/* Stats */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-foreground/60">
                {[
                  { val: "250K+", label: "Farmers" },
                  { val: "1,200+", label: "Products" },
                  { val: "28", label: "States" },
                  { val: "15 yrs", label: "Of trust" },
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
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-foreground/50">
            <ChevronDown className="h-6 w-6 animate-bounce-soft" aria-hidden />
          </div>
        </section>

        {/* ══ Categories ══════════════════════════════════════ */}
        <section id="crop-fertilizers" className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mx-auto max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[--moss]">
                <Leaf className="h-3 w-3" aria-hidden /> What we grow
              </div>
              <h2 className="mt-5 font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight">
                Solutions for every season.
              </h2>
              <p className="mt-4 text-foreground/70">
                Browse our complete range — from soil to harvest, designed for India&apos;s climate.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          className="relative py-24 sm:py-32 bg-gradient-to-b from-transparent via-accent/30 to-transparent"
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
        <section id="marketplace" className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[--moss]">
                  <Leaf className="h-3 w-3" aria-hidden /> Marketplace
                </div>
                <h2 className="mt-5 font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight">
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

            <div className="mt-10 flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-none">
              {PRODUCTS.map((p) => (
                <div
                  key={p.name}
                  className="group min-w-[280px] sm:min-w-[340px] snap-start overflow-hidden rounded-3xl border border-border/40 bg-card shadow-soft hover:shadow-luxe transition-all flex-shrink-0"
                >
                  <div className="relative aspect-square overflow-hidden bg-accent/40">
                    <Image
                      src={p.img}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute top-4 left-4 rounded-full bg-background/90 text-foreground border border-border/40 px-2.5 py-0.5 text-xs font-semibold shadow">
                      {p.badge}
                    </span>
                  </div>
                  <div className="p-5">
                    <h4 className="font-display text-xl">{p.name}</h4>
                    <div className="mt-1 flex items-center gap-1">
                      <Stars />
                      <span className="ml-1 text-xs text-muted-foreground">(284)</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-display text-2xl">{p.price}</span>
                      <AddToCartButton product={p} />
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
          className="relative py-24 sm:py-32 bg-gradient-to-b from-accent/20 via-transparent to-accent/20"
        >
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[--moss]">
                  <Leaf className="h-3 w-3" aria-hidden /> Farmer Education Hub
                </div>
                <h2 className="mt-5 font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight">
                  Knowledge that grows with you.
                </h2>
                <p className="mt-5 text-foreground/70 max-w-lg">
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
        <section id="certifications" className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
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

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
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

        {/* ══ Testimonials ════════════════════════════════════ */}
        <section className="relative py-24 sm:py-32 bg-gradient-to-b from-accent/20 to-transparent">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mx-auto max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[--moss]">
                <Leaf className="h-3 w-3" aria-hidden /> Voices from the field
              </div>
              <h2 className="mt-5 font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight">
                Farmers, not customers.
              </h2>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={t.name}
                  className={`relative rounded-3xl border border-border/40 bg-card/80 p-8 shadow-soft hover:shadow-luxe transition-all ${
                    i === 1 ? "md:-translate-y-4" : ""
                  }`}
                >
                  <Stars count={5} />
                  <p className="mt-5 text-foreground/80 leading-relaxed">
                    &quot;{t.quote}&quot;
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[--leaf] to-[--moss] text-cream font-display text-lg font-semibold">
                      {t.initial}
                    </div>
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FAQ ═════════════════════════════════════════════ */}
        <section id="contact-us" className="relative py-24 sm:py-32">
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
      </main>

      {/* ══ Footer ══════════════════════════════════════════ */}
      <footer className="relative mt-16 overflow-hidden bg-gradient-to-br from-[--moss] to-[--bark]/80 text-cream">
        <div className="absolute inset-0 grain opacity-30 pointer-events-none" />
        <div className="pointer-events-none absolute -top-20 -right-20 h-96 w-96 rounded-full bg-[--leaf]/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-cream text-[--moss] font-display text-lg font-bold">
                  A
                </span>
                <span className="font-display text-2xl">Adhunik Crop Care</span>
              </div>
              <p className="mt-5 max-w-sm text-cream/70">
                Rooted in nature, engineered for tomorrow. India&apos;s premium
                eco-agriculture house.
              </p>

              {/* Newsletter */}
              <NewsletterForm />

              <div className="mt-8 space-y-2 text-sm text-cream/70">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" aria-hidden /> 1800-200-CROP
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" aria-hidden /> hello@adhunikcrop.in
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden /> Pune, Maharashtra, India
                </div>
              </div>
            </div>

            {/* Links */}
            {[
              {
                heading: "Shop",
                links: [
                  ["Crop Fertilizers", "#crop-fertilizers"],
                  ["Organic Range", "#organic-range"],
                  ["Bio Products", "#bio-products"],
                  ["Soil Care", "#soil-care"],
                  ["Pest Management", "#pest-management"],
                ],
              },
              {
                heading: "Company",
                links: [
                  ["Our Story", "#our-story"],
                  ["Sustainability", "#certifications"],
                  ["Careers", "#careers"],
                  ["Press", "#press"],
                  ["Certifications", "#certifications"],
                ],
              },
              {
                heading: "Farmers",
                links: [
                  ["Farmer Services", "#farmer-services"],
                  ["Knowledge Center", "#knowledge-center"],
                  ["Blogs", "#blogs"],
                  ["Smart Agriculture", "#smart-agriculture"],
                  ["Weather Alerts", "#weather-alerts"],
                ],
              },
              {
                heading: "Business",
                links: [
                  ["Marketplace", "#marketplace"],
                  ["Wholesale", "#wholesale"],
                  ["Export", "#export"],
                  ["Partnerships", "#partnerships"],
                  ["Bulk Orders", "#bulk-orders"],
                ],
              },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="font-display text-lg">{col.heading}</h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="text-sm text-cream/70 hover:text-cream transition"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-cream/15 pt-8 text-sm text-cream/60">
            <div>© 2026 Adhunik Crop Care Pvt. Ltd. All rights reserved.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-cream transition">Privacy</a>
              <a href="#" className="hover:text-cream transition">Terms</a>
              <a href="#" className="hover:text-cream transition">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
