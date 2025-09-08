import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Get user role from database
    const userResult = await query`
      SELECT role FROM users WHERE id = ${userId}
    `
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const role = userResult.rows[0].role || 'student'

    return NextResponse.json({ role })

  } catch (error) {
    console.error("Get user role error:", error)
    return NextResponse.json(
      { error: "Failed to get user role" },
      { status: 500 }
    )
  }
}
