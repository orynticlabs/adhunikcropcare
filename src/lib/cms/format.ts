import type { CmsCollectionSlug, CmsItem } from "./types"

export function getCollectionDisplayValue(item: CmsItem, collectionSlug: CmsCollectionSlug) {
  switch (collectionSlug) {
    case "products":
      return String(item.name ?? item.title ?? item.slug)
    case "pages":
    case "articles":
    case "categories":
    case "media":
      return String(item.title ?? item.name ?? item.slug)
    default:
      return item.id
  }
}

