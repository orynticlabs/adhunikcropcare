# Adhunik Crop Care — Project Reference & System Specification

> **Version Baseline**: `v1.0.0`  
> **Current Active Version**: `1.1.0` (`v1.1.0` Milestone)  
> **Lead Developer & Maintainer**: **Puneet Yadav** ([@puneetyadav09](https://github.com/puneetyadav09))  
> **Organization**: Adhunik Crop Care Private Limited / OrynticLabs Private Limited  

---

## 1. Application Boundaries & Security Architecture

### Storefront / Customer Domain
- **Authentication**: Customer signup via email with 6-digit OTP verification (powered by Resend API).
- **Session & Data Models**: Uses `storefront_*` tables in Prisma schema and `/api/auth/*` / `/api/storefront/*` endpoints.
- **Immutability**: Storefront customer email addresses are immutable after OTP verification.
- **Customer Portal**: Account profile management, address book, wishlist, cart drawer, and order history.

### OryCMS Administrator Domain (`/admin`)
- **Authentication**: Isolated administrator authentication boundary (`/api/orycms/*`).
- **Catalog & Inventory Management**: Product creation, rich text descriptions, Cloudinary image uploads with auto-cropping, stock quantity validation (`stockQuantity > 0`), unit constraints, and price match safeguards.
- **Order & Operations Management**: Order status tracking, coupon creation, announcement bar configuration, and user enquiry handling.

---

## 2. Completed Features & Business Rules

### 🛍️ Storefront E-Commerce
1. **Dynamic Navigation & Category Filter Sync**:
   - Header & Footer category links point to `/products?category=CategoryName`.
   - Uses Next.js `<Link>` components for smooth client-side single-page navigation without full page reloads.
   - Product page `activeCategory` state automatically synchronizes with the `category` URL query parameter.
   - Clicking category filter pills dynamically updates the address bar via `router.push('/products?category=...', { scroll: false })`.
2. **Real-Time Search**:
   - Modal search bar with real-time auto-suggestions for products and categories (`/api/products`).
   - Horizontally centered modal on mobile (`left-1/2 -translate-x-1/2`) aligned flush below the navbar pill without vertical gaps or screen cutoff.
3. **Unit-Constrained Pack Sizes & Default Option Matching**:
   - Pack size units are strictly mapped to the primary product unit:
     - `Kg` -> `Kg`
     - `Gram` -> `Gram`, `Kg`
     - `ml` -> `ml`, `L`
     - `L` -> `L`
     - `Box` -> `Box`
     - `Bottle` -> `Bottle`
   - Numeric pack size values and unit dropdowns are combined automatically when saving in OryCMS.
   - Storefront automatically pre-selects the default pack size matching the product's Sale Price (or MRP if Sale Price is absent).
4. **Pack-Size-Specific Images & Dynamic Storefront Gallery**:
   - Optional admin toggle "Enable pack-size-specific images (optional)" in OryCMS product manager.
   - Built-in validation enforcing that at least one pack size matches the product's base price (Sale Price or MRP).
   - Custom `OryCMSMultiSelect` popover UI allowing multiple images to be associated per pack size row with image previews and checkboxes.
   - Flexible image tagging rules: single pack size, multiple pack sizes, or blank/untagged for default images shown across all pack sizes.
   - Storefront product detail page (`/products/[slug]`) dynamically updates the main displayed image and filters thumbnail gallery options on pack size selection with built-in image preloading.
5. **Storefront Certificates Gallery, Modal Viewer & Lifetime Expiry Option**:
   - Integrated client-side `CertificationsGallery` component on `/certifications`.
   - Real-time search by certificate title, authority, number, or description + authority filter pills.
   - Lifetime Validity badge (`#689c30`) displayed on cards and verification dossiers when expiry date is left blank.
   - Interactive Modal Document Viewer supporting inline PDF viewer (iframe) and high-res image zoom with complete verification metadata side panel.
   - Direct download support with proper Content-Disposition/filename formatting.
   - OryCMS Admin Certificate form updated with explicit prompt: `"Leave blank if this certificate does not expire (Lifetime / Permanent validity)"` and a 1-click "Clear / Lifetime" quick action.
6. **Clean Product Details & Coupons**:
   - Offers/Coupons section renders ONLY when valid coupons are available; omitted completely if empty.
   - Product accordions (Specifications, How to Use, Shipping & Returns) omit dummy content and render only when populated by admin.

### 💳 Logistics, Payments & Invoicing
1. **Razorpay Payments**: Native online payment processing and automated webhook status verification.
2. **Shiprocket Logistics**: Automatic order shipment creation, courier rate calculation, pincode serviceability checks, and tracking webhooks.
3. **PDF Invoice Engine**: Pixel-perfect A4 PDF invoice generator featuring two-column corporate headers, itemized GST breakdowns, buyer/seller billing cards, and aligned summaries.

---

## 3. Tech Stack & Design Standards Reference

- **Core**: Next.js 15 (App Router), React 19, TypeScript
- **Database & ORM**: PostgreSQL & Prisma ORM with strict migration tracking (`AGENTS.md`)
- **Styling**: Tailwind CSS, Lucide Icons, and Storefront Button Color Standards (`AGENTS.md`)
- **Integrations**: Cloudinary (Media), Razorpay (Payments), Shiprocket (Logistics), Resend (Email OTP)
