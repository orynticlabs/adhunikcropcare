# Application boundaries

- **Storefront/customer side:** Customer signup, email verification, login, profile, wishlist, cart, checkout, payments, and orders. Storefront customers use the `storefront_*` data and `/api/auth/*` routes.
- **OryCMS/admin side:** Administrator login and management of products, categories, inventory, media, orders, and other administrative options. Administrators use OryCMS data and `/api/orycms/*` routes.
- Never mix storefront customer authentication with OryCMS administrator authentication or sessions.
- Storefront customers must verify their email before they can log in or access authenticated customer features.
- A storefront customer's email address is immutable until a dedicated email-change and re-verification workflow is implemented.
- Never read or edit `.env.local`. Document required environment variables in `.env.example` for the user to apply.
