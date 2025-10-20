import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/stackauth"
import { query } from "@/lib/database"

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { studentId } = await request.json()
    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    // Cascade via FK from students.user_id
    const res = await query`
      DELETE FROM users WHERE id = ${studentId} AND role = 'student'
    `
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('delete student error', error)
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
  }
}
