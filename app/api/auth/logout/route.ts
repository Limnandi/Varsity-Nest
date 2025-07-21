import { type NextRequest, NextResponse } from "next/server"
import { logout } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    await logout()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
