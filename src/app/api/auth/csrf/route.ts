import { csrfResponse } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function GET() {
  return csrfResponse()
}
