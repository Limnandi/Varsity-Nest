import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/stackauth"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// GET /api/admin/students
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await query`
      SELECT u.id,
             (u.first_name || ' ' || u.last_name) AS name,
             u.email,
             COALESCE(s.university, NULL) AS university,
             u.is_active,
             u.created_at
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id
      WHERE u.role = 'student' AND u.email_verified = true
      ORDER BY u.created_at DESC
    `

    const students = result.rows.map((row: any) => ({
      id: row.id,
      name: String(row.name || '').trim() || row.email,
      email: row.email,
      university: (row.university || 'UFS') as 'UFS' | 'CUT',
      isActive: !!row.is_active,
      createdAt: row.created_at,
    }))

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}
