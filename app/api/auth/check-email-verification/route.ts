import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getStackServerApp } from "@/lib/stack"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // First, get user from Neon to get userId
    const userResult = await query`
      SELECT id, email, first_name, last_name
      FROM users
      WHERE email = ${email.toLowerCase().trim()}
    `

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = userResult.rows[0]

    // Check email verification status in StackAuth (source of truth)
    try {
      const stackApp = getStackServerApp()
      const stackUser = await stackApp.getUser(user.id)
      
      if (!stackUser) {
        console.warn(`check-email-verification: User ${user.id} not found in StackAuth`)
        return NextResponse.json({
          success: true,
          emailVerified: false,
          userId: user.id,
          firstName: user.first_name,
          lastName: user.last_name
        })
      }

      return NextResponse.json({
        success: true,
        emailVerified: !!stackUser.primaryEmailVerified,
        userId: user.id,
        firstName: user.first_name,
        lastName: user.last_name
      })
    } catch (stackError) {
      console.error('check-email-verification: Failed to check StackAuth:', stackError)
      // Fallback: return false if we can't check StackAuth
      return NextResponse.json({
        success: true,
        emailVerified: false,
        userId: user.id,
        firstName: user.first_name,
        lastName: user.last_name
      })
    }

  } catch (error) {
    console.error('check-email-verification error', error)
    return NextResponse.json({ error: 'Failed to check email verification status' }, { status: 500 })
  }
}
