import { NextRequest, NextResponse } from "next/server"
import {
  ORYCMS_ADMIN_BASE_PATH,
  ORYCMS_API_BASE_PATH,
  ORYCMS_SESSION_COOKIE,
} from "@/lib/orycms/config"

const ACCESS_COOKIE = "acc_access"
const REFRESH_COOKIE = "acc_refresh"
const PUBLIC_ORYCMS_PAGES = new Set(["/setup", "/admin/login", "/admin/setup"])
const PUBLIC_ORYCMS_AUTH_API = new Set([
  `${ORYCMS_API_BASE_PATH}/auth/login`,
  `${ORYCMS_API_BASE_PATH}/auth/logout`,
  `${ORYCMS_API_BASE_PATH}/auth/me`,
  `${ORYCMS_API_BASE_PATH}/auth/session`,
  `${ORYCMS_API_BASE_PATH}/auth/setup`,
  `${ORYCMS_API_BASE_PATH}/auth/setup-status`,
])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has(ORYCMS_SESSION_COOKIE)

  if (PUBLIC_ORYCMS_PAGES.has(pathname) || PUBLIC_ORYCMS_AUTH_API.has(pathname)) {
    return NextResponse.next()
  }

  const isOryCMSAdmin =
    pathname === ORYCMS_ADMIN_BASE_PATH ||
    pathname.startsWith(`${ORYCMS_ADMIN_BASE_PATH}/`)
  const isOryCMSApi = pathname.startsWith(`${ORYCMS_API_BASE_PATH}/`)

  if (!isOryCMSAdmin && !isOryCMSApi) {
    if (isStorefrontProtectedPath(pathname)) {
      const hasStorefrontSession =
        request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE)
      if (!hasStorefrontSession) {
        const loginUrl = new URL("/login", request.url)
        if (isSafeFromPath(pathname)) loginUrl.searchParams.set("from", pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
    return NextResponse.next()
  }

  if (hasSession) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/admin/login", request.url)
  if (isSafeFromPath(pathname)) {
    loginUrl.searchParams.set("from", pathname)
  }

  return NextResponse.redirect(loginUrl)
}

function isSafeFromPath(pathname: string) {
  return pathname.startsWith("/") && !pathname.startsWith("//")
}

function isStorefrontProtectedPath(pathname: string) {
  return pathname === "/checkout" || pathname === "/account" || pathname.startsWith("/account/") || pathname === "/wishlist"
}

export const config = {
  matcher: ["/admin/:path*", "/api/orycms/:path*", "/account/:path*", "/checkout", "/wishlist", "/setup"],
}
