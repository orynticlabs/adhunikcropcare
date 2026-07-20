import Image from "next/image"

const FOOTER_COLUMNS = [
  {
    heading: "Solutions",
    links: [
      ["Crop Fertilizers", "/crop-fertilizers"],
      ["Insecticides", "/#pest-management"],
      ["Fungicides", "/#pest-management"],
      ["Weedicides", "/#pest-management"],
      ["Organic Plant Care", "/organic-range"],
    ],
  },
  {
    heading: "Company",
    links: [
      ["About Us", "/about"],
      ["Certifications", "/certifications"],
      ["Sustainability", "/certifications"],
      ["Field Journal", "/blog"],
      ["Marketplace", "/#marketplace"],
      ["Contact Us", "/contact"],
    ],
  },
  {
    heading: "Farmers",
    links: [
      ["Farmer Services", "/#farmer-services"],
      ["Knowledge Center", "/#knowledge-center"],
      ["Smart Agriculture", "/irrigation-solutions"],
      ["Soil Care", "/soil-care"],
      ["Bulk Support", "/#wholesale"],
    ],
  },
]

export default function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#043927] text-cream">
      <div className="relative mx-auto max-w-[1440px] px-6 pb-8 pt-8 lg:px-12">
        <div className="grid grid-cols-1 gap-8 py-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <Image
                src="/adhunikwhite.png"
                alt="Adhunik Crop Care"
                width={100}
                height={70}
                className="h-16 w-auto object-contain"
              />
            </div>

            <p className="mb-8 max-w-sm text-sm leading-relaxed text-cream/60">
              Adhunik Crop Care Pvt. Ltd. supports Indian agriculture with trusted
              crop protection solutions, organic plant care products, and practical
              farmer education to improve productivity and sustainable farming
              practices.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h4 className="mb-6 text-[10px] font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
                {column.heading}
              </h4>

              <ul className="space-y-3">
                {column.links.map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-sm text-cream/60 transition-colors duration-300 hover:text-[#2B8633]"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-6 border-t border-cream/10 pt-8 lg:flex-row">
          <div className="text-center text-[10px] uppercase tracking-widest text-cream/40 lg:text-left">
            <span>
              © 2026 Adhunik Crop Care Pvt. Ltd. | Developed By{" "}
              <a
                href="https://orynticlabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#e84118] transition-opacity hover:opacity-80"
              >
                OrynticLabs Private Limited
              </a>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-widest text-cream/40">
            <a href="/privacy-policy" className="transition-colors hover:text-white">
              Privacy
            </a>
            <span className="h-1 w-1 rounded-full bg-cream/20" />
            <a href="/terms-and-conditions" className="transition-colors hover:text-white">
              Terms
            </a>
            <span className="h-1 w-1 rounded-full bg-cream/20" />
            <a href="/cookie-policy" className="transition-colors hover:text-white">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
