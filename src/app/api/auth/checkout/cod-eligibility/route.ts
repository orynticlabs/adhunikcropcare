import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getCustomerCompletedOrderCount, getOryCMSCodRule } from "@/lib/orycms/cod-rules"
import { currentUser, jsonError, rateLimit, requestKey } from "@/lib/storefront-auth"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await rateLimit(await requestKey("checkout-cod-eligibility"), 30)
    const user = await currentUser()
    const { minOrdersRequired } = await getOryCMSCodRule()

    if (!user) {
      // Guest or unauthenticated user
      const eligible = minOrdersRequired === 0
      return NextResponse.json({
        data: {
          eligible,
          minOrdersRequired,
          userOrderCount: 0,
        },
        success: true,
      })
    }

    const userOrderCount = await getCustomerCompletedOrderCount(user.id)
    const eligible = minOrdersRequired === 0 || userOrderCount >= minOrdersRequired

    return NextResponse.json({
      data: {
        eligible,
        minOrdersRequired,
        userOrderCount,
      },
      success: true,
    })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to check COD eligibility.", 400, "COD_ELIGIBILITY_ERROR")
  }
}
