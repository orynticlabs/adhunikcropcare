import type { CmsCollectionSlug, CmsField } from "./types"

export type CmsCollectionDefinition = {
  slug: CmsCollectionSlug
  label: string
  description: string
  fields: CmsField[]
}

export const cmsCollections: CmsCollectionDefinition[] = [
  {
    slug: "pages",
    label: "Pages",
    description: "Manage reusable static pages that power the public site.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, placeholder: "Home" },
      { name: "slug", label: "Slug", type: "text", required: true, placeholder: "home" },
      { name: "summary", label: "Summary", type: "textarea", rows: 3, placeholder: "Short page summary" },
      { name: "body", label: "Body", type: "textarea", rows: 10, placeholder: "Page content" },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { label: "Draft", value: "draft" },
          { label: "Published", value: "published" },
        ],
      },
      { name: "featured", label: "Featured", type: "toggle" },
    ],
  },
  {
    slug: "articles",
    label: "Articles",
    description: "Publish guides, updates, and educational content.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, placeholder: "Irrigation tips for summer" },
      { name: "slug", label: "Slug", type: "text", required: true, placeholder: "irrigation-tips" },
      { name: "category", label: "Category", type: "text", placeholder: "Water management" },
      { name: "summary", label: "Summary", type: "textarea", rows: 3, placeholder: "Brief article summary" },
      { name: "body", label: "Body", type: "textarea", rows: 12, placeholder: "Article body" },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { label: "Draft", value: "draft" },
          { label: "Published", value: "published" },
        ],
      },
      { name: "featured", label: "Featured", type: "toggle" },
    ],
  },
  {
    slug: "products",
    label: "Products",
    description: "Edit the product catalog used by the storefront.",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "Adhunik Bio NPK" },
      { name: "slug", label: "Slug", type: "text", required: true, placeholder: "adhunik-bio-npk" },
      { name: "category", label: "Category", type: "text", placeholder: "Fertilizers" },
      { name: "price", label: "Price", type: "number", required: true, placeholder: "1249" },
      { name: "shortDescription", label: "Short description", type: "textarea", rows: 3, placeholder: "One-line benefit statement" },
      { name: "status", label: "Status", type: "select", required: true, options: [{ label: "Active", value: "active" }, { label: "Archived", value: "archived" }] },
      { name: "featured", label: "Featured", type: "toggle" },
    ],
  },
  {
    slug: "categories",
    label: "Categories",
    description: "Organize the storefront navigation and CMS filters.",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "Organic Range" },
      { name: "slug", label: "Slug", type: "text", required: true, placeholder: "organic-range" },
      { name: "description", label: "Description", type: "textarea", rows: 3, placeholder: "Category description" },
      { name: "sortOrder", label: "Sort order", type: "number", placeholder: "10" },
      { name: "featured", label: "Featured", type: "toggle" },
    ],
  },
  {
    slug: "media",
    label: "Media",
    description: "Track reusable assets and image metadata.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, placeholder: "Hero field image" },
      { name: "alt", label: "Alt text", type: "text", required: true, placeholder: "Farm field at sunrise" },
      { name: "url", label: "URL", type: "text", required: true, placeholder: "/hero-field.jpg" },
      {
        name: "kind",
        label: "Kind",
        type: "select",
        required: true,
        options: [
          { label: "Image", value: "image" },
          { label: "Video", value: "video" },
          { label: "Document", value: "document" },
        ],
      },
      { name: "featured", label: "Featured", type: "toggle" },
    ],
  },
]

export function getCollectionDefinition(slug: string): CmsCollectionDefinition | undefined {
  return cmsCollections.find((collection) => collection.slug === slug)
}

export function isCmsCollectionSlug(slug: string): slug is CmsCollectionSlug {
  return Boolean(getCollectionDefinition(slug))
}

