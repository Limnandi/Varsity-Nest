import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verifyToken } from "@/lib/auth"
import { Sentry } from "@/lib/sentry"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const payload = await verifyToken(token || "")

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await query("SELECT key, value FROM admin_settings")
    const settings: any = {}

    result.rows.forEach((row: {key: string, value: any}) => {
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

    await query(
      "INSERT INTO admin_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP",
      [key, JSON.stringify(value)],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
