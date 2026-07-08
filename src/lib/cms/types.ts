export type CmsCollectionSlug =
  | "articles"
  | "categories"
  | "media"
  | "pages"
  | "products"

export type CmsFieldType = "text" | "textarea" | "number" | "select" | "toggle"

export type CmsFieldOption = {
  label: string
  value: string
}

export type CmsField = {
  name: string
  label: string
  type: CmsFieldType
  required?: boolean
  placeholder?: string
  helpText?: string
  rows?: number
  options?: CmsFieldOption[]
}

export type CmsRecord = {
  id: string
  createdAt: string
  updatedAt: string
}

export type CmsItem = CmsRecord & Record<string, string | number | boolean>

export type CmsSettings = {
  siteName: string
  supportEmail: string
  supportPhone: string
  announcement: string
  maintenanceMode: boolean
  primaryAccent: string
  updatedAt: string
}

export type AdminSession = {
  email: string
  issuedAt: number
  expiresAt: number
}

