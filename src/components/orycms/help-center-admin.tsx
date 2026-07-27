"use client"

import { useState } from "react"
import type React from "react"
import {
  BookOpen,
  Briefcase,
  Clock,
  Globe,
  LifeBuoy,
  Mail,
  MessageCircle,
  PhoneCall,
  ShieldAlert,
} from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { cn } from "@/lib/utils"

type ContactOption = {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  actionLabel: string
  href?: string
  comingSoon?: boolean
}

const CONTACT_OPTIONS: ContactOption[] = [
  {
    icon: Mail,
    title: "Email support",
    description: "Report bugs, ask configuration questions, or get help with day-to-day OryCMS usage.",
    actionLabel: "support@orynticlabs.com",
    href: "mailto:support@orynticlabs.com?subject=OryCMS%20Support%20Request",
  },
  {
    icon: Briefcase,
    title: "Sales & enterprise",
    description: "Talk to the team about plugins, enterprise plans, and licensing for OryCMS.",
    actionLabel: "sales@orynticlabs.com",
    href: "mailto:sales@orynticlabs.com?subject=OryCMS%20Enterprise%20Enquiry",
  },
  {
    icon: MessageCircle,
    title: "Live chat",
    description: "Chat live with an OryCMS specialist for quick, real-time troubleshooting.",
    actionLabel: "Start chat",
    comingSoon: true,
  },
  {
    icon: PhoneCall,
    title: "Schedule a call",
    description: "Book a 30-minute onboarding or troubleshooting call with the OryCMS team.",
    actionLabel: "Book a call",
    comingSoon: true,
  },
]

const RESOURCE_OPTIONS: ContactOption[] = [
  {
    icon: BookOpen,
    title: "FAQs",
    description: "Browse frequently asked questions maintained by your team.",
    actionLabel: "Open FAQs",
    href: "/admin/collections/faqs",
  },
  {
    icon: Globe,
    title: "OrynticLabs",
    description: "Learn more about OrynticLabs Private Limited, the company behind OryCMS.",
    actionLabel: "orynticlabs.com",
    href: "https://orynticlabs.com",
  },
]

export function OryCMSHelpCenterPage() {
  const [comingSoon, setComingSoon] = useState<ContactOption | null>(null)

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-8">
      <div>
        <OryCMSBreadcrumbs items={[{ href: "/admin", label: "Overview" }, { href: "/admin/help-center", label: "Help Center" }]} />
        <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">Help Center</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
          Connect with the OryCMS team for support, onboarding, and platform guidance.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.8fr_1fr]">
        <div className="space-y-5">
          <Card>
            <SectionHeader
              icon={LifeBuoy}
              title="Get in touch"
              description="Choose whichever channel works best for you — our team typically responds within one business day."
            />
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {CONTACT_OPTIONS.map((option) => (
                <ContactCard key={option.title} option={option} onComingSoon={setComingSoon} />
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader
              icon={BookOpen}
              title="Self-serve resources"
              description="Answers to common questions, without waiting on a reply."
            />
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {RESOURCE_OPTIONS.map((option) => (
                <ContactCard key={option.title} option={option} onComingSoon={setComingSoon} />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionHeader
              icon={Clock}
              title="Support hours"
              description="When the OryCMS team is online and typical response times."
            />
            <div className="mt-5 space-y-3 text-[12.5px]">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-muted-foreground">Monday – Saturday</span>
                <span className="font-medium">9:00 AM – 7:00 PM IST</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Typical email response</span>
                <span className="font-medium">Within 4 business hours</span>
              </div>
            </div>
          </Card>

          <Card className="border-destructive/30">
            <SectionHeader
              icon={ShieldAlert}
              title="Urgent issue?"
              description="For storefront outages or payment failures, message us on WhatsApp so the team can prioritize."
            />
            <div className="mt-5">
              <a
                href="https://wa.link/myuuq4"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-[12.5px] font-medium text-destructive transition-colors hover:bg-destructive/20"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp an urgent request
              </a>
            </div>
          </Card>
        </div>
      </div>

      <ComingSoonModal option={comingSoon} onClose={() => setComingSoon(null)} />
    </section>
  )
}

function ContactCard({
  option,
  onComingSoon,
}: {
  option: ContactOption
  onComingSoon: (option: ContactOption) => void
}) {
  const Icon = option.icon

  const inner = (
    <>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium">{option.title}</div>
        <div className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{option.description}</div>
        <div className="mt-2 text-[11.5px] font-medium text-foreground group-hover:underline">
          {option.actionLabel} →
        </div>
      </div>
    </>
  )

  if (option.comingSoon) {
    return (
      <button
        type="button"
        onClick={() => onComingSoon(option)}
        className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong hover:bg-accent"
      >
        {inner}
      </button>
    )
  }

  const isExternal = option.href?.startsWith("http")

  return (
    <a
      href={option.href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-accent"
    >
      {inner}
    </a>
  )
}

function ComingSoonModal({ option, onClose }: { option: ContactOption | null; onClose: () => void }) {
  if (!option) return null
  const Icon = option.icon

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-background/85 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-center-coming-soon-title"
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-white p-6 text-center text-foreground shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--orycms-color-primary)]/10 text-foreground">
          <Icon className="h-6 w-6" />
        </div>
        <h2 id="help-center-coming-soon-title" className="mt-4 text-xl font-semibold tracking-tight">
          Coming soon
        </h2>
        <p className="mt-3 text-[13.5px] leading-6 text-muted-foreground">
          {option.title} is currently under development and will be available soon from{" "}
          <span className="font-semibold text-foreground">OrynticLabs Private Limited</span>.
        </p>
        <p className="mt-4 text-[13.5px] leading-6 text-muted-foreground">
          In the meantime, reach us at{" "}
          <a href="mailto:support@orynticlabs.com" className="font-semibold text-[var(--orycms-color-primary)] hover:underline">
            support@orynticlabs.com
          </a>
          .
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-10 w-full rounded-lg bg-foreground text-[13px] font-semibold text-background transition-colors hover:bg-[var(--orycms-color-primary)] hover:text-white"
        >
          OK
        </button>
      </div>
    </div>
  )
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-xl border border-border bg-surface p-5 shadow-xs", className)}>{children}</div>
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-muted text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[13.5px] font-semibold">{title}</div>
        <div className="mt-0.5 text-[11.5px] text-muted-foreground">{description}</div>
      </div>
    </div>
  )
}
