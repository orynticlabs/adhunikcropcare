import { PlaceholderPage } from "@/components/orycms/placeholder-page"
import { getOryCMSAdminModule } from "@/lib/orycms/admin-menu"

export default async function AdminPlaceholderPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const moduleSlug = slug[0] ?? ""
  const adminModule = getOryCMSAdminModule(moduleSlug)

  return (
    <PlaceholderPage
      breadcrumbs={[
        { href: "/admin", label: "Overview" },
        { href: adminModule?.href ?? `/admin/${moduleSlug}`, label: adminModule?.label ?? toTitleCase(moduleSlug) },
        ...slug.slice(1).map((part, index) => ({
          href: `/admin/${slug.slice(0, index + 2).join("/")}`,
          label: toTitleCase(part),
        })),
      ]}
      eyebrow={adminModule?.section ?? "OryCMS"}
      title={adminModule?.label ?? toTitleCase(moduleSlug)}
      description={
        adminModule?.description ??
        "This OryCMS admin route is available and ready for module implementation."
      }
    />
  )
}

function toTitleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
