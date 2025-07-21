import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("Session API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
