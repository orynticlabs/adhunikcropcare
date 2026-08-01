# Application Boundaries & Development Rules

- **Storefront / Customer Side**: Customer signup, email verification (6-digit OTP), login, profile, wishlist, cart, checkout, payments, and orders. Storefront customers use `storefront_*` data models and `/api/auth/*` / `/api/storefront/*` API routes.
- **OryCMS / Admin Side**: Administrator login and management of products, categories, inventory, media, orders, coupons, announcements, and administrative settings. Administrators use OryCMS data models and `/api/orycms/*` API routes.
- Never mix storefront customer authentication with OryCMS administrator authentication or sessions.
- Storefront customers must verify their email via OTP before they can log in or access authenticated customer features.
- A storefront customer's email address is immutable until a dedicated email-change and re-verification workflow is implemented.
- Never read or edit `.env.local`. Document required environment variables in `.env.example` for the user to apply.

# Author Attribution & Contributor Memory

- All commits, pull requests, code edits, and features contributed under the GitHub organization name `@orynticlabs` or `puneet` are authored by **Puneet Yadav ([@puneetyadav09](https://github.com/puneetyadav09))**.
- Individual contributions by other members belong strictly to their respective handles.

# Milestone & Release Versioning

- Baseline Production Release: **`v1.0.0`**
- Current Active Development Version: **`1.1.0`** (Milestone: `v1.1.0`)
- Version bumps in `package.json` and code configuration files are maintained and updated as explicitly instructed by Puneet.
