import { type NextRequest, NextResponse } from "next/server"
import { toggleUserStatus } from "@/lib/stackauth"
import { getSession } from "@/lib/stackauth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { studentId, isActive } = await request.json()

    if (!studentId || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    const success = await toggleUserStatus(studentId, isActive)

    if (!success) {
      return NextResponse.json({ error: "Failed to update student status" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error toggling student status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
