import { createOryCMSRouteHandlers } from "@ory-cms/core/next"
import { ORYCMS_API_BASE_PATH, ORYCMS_DATABASE_URL } from "@/lib/orycms/config"

if (ORYCMS_DATABASE_URL) {
  process.env.ORYCMS_DATABASE_URL ??= ORYCMS_DATABASE_URL
}

export const { GET, POST, PATCH, PUT, DELETE } = createOryCMSRouteHandlers({
  basePath: ORYCMS_API_BASE_PATH,
})
