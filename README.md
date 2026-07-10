# Adhunik Crop Care

Next.js storefront for Adhunik Crop Care.

## Requirements

- Node.js 20, 22, or 24
- npm

The project includes `.nvmrc` and `.node-version`, so use the configured Node version before running scripts.

## Commands

```bash
npm run dev
npm run build
npm run lint
```

## Project Structure

```text
.
├── src/
│   ├── app/                         # Next.js App Router routes and layouts
│   │   ├── checkout/                # Checkout page
│   │   └── products/                # Product listing and detail routes
│   ├── components/                  # Shared UI that is not tied to one feature
│   │   ├── debug/                   # Debug-only UI helpers
│   │   ├── home/                    # Homepage sections
│   │   ├── layout/                  # Header, footer, announcement bar
│   │   └── search/                  # Search UI
│   ├── features/                    # Domain-specific application code
│   │   ├── cart/                    # Cart state and cart UI
│   │   └── products/                # Product-specific UI
│   └── lib/                         # Shared utilities
├── public/                          # Static assets
├── scripts/                         # Local maintenance scripts
├── next.config.ts                   # Next.js configuration
└── sentry.*.config.ts               # Sentry configuration
```

## Import Rules

- Use `@/components/...` for shared UI.
- Use `@/features/<feature>/...` for feature-owned code.
- Use `@/lib/...` for shared utilities.
- Keep framework configuration files at the repository root.
