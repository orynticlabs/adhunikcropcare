export const PRODUCT_STATUSES = ["draft", "published"] as const

export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export type ProductImageInput = {
  id?: string
  url: string
  name?: string
  packSizes?: string[]
}

export type PackSizeInput = {
  size: string
  price: number
  imageId?: string
  imageUrl?: string
  imageIds?: string[]
  imageUrls?: string[]
}

export type OryCMSProductInput = {
  brand?: string
  category: string
  featured: boolean
  fullDescription?: string
  howToUse?: string
  images: ProductImageInput[]
  metaDescription?: string
  metaTitle?: string
  name: string
  packSizes: PackSizeInput[]
  packSizeImagesEnabled?: boolean
  price: number
  salePrice?: number | null
  shippingReturns?: string
  shortDescription: string
  sku: string
  slug?: string
  specifications?: string
  status: ProductStatus
  stockQuantity: number
  tags: string[]
  unit: string
}

export type OryCMSProductDTO = OryCMSProductInput & {
  createdAt: string
  deletedAt?: string | null
  id: string
  slug: string
  updatedAt: string
}

export const fallbackProductImage =
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80"

export function productPrimaryImage(product: Pick<OryCMSProductDTO, "images">) {
  return product.images[0]?.url || fallbackProductImage
}

export function ensureProductImages(product: OryCMSProductDTO) {
  const image = productPrimaryImage(product)
  return product.images.length ? product.images : [{ name: product.name, url: image }]
}
