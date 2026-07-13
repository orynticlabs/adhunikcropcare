import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { cmsCollections, getCollectionDefinition } from "./collections"
import type { CmsCollectionSlug, CmsItem, CmsSettings, HeaderMenuItem, HeaderMenuView } from "./types"

type CmsData = {
  settings: CmsSettings
  collections: Record<CmsCollectionSlug, CmsItem[]>
  headerMenu: HeaderMenuItem[]
}

const dataPath = path.join(process.cwd(), "data", "cms.json")
let writeLock = Promise.resolve()
const HEADER_MENU_HOME_ID = "home"
const HEADER_MENU_MORE_LABEL = "More"
const HEADER_MENU_MAX_TOP_LEVEL_ITEMS = 6
const HEADER_MENU_MAX_DIRECT_LINKS = HEADER_MENU_MAX_TOP_LEVEL_ITEMS - 1

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

function defaultHeaderMenu(): HeaderMenuItem[] {
  const createdAt = nowIso()

  return [
    {
      id: HEADER_MENU_HOME_ID,
      label: "Home",
      href: "#home",
      enabled: true,
      position: 0,
      system: true,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: randomUUID(),
      label: "Products",
      href: "/products",
      enabled: true,
      position: 1,
      system: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: randomUUID(),
      label: "Crop Fertilizers",
      href: "#crop-fertilizers",
      enabled: true,
      position: 2,
      system: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: randomUUID(),
      label: "Organic Range",
      href: "#organic-range",
      enabled: true,
      position: 3,
      system: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: randomUUID(),
      label: "Marketplace",
      href: "#marketplace",
      enabled: true,
      position: 4,
      system: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: randomUUID(),
      label: "Our Story",
      href: "#our-story",
      enabled: true,
      position: 5,
      system: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: randomUUID(),
      label: "Bio Products",
      href: "#bio-products",
      enabled: true,
      position: 6,
      system: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: randomUUID(),
      label: "Soil Care",
      href: "#soil-care",
      enabled: true,
      position: 7,
      system: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: randomUUID(),
      label: "Irrigation Solutions",
      href: "#irrigation-solutions",
      enabled: true,
      position: 8,
      system: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: randomUUID(),
      label: "Pest Management",
      href: "#pest-management",
      enabled: true,
      position: 9,
      system: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: randomUUID(),
      label: "Farmer Services",
      href: "#farmer-services",
      enabled: true,
      position: 10,
      system: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: randomUUID(),
      label: "Wholesale",
      href: "#wholesale",
      enabled: true,
      position: 11,
      system: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: randomUUID(),
      label: "Certifications",
      href: "#certifications",
      enabled: true,
      position: 12,
      system: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: randomUUID(),
      label: "Knowledge Center",
      href: "#knowledge-center",
      enabled: true,
      position: 13,
      system: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: randomUUID(),
      label: "Blogs",
      href: "#blogs",
      enabled: true,
      position: 14,
      system: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: randomUUID(),
      label: "Contact Us",
      href: "#contact-us",
      enabled: true,
      position: 15,
      system: false,
      createdAt,
      updatedAt: createdAt,
    },
  ]
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
    headerMenu: defaultHeaderMenu(),
  }
}

function compareMenuItems(a: HeaderMenuItem, b: HeaderMenuItem) {
  return a.position - b.position || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
}

function normalizeHeaderMenu(items: HeaderMenuItem[] | undefined) {
  const fallback = defaultHeaderMenu()
  const source = Array.isArray(items) && items.length > 0 ? items : fallback
  const homeSource = source.find((item) => item.id === HEADER_MENU_HOME_ID) ?? fallback[0]
  const homeItem: HeaderMenuItem = {
    ...homeSource,
    id: HEADER_MENU_HOME_ID,
    label: "Home",
    href: "#home",
    enabled: true,
    position: 0,
    system: true,
  }

  const otherItems = source
    .filter((item) => item.id !== HEADER_MENU_HOME_ID)
    .map((item) => ({
      ...item,
      system: false,
    }))
    .sort(compareMenuItems)
    .map((item, index) => ({
      ...item,
      position: index + 1,
    }))

  return [homeItem, ...otherItems]
}

function buildHeaderMenuView(items: HeaderMenuItem[]): HeaderMenuView {
  const enabledItems = normalizeHeaderMenu(items).filter((item) => item.enabled)

  return {
    visibleItems: enabledItems.slice(0, HEADER_MENU_MAX_DIRECT_LINKS),
    moreItems: enabledItems.slice(HEADER_MENU_MAX_DIRECT_LINKS),
    hasMore: enabledItems.length > HEADER_MENU_MAX_DIRECT_LINKS,
    maxTopLevelItems: HEADER_MENU_MAX_TOP_LEVEL_ITEMS,
    maxDirectLinks: HEADER_MENU_MAX_DIRECT_LINKS,
    reservedMoreSlot: true,
  }
}

