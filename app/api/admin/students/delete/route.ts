import { type NextRequest, NextResponse } from "next/server"
import { deleteUser } from "@/lib/stackauth"
import { getSession } from "@/lib/stackauth"

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { studentId } = await request.json()

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    const success = await deleteUser(studentId)

    if (!success) {
      return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
