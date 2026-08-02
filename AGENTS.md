# Application Boundaries & Development Rules

- **Storefront / Customer Side**: Customer signup, email verification (6-digit OTP), login, profile, wishlist, cart, checkout, payments, and orders. Storefront customers use `storefront_*` data models and `/api/auth/*` / `/api/storefront/*` API routes.
- **OryCMS / Admin Side**: Administrator login and management of products, categories, inventory, media, orders, coupons, announcements, and administrative settings. Administrators use OryCMS data models and `/api/orycms/*` API routes.
- Never mix storefront customer authentication with OryCMS administrator authentication or sessions.
- Storefront customers must verify their email via OTP before they can log in or access authenticated customer features.
- A storefront customer's email address is immutable until a dedicated email-change and re-verification workflow is implemented.
- Never read or edit `.env.local`. Document required environment variables in `.env.example` for the user to apply.
- **Database Schema & Migrations Rule**: Whenever there is any change in the database schema, it MUST be updated in `prisma/schema.prisma` and a corresponding migration SQL file MUST be created under `prisma/migrations/`. Do NOT run `npm run build` immediately following schema updates. Ensure existing table data is preserved carefully during schema migrations.

# Author Attribution & Contributor Memory

- All commits, pull requests, code edits, and features contributed under the GitHub organization name `@orynticlabs` or `puneet` are authored by **Puneet Yadav ([@puneetyadav09](https://github.com/puneetyadav09))**.
- Individual contributions by other members belong strictly to their respective handles.

# Milestone & Release Versioning

- Baseline Production Release: **`v1.0.0`**
- Current Active Development Version: **`1.1.0`** (Milestone: `v1.1.0`)
- Version bumps in `package.json` and code configuration files are maintained and updated as explicitly instructed by Puneet.

# Storefront Design System & Button Color Standards

To maintain visual consistency, high contrast, and brand alignment across the entire storefront website, all buttons and interactive elements must strictly adhere to the following color token specifications:

## Brand Color Tokens

- **Deep Forest Green (Primary Brand Dark)**: `#033927`
- **Vibrant Leaf Green (Primary Accent / Highlight)**: `#689c30`
- **Golden Harvest Yellow (Secondary Accent)**: `#e9c46a`
- **Soft Mint / Light Sage (Background Tint)**: `#edf3e9` / `#eff4e9`
- **Neutral Light Border**: `#d7e0da` / `border-border/70`
- **Pure White**: `#ffffff`
- **Pure Black**: `#000000`

## Button Styling Variants

| Variant Name | Purpose & Scenario | Base Background | Base Text Color | Base Border | Hover Background | Hover Text Color | Hover Icon Behavior | Tailwind Utility Classes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Solid Button** | Main Call To Action (CTAs), Submit, Checkout, Add to Cart, Primary Download | `#033927` | `text-white` (`#ffffff`) | None | `#689c30` | `text-black` (`#000000`) | Icon inherits `text-black` on hover | `bg-[#033927] text-white hover:bg-[#689c30] hover:!text-black font-semibold transition-colors shadow-xs` |
| **Secondary Accent Button** | Highlighted CTAs, Special Offers, Promos, Dynamic Badges | `#689c30` | `text-white` (`#ffffff`) | None | `#033927` | `text-white` (`#ffffff`) | Icon stays `text-white` on hover | `bg-[#689c30] text-white hover:bg-[#033927] hover:text-white font-semibold transition-colors shadow-xs` |
| **Outlined Neutral Button** | Secondary actions, Cancel, Filters, Copy Link, Preview, View Details | `bg-white` (`#ffffff`) | `#033927` | `border border-[#d7e0da]` | `#033927` | `text-white` (`#ffffff`) | Icon turns `text-white` on hover | `bg-white text-[#033927] border border-[#d7e0da] hover:bg-[#033927] hover:text-white font-semibold transition-colors shadow-xs` |
| **Soft Mint Neutral Button** | Pill filters, Light card CTAs, Subdued quick actions | `#edf3e9` | `#033927` | `border border-[#689c30]/20` | `#033927` | `text-white` (`#ffffff`) | Icon turns `text-white` on hover | `bg-[#edf3e9] text-[#033927] border border-[#689c30]/20 hover:bg-[#033927] hover:text-white font-semibold transition-colors shadow-xs` |
| **Icon Circle Button** | Close (X) buttons, Quick preview hover overlay, Modal actions | `bg-white` (`#ffffff`) | `#033927` | `border border-[#d7e0da]` | `#033927` | `text-white` (`#ffffff`) | Icon turns `text-white` on hover | `bg-white text-[#033927] border border-[#d7e0da] hover:bg-[#033927] hover:text-white transition-colors shadow-xs rounded-full` |

## Key Rules for Button Styling

1. **High Contrast Guarantee**: When a dark green button (`bg-[#033927]`) is hovered, the background changes to vibrant green (`#689c30`) and text/icons MUST switch to `text-black` to guarantee crisp readability.
2. **Smooth Transitions**: Always include `transition-colors duration-200` (or `transition-all`) on interactive buttons.
3. **Cursor Pointer**: Always include `cursor-pointer select-none` on clickable buttons and interactive pills.

# OryCMS Admin Side Design System & Button Color Standards

To maintain distinct identity between the Storefront and OryCMS Admin side:
- **Do NOT use Storefront Green (`#033927` or `#689c30`) in ANY OryCMS Admin buttons.**
- OryCMS Admin buttons use the **Charcoal Black (`bg-foreground`), Pure White, and OryCMS Orange (`#FF5A20` / `var(--orycms-orange)`)** theme palette:
  - **Primary Action Button**: `bg-foreground text-background hover:!bg-[#FF5A20] hover:!text-white font-semibold transition-colors shadow-xs cursor-pointer select-none`
  - **Secondary / Outlined Button**: `bg-white text-foreground border border-border hover:!bg-foreground hover:!text-white font-medium transition-colors shadow-xs cursor-pointer select-none`
  - **Orange Accent Action Button**: `bg-[#FF5A20] text-white hover:!bg-foreground hover:!text-white font-semibold transition-colors shadow-xs cursor-pointer select-none`
  - **Action Icon Buttons (Eye, Edit, Mail, Lock, Delete)**: Must use `!` modifier on all hover classes (e.g. `hover:!bg-foreground hover:!text-white`, `hover:!bg-[#FF5A20] hover:!text-white`, `hover:!bg-destructive hover:!text-white`) and include `cursor-pointer select-none`.
  - **Checkboxes & Badges**: Checkboxes use `accent-[#FF5A20]` or `accent-foreground`. Status badges use `bg-[#FF5A20]/10 text-[#FF5A20]` for invitation/pending states.


