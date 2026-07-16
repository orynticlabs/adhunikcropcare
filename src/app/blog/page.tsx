import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Leaf,
  Mail,
  Sprout,
} from "lucide-react"
import AnnouncementBar from "@/components/layout/announcement-bar"
import Header from "@/components/layout/header"
import SiteFooter from "@/components/layout/site-footer"
import CartDrawer from "@/features/cart/components/cart-drawer"

export const metadata: Metadata = {
  title: "Field Journal | Adhunik Crop Care",
  description:
    "Read practical crop insights, soil stories, seasonal guidance, and ideas for stronger Indian farms.",
}

const STORIES = [
  {
    category: "Soil intelligence",
    title: "The field is speaking. Are we listening?",
    excerpt: "Five practical signs that reveal what soil structure, moisture, and root activity are telling you before the crop shows stress.",
    image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1100&q=88",
    date: "12 July 2026",
    time: "7 min",
    size: "large",
  },
  {
    category: "Crop nutrition",
    title: "A better way to think about NPK",
    excerpt: "Move beyond three numbers and match nutrition with the crop’s changing priorities.",
    image: "https://images.unsplash.com/photo-1591382386627-349b692688ff?w=900&q=88",
    date: "8 July 2026",
    time: "5 min",
    size: "small",
  },
  {
    category: "Water management",
    title: "Every drop needs a destination",
    excerpt: "Root-zone thinking can make irrigation schedules more useful and less wasteful.",
    image: "https://images.unsplash.com/photo-1536633125620-8a3245c11ffa?w=900&q=88",
    date: "2 July 2026",
    time: "6 min",
    size: "small",
  },
  {
    category: "Field practice",
    title: "Why timing often matters more than quantity",
    excerpt: "The same input can perform differently when crop stage, weather, and soil moisture are ignored.",
    image: "https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?w=900&q=88",
    date: "25 June 2026",
    time: "8 min",
    size: "wide",
  },
]

const NOTES = [
  ["01", "Kharif", "Prepare drainage before the rain tests your field."],
  ["02", "Roots", "Healthy top growth begins below the visible crop."],
  ["03", "Spray", "Weather, water quality, and coverage work as one system."],
  ["04", "Harvest", "Quality is built through the season, not at the final stage."],
]

