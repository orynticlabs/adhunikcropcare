import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Leaf } from "lucide-react"

type AuthSidePanelProps = {
  eyebrow: string
  title: ReactNode
  description: string
  items: string[]
  itemIcon: LucideIcon
}

export function AuthSidePanel({
  eyebrow,
  title,
  description,
  items,
  itemIcon: ItemIcon,
}: AuthSidePanelProps) {
  return (
    <div className="auth-side-panel relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(233,196,106,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(104,156,48,0.2),transparent_34%),linear-gradient(160deg,#02271d_0%,#033927_52%,#0a4d38_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-80 mix-blend-screen">
        <div className="absolute -right-16 top-10 h-56 w-56 rounded-full bg-[#e9c46a]/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 translate-y-1/4 rounded-full bg-[#689c30]/18 blur-3xl" />
      </div>
      <div className="grain opacity-70" />

      <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
        <div className="space-y-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/82 backdrop-blur-sm">
            <Leaf className="h-3.5 w-3.5 text-[#e9c46a]" />
            <span>{eyebrow}</span>
          </div>

          <div className="max-w-sm space-y-4">
            <h1 className="font-display text-4xl leading-[1.05] text-white drop-shadow-sm">
              {title}
            </h1>
            <p className="text-sm leading-7 text-white/78">{description}</p>
          </div>
        </div>

        <div className="relative mt-10 rounded-[1.75rem] border border-white/12 bg-white/8 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-md">
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(233,196,106,0.55)] to-transparent" />
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/58">
            Why growers choose us
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e9c46a]/18 text-[#e9c46a] ring-1 ring-white/8">
                  <ItemIcon className="h-4 w-4" />
                </div>
                <span className="text-sm leading-6 text-white/88">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
