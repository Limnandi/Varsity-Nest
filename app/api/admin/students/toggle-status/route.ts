import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/stackauth"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { studentId, isActive } = await request.json()
    if (!studentId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'studentId and isActive are required' }, { status: 400 })
    }

    const res = await query`
      UPDATE users SET is_active = ${isActive}, updated_at = NOW()
      WHERE id = ${studentId} AND role = 'student'
    `
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('toggle-status error', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