export default function BlogPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f3f0e8] text-[#203129]">
      <AnnouncementBar />
      <Header />
      <CartDrawer />

      <main>
        <section className="relative overflow-hidden pb-16 pt-36 sm:pt-44">
          <div className="absolute right-0 top-16 h-96 w-96 translate-x-1/3 rounded-full bg-[#d5dfaa]/45 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4">
            <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#758078]">
              <Link href="/" className="hover:text-[#033927]">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-[#689c30]">Field Journal</span>
            </nav>

            <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#bfcabb] bg-white/55 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]">
                  <BookOpen className="h-4 w-4 text-[#689c30]" />
                  Ideas grown in the field
                </div>
                <h1 className="mt-7 max-w-4xl font-display text-6xl leading-[.88] tracking-tight sm:text-8xl lg:text-[7.5rem]">
                  Field
                  <span className="block italic text-[#689c30]">Journal.</span>
                </h1>
              </div>
              <div className="border-l border-[#bac6ba] pl-6">
                <p className="max-w-lg text-lg leading-8 text-[#5f6b62]">
                  Practical thinking for growers who want to understand the field,
                  not simply react to it.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Nutrition", "Soil", "Organic", "Weather", "Farmer stories"].map((topic) => (
                    <span key={topic} className="rounded-full border border-[#c8d1c7] px-3 py-1.5 text-xs font-semibold">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-4">
            <article className="grid overflow-hidden rounded-[2.75rem] bg-[#173d30] text-white shadow-2xl lg:grid-cols-[1.2fr_.8fr]">
              <div className="relative min-h-[430px] lg:min-h-[590px]">
                <Image
                  src="https://images.unsplash.com/photo-1463123081488-789f998ac9c4?w=1400&q=90"
                  alt="Farmer walking through a green field"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#102f25]/60 via-transparent to-transparent" />
                <span className="absolute left-6 top-6 rounded-full bg-[#e9c46a] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#17382d]">
                  Cover story
                </span>
              </div>
              <div className="flex flex-col justify-between p-8 sm:p-12">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#bdd879]">Farmer perspective</p>
                  <h2 className="mt-5 font-display text-4xl leading-tight sm:text-6xl">
                    The best technology still begins with observation.
                  </h2>
                  <p className="mt-6 leading-7 text-white/65">
                    What experienced growers notice before they decide—and why field
                    walks remain one of agriculture’s most valuable tools.
                  </p>
                </div>
                <div className="mt-10">
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> 16 July 2026</span>
                    <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> 9 min read</span>
                  </div>
                  <a href="#latest-stories" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#e9c46a]">
                    Read the journal <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="latest-stories" className="bg-[#e7ece5] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#689c30]">Latest stories</p>
                <h2 className="mt-4 font-display text-4xl sm:text-6xl">Read by curiosity.</h2>
              </div>
              <p className="hidden max-w-sm text-right text-sm leading-6 text-[#667369] sm:block">
                Draft editorial content ready for your real articles and publishing workflow.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {STORIES.map((story, index) => (
                <article
                  key={story.title}
                  className={`group overflow-hidden rounded-[2.25rem] bg-[#f9f7f1] ${
                    story.size === "large" ? "lg:row-span-2" : ""
                  } ${story.size === "wide" ? "lg:col-span-2 lg:grid lg:grid-cols-2" : ""}`}
                >
                  <div className={`relative overflow-hidden ${story.size === "large" ? "min-h-[440px]" : "min-h-64"}`}>
                    <Image
                      src={story.image}
                      alt={story.title}
                      fill
                      sizes={story.size === "wide" ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 100vw, 50vw"}
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-5 top-5 rounded-full bg-white/88 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] backdrop-blur">
                      {story.category}
                    </span>
                  </div>
                  <div className="p-6 sm:p-8">
                    <p className="font-display text-5xl text-[#689c30]/20">0{index + 1}</p>
                    <h3 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{story.title}</h3>
                    <p className="mt-4 leading-7 text-[#667369]">{story.excerpt}</p>
                    <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#d9ddd4] pt-5">
                      <span className="text-xs text-[#7b877e]">{story.date} · {story.time}</span>
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#203e31] text-white">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
              <div>
                <div className="sticky top-32">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#689c30]">Field notes</p>
                  <h2 className="mt-4 font-display text-5xl leading-tight">Short reads for busy seasons.</h2>
                  <Sprout className="mt-10 h-32 w-32 text-[#d5dfaa]" strokeWidth={0.8} />
                </div>
              </div>
              <div className="divide-y divide-[#cdd5cc]">
                {NOTES.map(([number, topic, note]) => (
                  <div key={number} className="grid gap-4 py-7 sm:grid-cols-[70px_110px_1fr] sm:items-center">
                    <span className="font-display text-3xl text-[#9a7a35]">{number}</span>
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#689c30]">{topic}</span>
                    <p className="font-display text-2xl leading-snug sm:text-3xl">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="relative overflow-hidden rounded-[2.75rem] bg-[#e9c46a] p-8 sm:p-12 lg:grid lg:grid-cols-[1fr_.8fr] lg:items-center lg:p-16">
              <Leaf className="absolute -right-16 -top-20 h-80 w-80 text-white/25" strokeWidth={0.7} />
              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#655625]">From our field to your inbox</p>
                <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-6xl">
                  One thoughtful farm note each month.
                </h2>
              </div>
              <form className="relative mt-8 rounded-[2rem] bg-white/55 p-3 backdrop-blur lg:mt-0">
                <label className="flex flex-col gap-3 sm:flex-row">
                  <span className="sr-only">Email address</span>
                  <span className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667369]" />
                    <input
                      type="email"
                      placeholder="Your email address"
                      className="h-12 w-full rounded-full border border-[#c6b269]/45 bg-white pl-11 pr-4 text-sm outline-none focus:border-[#203e31]"
                    />
                  </span>
                  <button className="h-12 rounded-full bg-[#203e31] px-6 text-sm font-bold text-white hover:text-white">
                    Subscribe
                  </button>
                </label>
              </form>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