async function readCmsFile(): Promise<CmsData> {
  const raw = await readFile(dataPath, "utf8")
  const parsed = JSON.parse(raw) as Partial<CmsData>

  return {
    settings: parsed.settings ?? defaultSettings(),
    collections: parsed.collections as Record<CmsCollectionSlug, CmsItem[]>,
    headerMenu: normalizeHeaderMenu(parsed.headerMenu),
  }
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
  const data = await ensureDataFile()
  return {
    ...data,
    headerMenu: normalizeHeaderMenu(data.headerMenu),
  }
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

type HeaderMenuInput = {
  label: string
  href: string
  enabled?: boolean
}

type HeaderMenuUpdate = {
  label?: string
  href?: string
  enabled?: boolean
}

function normalizeMenuText(value: string | undefined) {
  return value?.trim() ?? ""
}

function assertHeaderMenuPayload(input: HeaderMenuInput | HeaderMenuUpdate, mode: "create" | "update") {
  if (mode === "create" || input.label !== undefined) {
    const label = normalizeMenuText(input.label)
    if (!label) {
      throw new Error("Menu label is required.")
    }
    if (label.toLowerCase() === HEADER_MENU_MORE_LABEL.toLowerCase()) {
      throw new Error("The More label is reserved for the dropdown trigger.")
    }
  }

  if (mode === "create" || input.href !== undefined) {
    const href = normalizeMenuText(input.href)
    if (!href) {
      throw new Error("Menu link is required.")
    }
  }
}

export async function listHeaderMenuItems() {
  const data = await ensureDataFile()
  return normalizeHeaderMenu(data.headerMenu)
}

export async function getHeaderMenuView() {
  const items = await listHeaderMenuItems()
  return buildHeaderMenuView(items)
}

export async function createHeaderMenuItem(input: HeaderMenuInput) {
  assertHeaderMenuPayload(input, "create")

  return withWriteLock(async () => {
    const data = await ensureDataFile()
    const items = normalizeHeaderMenu(data.headerMenu)
    const timestamp = nowIso()
    const item: HeaderMenuItem = {
      id: randomUUID(),
      label: normalizeMenuText(input.label),
      href: normalizeMenuText(input.href),
      enabled: input.enabled ?? true,
      position: items.length,
      system: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    data.headerMenu = normalizeHeaderMenu([...items, item])
    await writeCmsFile(data)

    return item
  })
}

export async function updateHeaderMenuItem(id: string, input: HeaderMenuUpdate) {
  if (!id) {
    throw new Error("Menu item id is required.")
  }

  assertHeaderMenuPayload(input, "update")

  return withWriteLock(async () => {
    const data = await ensureDataFile()
    const items = normalizeHeaderMenu(data.headerMenu)
    const existing = items.find((item) => item.id === id)

    if (!existing) {
      throw new Error("Menu item not found.")
    }

    if (existing.system) {
      throw new Error("The Home menu item cannot be modified.")
    }

    const updatedItem: HeaderMenuItem = {
      ...existing,
      label: input.label !== undefined ? normalizeMenuText(input.label) : existing.label,
      href: input.href !== undefined ? normalizeMenuText(input.href) : existing.href,
      enabled: input.enabled ?? existing.enabled,
      updatedAt: nowIso(),
    }

    data.headerMenu = normalizeHeaderMenu(
      items.map((item) => (item.id === id ? updatedItem : item)),
    )
    await writeCmsFile(data)

    return updatedItem
  })
}

export async function reorderHeaderMenuItems(itemIds: string[]) {
  return withWriteLock(async () => {
    const data = await ensureDataFile()
    const items = normalizeHeaderMenu(data.headerMenu)
    const homeItem = items.find((item) => item.id === HEADER_MENU_HOME_ID)

    if (!homeItem) {
      throw new Error("Home menu item is missing.")
    }

    const reorderableItems = items.filter((item) => !item.system)
    const providedIds = itemIds.filter((id) => id !== HEADER_MENU_HOME_ID)
    const uniqueIds = new Set(providedIds)

    if (uniqueIds.size !== providedIds.length) {
      throw new Error("Menu order contains duplicate ids.")
    }

    if (providedIds.length !== reorderableItems.length) {
      throw new Error("Menu order must include every non-system menu item exactly once.")
    }

    const itemMap = new Map(reorderableItems.map((item) => [item.id, item]))
    const reorderedItems = providedIds.map((id, index) => {
      const item = itemMap.get(id)
      if (!item) {
        throw new Error(`Unknown menu item id: ${id}`)
      }

      return {
        ...item,
        position: index + 1,
        updatedAt: nowIso(),
      }
    })

    data.headerMenu = normalizeHeaderMenu([homeItem, ...reorderedItems])
    await writeCmsFile(data)

    return data.headerMenu
  })
}
