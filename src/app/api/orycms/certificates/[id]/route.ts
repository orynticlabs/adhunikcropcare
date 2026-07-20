import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { requireOryCMSUser } from "@/lib/orycms/auth"
import { deleteOryCMSCertificate, saveOryCMSCertificate } from "@/lib/orycms/certificates"

export const runtime = "nodejs"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    return NextResponse.json({ success: true, data: await saveOryCMSCertificate(await request.json(), (await params).id) })
  } catch (error) { return responseError(error) }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOryCMSUser(request)
    await deleteOryCMSCertificate((await params).id)
    return NextResponse.json({ success: true, data: null })
  } catch (error) { return responseError(error) }
}

function responseError(error: unknown) {
  if (error instanceof Response) return NextResponse.json({ success: false, error: { message: "Authentication required." } }, { status: error.status })
  const message = error instanceof Error ? error.message : "Certificate request failed."
  const validation = message.includes("required") || message.includes("Invalid") || message.includes("cannot")
  return NextResponse.json({ success: false, error: { message } }, { status: validation ? 422 : 500 })
}
