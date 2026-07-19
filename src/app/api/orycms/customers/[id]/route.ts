import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { getOryCMSCustomer, softDeleteOryCMSCustomer, updateOryCMSCustomer } from "@/lib/orycms/customers"

export const runtime = "nodejs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const customer = await getOryCMSCustomer((await params).id)
    if (!customer) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Customer not found." } }, { status: 404 })
    return NextResponse.json({ success: true, data: customer })
  } catch (error) {
    return customerError(error, "Failed to load customer.")
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    const customer = await updateOryCMSCustomer((await params).id, await request.json())
    return NextResponse.json({ success: true, data: customer })
  } catch (error) {
    return customerError(error, "Failed to update customer.")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    await softDeleteOryCMSCustomer((await params).id)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return customerError(error, "Failed to delete customer.")
  }
}

function customerError(error: unknown, fallback: string) {
  if (error instanceof Response) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: error.status },
    )
  }

  return NextResponse.json(
    { success: false, error: { code: "CUSTOMER_ERROR", message: error instanceof Error ? error.message : fallback } },
    { status: 500 },
  )
}
