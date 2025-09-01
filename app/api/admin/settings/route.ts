import { type NextRequest, NextResponse } from "next/server"
import { postgrest } from "@/lib/postgrest"
import { verifyToken } from "@/lib/stackauth"
import { Sentry } from "@/lib/sentry"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const payload = await verifyToken(token || "")

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rows = await postgrest.get<any>('admin_settings', { select: 'key,value', limit: 1000 })
    const settings: any = {}
    rows.forEach((row: { key: string, value: any }) => {
      settings[row.key] = row.value
    })

    return NextResponse.json(settings)
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const payload = await verifyToken(token || "")

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { key, value } = await request.json()

    await postgrest.post('admin_settings', { key, value }, { on_conflict: 'key' })

    return NextResponse.json({ success: true })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
