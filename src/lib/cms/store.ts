import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { cmsCollections, getCollectionDefinition } from "./collections"
import type { CmsCollectionSlug, CmsItem, CmsSettings } from "./types"

type CmsData = {
  settings: CmsSettings
  collections: Record<CmsCollectionSlug, CmsItem[]>
}

const dataPath = path.join(process.cwd(), "data", "cms.json")
let writeLock = Promise.resolve()

function nowIso() {
  return new Date().toISOString()
}

function seedRecords(slug: CmsCollectionSlug): CmsItem[] {
  const defaults: Record<CmsCollectionSlug, Array<Record<string, string | number | boolean>>> = {
    pages: [
      {
        title: "Home",
        slug: "home",
        summary: "Homepage copy and hero content.",
        body: "Featured products, categories, and educational content.",
        status: "published",
        featured: true,
      },
      {
        title: "About",
        slug: "about",
        summary: "Brand story and farmer-first values.",
        body: "A single-project CMS with a clear editorial workflow.",
        status: "published",
        featured: false,
      },
    ],
    articles: [
      {
        title: "How to plan seasonal irrigation",
        slug: "seasonal-irrigation",
        category: "Water management",
        summary: "Use crop stage and soil data to avoid overwatering.",
        body: "Guidance for planning irrigation without wasting water.",
        status: "published",
        featured: true,
      },
    ],
    products: [
      {
        name: "Adhunik Bio NPK",
        slug: "adhunik-bio-npk",
        category: "Fertilizers",
        price: 1249,
        shortDescription: "High performance organic nutrient booster.",
        status: "active",
        featured: true,
      },
      {
        name: "NeemGuard Spray",
        slug: "neemguard-spray",
        category: "Bio Products",
        price: 449,
        shortDescription: "Natural pest control spray for integrated management.",
        status: "active",
        featured: false,
      },
    ],
    categories: [
      {
        name: "Fertilizers",
        slug: "fertilizers",
        description: "Conventional and organic nutrient products.",
        sortOrder: 1,
        featured: true,
      },
      {
        name: "Organic Range",
        slug: "organic-range",
        description: "Compost, bio stimulants, and sustainable inputs.",
        sortOrder: 2,
        featured: true,
      },
    ],
    media: [
      {
        title: "Hero field image",
        alt: "Green agricultural field at sunrise",
        url: "/hero-field-Dp98Y55X.jpg",
        kind: "image",
        featured: true,
      },
      {
        title: "Brand logo",
        alt: "Adhunik Crop Care logo",
        url: "/adhunikwhite.png",
        kind: "image",
        featured: true,
      },
    ],
  }

  const entries = defaults[slug]
  return entries.map((entry) => ({
    id: randomUUID(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...entry,
  }))
}

function defaultSettings(): CmsSettings {
  return {
    siteName: "Adhunik Crop Care",
    supportEmail: "support@adhunikcropcare.com",
    supportPhone: "+91 00000 00000",
    announcement: "Seasonal soil kits are available this week.",
    maintenanceMode: false,
    primaryAccent: "#033927",
    updatedAt: nowIso(),
  }
}

function defaultData(): CmsData {
  return {
    settings: defaultSettings(),
    collections: {
      articles: seedRecords("articles"),
      categories: seedRecords("categories"),
      media: seedRecords("media"),
      pages: seedRecords("pages"),
      products: seedRecords("products"),
    },
  }
}

async function readCmsFile(): Promise<CmsData> {
  const raw = await readFile(dataPath, "utf8")
  return JSON.parse(raw) as CmsData
}

async function writeCmsFile(data: CmsData) {
  await mkdir(path.dirname(dataPath), { recursive: true })
  const tempPath = `${dataPath}.tmp`
  await writeFile(tempPath, JSON.stringify(data, null, 2), "utf8")
  await rename(tempPath, dataPath)
}

async function ensureDataFile() {
  try {
    return await readCmsFile()
  } catch {
    const data = defaultData()
    await writeCmsFile(data)
    return data
  }
}

async function withWriteLock<T>(task: () => Promise<T>) {
  const run = writeLock.then(task, task)
  writeLock = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function normalizeTextValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return ""
  }
  return value.trim()
}

function normalizeNumberValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return 0
  }
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function normalizeToggleValue(value: FormDataEntryValue | null) {
  return value === "on" || value === "true"
}

function parseFormData(slug: CmsCollectionSlug, formData: FormData) {
  const definition = getCollectionDefinition(slug)
  if (!definition) {
    throw new Error(`Unknown collection: ${slug}`)
  }

  const payload: Record<string, string | number | boolean> = {}
  const errors: string[] = []

  for (const field of definition.fields) {
    const rawValue = formData.get(field.name)
    let value: string | number | boolean

    switch (field.type) {
      case "number":
        value = normalizeNumberValue(rawValue)
        break
      case "toggle":
        value = normalizeToggleValue(rawValue)
        break
      case "select":
      case "text":
      case "textarea":
        value = normalizeTextValue(rawValue)
        break
      default:
        value = normalizeTextValue(rawValue)
    }

    if (field.required && (value === "" || value === 0)) {
      errors.push(`${field.label} is required.`)
    }

    payload[field.name] = value
  }

  if (errors.length > 0) {
    throw new Error(errors[0] ?? "Invalid form data.")
  }

  return payload
}

export async function getCmsData() {
  return ensureDataFile()
}

export async function listCmsCollection(slug: CmsCollectionSlug) {
  const data = await ensureDataFile()
  return data.collections[slug] ?? []
}

export async function getCmsCollectionItem(slug: CmsCollectionSlug, id: string) {
  const items = await listCmsCollection(slug)
  return items.find((item) => item.id === id) ?? null
}

export async function upsertCmsCollectionItem(slug: CmsCollectionSlug, formData: FormData) {
  const definition = getCollectionDefinition(slug)
  if (!definition) {
    throw new Error(`Unknown collection: ${slug}`)
  }

  const id = normalizeTextValue(formData.get("id"))
  const values = parseFormData(slug, formData)

  return withWriteLock(async () => {
    const data = await ensureDataFile()
    const nextItem = {
      id: id || randomUUID(),
      createdAt: id ? data.collections[slug].find((item) => item.id === id)?.createdAt ?? nowIso() : nowIso(),
      updatedAt: nowIso(),
      ...values,
    }

    const items = data.collections[slug] ?? []
    const existingIndex = id ? items.findIndex((item) => item.id === id) : -1

    if (existingIndex >= 0) {
      items[existingIndex] = nextItem
    } else {
      items.unshift(nextItem)
    }

    data.collections[slug] = items
    await writeCmsFile(data)
    return nextItem
  })
}

export async function deleteCmsCollectionItem(slug: CmsCollectionSlug, id: string) {
  return withWriteLock(async () => {
    const data = await ensureDataFile()
    data.collections[slug] = (data.collections[slug] ?? []).filter((item) => item.id !== id)
    await writeCmsFile(data)
  })
}

export async function updateCmsSettings(formData: FormData) {
  return withWriteLock(async () => {
    const data = await ensureDataFile()
    data.settings = {
      siteName: normalizeTextValue(formData.get("siteName")) || data.settings.siteName,
      supportEmail: normalizeTextValue(formData.get("supportEmail")) || data.settings.supportEmail,
      supportPhone: normalizeTextValue(formData.get("supportPhone")) || data.settings.supportPhone,
      announcement: normalizeTextValue(formData.get("announcement")) || data.settings.announcement,
      primaryAccent: normalizeTextValue(formData.get("primaryAccent")) || data.settings.primaryAccent,
      maintenanceMode: normalizeToggleValue(formData.get("maintenanceMode")),
      updatedAt: nowIso(),
    }
    await writeCmsFile(data)
    return data.settings
  })
}

export function getCmsCollectionDefinition(slug: CmsCollectionSlug) {
  return cmsCollections.find((collection) => collection.slug === slug) ?? null
}

