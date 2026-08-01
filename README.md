# Adhunik Crop Care — E-Commerce Platform & OryCMS (v1.0.0)

[![Release](https://img.shields.io/badge/Release-v1.0.0-green.svg)](https://github.com/orynticlabs/adhunikcropcare/releases/tag/v1.0.0)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748.svg?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql)](https://www.postgresql.org/)

Official web platform for **Adhunik Crop Care Private Limited**, empowering Indian agriculture with trusted crop protection solutions (Insecticides, Fungicides, Herbicides, Bio-Pesticides, Bio-Fertilizers, Soil Care) and modern agricultural inputs. 

The application is built on a full-stack Next.js architecture featuring a customer-facing e-commerce **Storefront** and a dedicated administrator management portal (**OryCMS**).

---

## 🌟 Key Features & Capabilities

### 🛍️ Customer Storefront Experience
- **Interactive Homepage & Hero Section**: Feature product highlights, top announcement bar, dynamic hero slider, and category navigation.
- **Real-Time Search Modal**: Instant auto-suggest modal searching products and categories (`/api/products`).
- **URL-Synced Category Navigation**: Seamless category filtering (`/products?category=...`) with instant client-side updates and zero full-page reloads.
- **Dynamic Pack Sizes & Pack-Specific Images**: Constrained pack unit options (Kg, g, ml, L, Box, Bottle) with support for pack-size-specific images. On the storefront, switching pack sizes dynamically updates the primary display image and filters gallery thumbnails with zero flicker.
- **Rich Product Detail Pages**: High-resolution image zoom gallery, live stock availability status, dynamic specifications / usage accordions, verified customer reviews, and coupon badges.
- **Storefront Certificates & Interactive Document Viewer**: Brand-aligned certificate gallery (`/certifications`) with real-time authority filters, glassmorphic cards, "Lifetime Validity" badges for non-expiring credentials, and a full-screen modal inline PDF/Image viewer with direct download support.
- **Cart & Checkout Drawer**: Slide-out cart drawer with real-time quantity updates, address selection, pincode serviceability estimation, and instant checkout.
- **Interactive Discount & Coupon Engine**: 1-click coupon modal selector, single-run auto-apply rule evaluation engine, and manual promo code entry validation.
- **High-Conversion OTP Auth Workflow**: 6-digit email OTP verification for fast, secure customer authentication and account management.

### 💳 Logistics, Payments & Invoicing
- **Razorpay Payment Gateway**: Online checkout processing with automated webhook payment status verification.
- **Shiprocket Logistics Integration**: Automated order dispatch creation, courier rate calculation, pincode serviceability checks, and webhook shipment tracking updates.
- **Pixel-Perfect A4 PDF Invoice Engine**: Downloadable PDF invoices with corporate headers, itemized GST tax breakdowns, buyer/seller billing cards, and aligned total summaries.

### 🛠️ OryCMS Administrator Portal (`/admin`)
- **Strict Boundary Security**: Isolated administrator authentication and session handling (`/api/orycms/*`).
- **Product & Inventory Management**: Rich text product editor, Cloudinary image gallery with auto-cropping, unit restriction dropdowns, and positive stock quantity enforcement (`> 0`).
- **Pack-Size-Specific Images & Custom OryCMSMultiSelect**: Admin toggle for pack-size-specific images with `OryCMSMultiSelect` popover dropdowns allowing multiple image attachments per pack size row.
- **Certificates Management & Lifetime Expiry Prompt**: Admin certificate manager with explicit prompt guiding admins to leave expiry date blank for permanent/non-expiring credentials.
- **Price Match Safeguards**: Built-in validation requiring at least one pack size price to equal the product Sale Price or MRP before saving.
- **Orders, Coupons & Announcements**: Admin controls for managing customer orders, creating conditional discount coupons, editing announcement bars, and managing user enquiries.

---

## 🏗️ System Architecture & Boundaries

The codebase strictly enforces application boundaries:

| Boundary | Scope | Data Schema | API Route Prefix |
| :--- | :--- | :--- | :--- |
| **Storefront** | Customer signup, OTP verification, login, profile, cart, checkout, payments, orders | `storefront_*` | `/api/auth/*`, `/api/storefront/*` |
| **OryCMS Admin** | Administrator login, catalog management, inventory, orders, media, coupons | `orycms_*` | `/api/orycms/*` |

- Storefront customer sessions and OryCMS administrator sessions are completely decoupled.
- Storefront email addresses require OTP verification before accessing authenticated features.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, Server Components & Client Hooks)
- **Language**: TypeScript (Strict Mode)
- **Database & ORM**: PostgreSQL & Prisma ORM
- **Styling**: Vanilla CSS & Tailwind CSS with custom Design Tokens & Storefront Button Standards (see `AGENTS.md`)
- **Icons**: Lucide React
- **Media Hosting**: Cloudinary API & Asset Management
- **Payment Processing**: Razorpay API & Webhooks
- **Logistics**: Shiprocket API & Webhooks
- **PDF Generation**: Native PDFKit / PDF-Lib Engine

---

## 📂 Project Structure

```text
.
├── src/
│   ├── app/                         # Next.js App Router pages & API routes
│   │   ├── (storefront)/            # Storefront routes (home, products, cart, checkout, account)
│   │   ├── admin/                   # OryCMS Administrator Portal routes
│   │   └── api/                     # REST API handlers (auth, storefront, orycms, webhooks)
│   ├── components/                  # UI components
│   │   ├── auth/                    # Auth modals & OTP forms
│   │   ├── home/                    # Homepage hero, showcases, & announcements
│   │   ├── layout/                  # Sticky header, footer, & announcement bar
│   │   ├── orycms/                  # OryCMS admin dashboard components
│   │   └── search/                  # Search modal & suggestions
│   ├── features/                    # Feature domain modules
│   │   ├── auth/                    # Auth context & session hooks
│   │   ├── cart/                    # Cart drawer, size button, & context
│   │   └── products/                # Product detail view & review forms
│   └── lib/                         # Utilities & service integration clients
│       ├── orycms/                  # OryCMS database & product utilities
│       ├── storefront-orders.ts     # Order processing & PDF invoice builder
│       └── razorpay.ts              # Razorpay API client
├── public/                          # Static images & branding assets
├── prisma/                          # Database schema & migrations
├── next.config.ts                   # Next.js framework configuration
└── package.json                     # Dependency manifests & scripts
```

---

## ⚙️ Environment Configuration

Do NOT read or edit `.env.local` directly. Create `.env.local` based on `.env.example` with the following variables:

```env
# Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/adhunikcropcare?schema=public"

# App Base URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Razorpay Payments
RAZORPAY_KEY_ID="rzp_live_xxx"
RAZORPAY_KEY_SECRET="your_key_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# Shiprocket Logistics
SHIPROCKET_EMAIL="your_shiprocket_email"
SHIPROCKET_PASSWORD="your_shiprocket_password"

# Resend / Email OTP Service
RESEND_API_KEY="re_xxx"
SENDER_EMAIL="noreply@adhunikcropcare.com"
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20.x, v22.x, or v24.x (see `.nvmrc`)
- **Package Manager**: `npm`
- **Database**: PostgreSQL instance

### Local Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/orynticlabs/adhunikcropcare.git
   cd adhunikcropcare
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database and API keys
   ```

4. **Initialize Database & Run Migrations**:
   ```bash
   npx prisma migrate dev
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Build & Lint Commands

```bash
# Start development server
npm run dev

# Run TypeScript type check
npx tsc --noEmit

# Run Linter
npm run lint

# Build production bundle
npm run build

# Start production server
npm run start
```

---

## 👤 Author Attribution & Versioning

- **Project Release**: `v1.0.0` (General Availability Production Release)
- **Active Development Milestone**: `v1.1.0`
- **Organization**: Adhunik Crop Care Private Limited
- **Development Partner**: [OrynticLabs Private Limited](https://orynticlabs.com)

---

## 📄 License

Copyright © 2026 **Adhunik Crop Care Private Limited**. All rights reserved.
