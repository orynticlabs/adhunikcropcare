import orycmsConfig from "../../../orycms.config"

const adminBasePath = orycmsConfig.admin.basePath
const adminHref = (path = "") => `${adminBasePath}${path}`

export type OryCMSAdminModule = {
  section: string
  label: string
  href: string
  slug: string
  description: string
  badge?: string
  children?: OryCMSAdminModule[]
}

export const ORYCMS_ADMIN_MENU: { section: string; items: OryCMSAdminModule[] }[] = [
  {
    section: "Workspace",
    items: [
      {
        section: "Workspace",
        label: "Overview",
        href: adminHref(),
        slug: "",
        description: "A live summary of the OryCMS workspace, setup status, and admin activity.",
      },
    ],
  },
  {
    section: "Commerce",
    items: [
      {
        section: "Commerce",
        label: "Commerce",
        href: adminHref("/commerce"),
        slug: "commerce",
        description: "Catalog, inventory, category, and commerce operations.",
        children: [
          {
            section: "Commerce",
            label: "Products",
            href: adminHref("/products"),
            slug: "products",
            description: "Manage product catalog items, variants, prices, and merchandising.",
          },
          {
            section: "Commerce",
            label: "Categories",
            href: adminHref("/categories"),
            slug: "categories",
            description: "Organize products and content into navigable category groups.",
          },
          {
            section: "Commerce",
            label: "Inventory",
            href: adminHref("/inventory"),
            slug: "inventory",
            description: "Track stock levels, locations, and low-stock warnings.",
          },
          {
            section: "Commerce",
            label: "Discounts",
            href: adminHref("/discounts"),
            slug: "discounts",
            description: "Create and manage discount codes, offers, and promotions.",
          },
        ],
      },
      {
        section: "Commerce",
        label: "Orders",
        href: adminHref("/orders"),
        slug: "orders",
        description: "Review payments, fulfillment queues, dispatch status, and returns.",
      },
      {
        section: "Commerce",
        label: "Customers",
        href: adminHref("/customers"),
        slug: "customers",
        description: "Browse customer profiles and lifecycle signals.",
      },
    ],
  },
  {
    section: "Content",
    items: [
      {
        section: "Content",
        label: "Certificates",
        href: adminHref("/certificates"),
        slug: "certificates",
        description: "Add, order, publish, and maintain company certificates.",
      },
      {
        section: "Content",
        label: "Collections",
        href: adminHref("/collections"),
        slug: "collections",
        description: "Define content schemas and manage collection structure.",
        children: [
          {
            section: "Content",
            label: "Collections",
            href: adminHref("/collections"),
            slug: "collections",
            description: "Define content schemas and manage collection structure.",
          },
          {
            section: "Content",
            label: "Payments",
            href: adminHref("/payments"),
            slug: "payments",
            description: "Review payment providers, transactions, and payout configuration.",
          },
        ],
      },
      {
        section: "Content",
        label: "Content",
        href: adminHref("/content"),
        slug: "content",
        description: "Create, edit, publish, and review content entries.",
      },
      {
        section: "Content",
        label: "Media",
        href: adminHref("/media"),
        slug: "media",
        description: "Upload, organize, and reuse media assets across OryCMS.",
      },
    ],
  },
  {
    section: "Identity",
    items: [
      {
        section: "Identity",
        label: "Users",
        href: adminHref("/users"),
        slug: "users",
        description: "Invite admins and manage team access.",
      },
      {
        section: "Identity",
        label: "Roles",
        href: adminHref("/roles"),
        slug: "roles",
        description: "Define roles and permissions for every admin workflow.",
      },
    ],
  },
  {
    section: "Growth",
    items: [
      {
        section: "Growth",
        label: "Marketing",
        href: adminHref("/marketing"),
        slug: "marketing",
        description: "Plan campaigns, announcements, and growth moments.",
      },
      {
        section: "Growth",
        label: "Analytics",
        href: adminHref("/analytics"),
        slug: "analytics",
        description: "Inspect revenue, traffic, conversion, and cohort trends.",
      },
    ],
  },
  {
    section: "Platform",
    items: [
      ...(orycmsConfig.plugins.enabled
        ? [
            {
              section: "Platform",
              label: "Plugins",
              href: adminHref("/plugins"),
              slug: "plugins",
              description: "Manage installed OryCMS plugins from orycms.config.ts.",
            },
          ]
        : []),
      {
        section: "Platform",
        label: "Database",
        href: adminHref("/database"),
        slug: "database",
        description: "Review schema, Neon connection, and migration status.",
      },
      {
        section: "Platform",
        label: "SEO",
        href: adminHref("/seo"),
        slug: "seo",
        description: "Manage redirects, sitemap behavior, and search metadata.",
      },
    ],
  },
  {
    section: "System",
    items: [
      {
        section: "System",
        label: "Settings",
        href: adminHref("/settings"),
        slug: "settings",
        description: "Configure workspace identity, storage, auth, hooks, and security.",
      },
      {
        section: "System",
        label: "Setup",
        href: adminHref("/setup"),
        slug: "setup",
        description: "Run first-time owner setup once against the configured Neon database.",
      },
    ],
  },
]

export const ORYCMS_ADMIN_SEARCH_ITEMS = ORYCMS_ADMIN_MENU.flatMap((group) =>
  group.items.flatMap((item) => item.children ?? [item]),
)

export function getOryCMSAdminModule(slug: string) {
  return ORYCMS_ADMIN_SEARCH_ITEMS.find((item) => item.slug === slug)
}
