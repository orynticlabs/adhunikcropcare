import orycmsConfig from "../../../orycms.config"

export const ORYCMS_ADMIN_BASE_PATH = orycmsConfig.admin.basePath
export const ORYCMS_API_BASE_PATH = orycmsConfig.api.basePath
export const ORYCMS_DATABASE_URL = orycmsConfig.database.url
export const ORYCMS_PLUGINS_ENABLED = orycmsConfig.plugins.enabled
export const ORYCMS_SESSION_COOKIE =
  orycmsConfig.auth.sessionCookieName ?? "orycms_session"
