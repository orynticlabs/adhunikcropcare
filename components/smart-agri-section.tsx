"use client"

import { useState } from "react"
import { ArrowRight, Sparkles } from "lucide-react"

const CROPS = ["Wheat", "Rice", "Cotton", "Tomato", "Maize"]

const METRICS: Record<string, { moisture: number; nutrient: number; pest: number; yield: number }> = {
  Wheat:  { moisture: 78, nutrient: 82, pest: 18, yield: 88 },
  Rice:   { moisture: 92, nutrient: 74, pest: 22, yield: 81 },
  Cotton: { moisture: 64, nutrient: 69, pest: 35, yield: 76 },
  Tomato: { moisture: 85, nutrient: 91, pest: 12, yield: 93 },
  Maize:  { moisture: 71, nutrient: 78, pest: 28, yield: 84 },
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mt-5">
      <div className="flex justify-between text-sm">
        <span className="text-cream/80">{label}</span>
        <span className="font-display">{value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream/15">
        <div
          className="h-full bg-gradient-to-r from-[--gold] to-cream transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default function SmartAgriSection() {
  const [crop, setCrop] = useState("Wheat")
  const m = METRICS[crop]

  return (
    <section id="smart-agriculture" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-gradient-to-br from-[--moss] via-[--moss] to-[--bark]/80 p-10 sm:p-16 text-cream shadow-luxe">
          {/* Decorative blobs */}
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-[--gold]/30 blur-3xl animate-blob pointer-events-none" />
          <div
            className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-[--leaf]/20 blur-3xl animate-blob pointer-events-none"
            style={{ animationDelay: "3s" }}
          />

          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* Left */}
            <div>
              <span className="inline-flex items-center rounded-full border border-cream/20 bg-cream/15 px-3 py-1 text-xs font-semibold text-cream">
                <Sparkles className="mr-1.5 h-3 w-3" aria-hidden /> AI Powered
              </span>
              <h2 className="mt-5 font-display text-4xl sm:text-5xl leading-tight">
                Crop Health Analyzer
              </h2>
              <p className="mt-4 text-cream/80 max-w-md">
                Snap a leaf. Get diagnosis, treatment plans, and weather-aware product recommendations — instantly.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="h-11 rounded-full bg-cream/15 border border-cream/20 px-5 text-cream backdrop-blur outline-none cursor-pointer"
                >
                  {CROPS.map((c) => (
                    <option key={c} value={c} className="text-foreground">
                      {c}
                    </option>
                  ))}
                </select>
                <button className="inline-flex items-center gap-2 rounded-full bg-[--gold] text-[--bark] px-6 h-11 text-sm font-medium hover:bg-[--gold]/90 transition shadow">
                  Analyze Now <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>

            {/* Right — analytics card */}
            <div className="rounded-3xl border border-cream/15 bg-cream/10 p-6 backdrop-blur-xl">
              <div className="text-sm text-cream/70 uppercase tracking-wider">
                {crop} field · Pune, MH
              </div>
              <Bar label="Soil moisture"  value={m.moisture} />
              <Bar label="Nutrient level" value={m.nutrient} />
              <Bar label="Pest risk"      value={m.pest} />
              <Bar label="Yield forecast" value={m.yield} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
