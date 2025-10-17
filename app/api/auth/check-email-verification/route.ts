import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check email verification status in database
    const userResult = await query`
      SELECT id, email, email_verified, first_name, last_name
      FROM users
      WHERE email = ${email.toLowerCase().trim()}
    `

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = userResult.rows[0]

    return NextResponse.json({
      success: true,
      emailVerified: user.email_verified,
      userId: user.id,
      firstName: user.first_name,
      lastName: user.last_name
    })

  } catch (error) {
    console.error('check-email-verification error', error)
    return NextResponse.json({ error: 'Failed to check email verification status' }, { status: 500 })
  }
}
