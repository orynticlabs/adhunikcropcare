"use client"

import { useState } from "react"
import { Sprout } from "lucide-react"

type Season = "Kharif" | "Rabi" | "Zaid"

const SEASONS: Season[] = ["Kharif", "Rabi", "Zaid"]

const CROPS: Record<Season, { name: string; week: number }[]> = {
  Kharif: [
    { name: "Rice", week: 1 },
    { name: "Maize", week: 2 },
    { name: "Cotton", week: 3 },
    { name: "Soybean", week: 4 },
    { name: "Pulses", week: 5 },
  ],
  Rabi: [
    { name: "Wheat", week: 1 },
    { name: "Barley", week: 2 },
    { name: "Mustard", week: 2 },
    { name: "Chickpea", week: 3 },
    { name: "Lentil", week: 4 },
  ],
  Zaid: [
    { name: "Watermelon", week: 1 },
    { name: "Cucumber", week: 1 },
    { name: "Bitter Gourd", week: 2 },
    { name: "Muskmelon", week: 2 },
    { name: "Fodder", week: 3 },
  ],
}

export default function KnowledgeTabs() {
  const [active, setActive] = useState<Season>("Kharif")

  return (
    <div className="mt-7">
      {/* Tab bar */}
      <div className="mx-auto grid w-full max-w-md grid-cols-3 rounded-full bg-background/70 p-1.5 h-12">
        {SEASONS.map((s) => (
          <button
            key={s}
            onClick={() => setActive(s)}
            className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium transition-all cursor-pointer ${
              active === s
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Crop cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {CROPS[active].map((crop) => (
          <div
            key={crop.name}
            className="border border-border/40 rounded-2xl bg-card/80 p-6 text-center shadow-soft hover:shadow-luxe hover:-translate-y-1 transition-all"
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[--leaf]/30 to-[--gold]/20">
              <Sprout className="h-7 w-7 text-[--moss]" aria-hidden />
            </div>
            <h4 className="mt-4 font-display text-xl">{crop.name}</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Best sowing: week {crop.week}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
