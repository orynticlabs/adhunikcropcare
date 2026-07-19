export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/** Match every typed keyword, regardless of its order in the searchable text. */
export function matchesSearchQuery(query: string, values: Array<string | undefined>) {
  const keywords = normalizeSearchText(query).split(/\s+/).filter(Boolean)
  if (keywords.length === 0) return true

  const searchableText = normalizeSearchText(values.filter(Boolean).join(" "))
  return keywords.every((keyword) => searchableText.includes(keyword))
}
