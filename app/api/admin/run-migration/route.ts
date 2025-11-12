import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUserFromStackAuth()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { migrationName } = body

    if (migrationName !== 'add_show_email_preference') {
      return NextResponse.json(
        { error: 'Invalid migration name' },
        { status: 400 }
      )
    }

    // Run the migration
    await query`
      ALTER TABLE student_preferences 
      ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT true
    `

    await query`
      UPDATE student_preferences 
      SET show_email = true 
      WHERE show_email IS NULL
    `

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully'
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to run migration' },
      { status: 500 }
    )
  }
}

