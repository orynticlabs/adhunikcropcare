import { NextResponse } from "next/server"
import { RazorpayApiError } from "@/lib/razorpay/client"

/** Shared error → JSON response mapper for the payments API routes. */
export function paymentsError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    const code = error.status === 403 ? "FORBIDDEN" : "UNAUTHORIZED"
    const message = error.status === 403 ? "You do not have permission to perform this action." : "Authentication required."
    return NextResponse.json({ success: false, error: { code, message } }, { status: error.status })
  }
  if (error instanceof RazorpayApiError) {
    return NextResponse.json(
      { success: false, error: { code: "RAZORPAY_ERROR", message: error.message } },
      { status: error.status >= 400 && error.status < 600 ? error.status : 502 },
    )
  }
  return NextResponse.json(
    { success: false, error: { code: "PAYMENTS_ERROR", message: error instanceof Error ? error.message : fallback } },
    { status: 500 },
  )
}
