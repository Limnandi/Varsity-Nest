import { NextRequest, NextResponse } from "next/server"
import { getStackServerApp } from "@/lib/stack"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { userId, email, verified } = await request.json()

    if (!userId || !email || typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: "Missing required fields: userId, email, verified" },
        { status: 400 }
      )
    }

    // Verify the user exists in StackAuth
    const stackApp = getStackServerApp()
    const stackUser = await stackApp.getUser(userId)
    
    if (!stackUser) {
      return NextResponse.json(
        { error: "User not found in StackAuth" },
        { status: 404 }
      )
    }

    // Double-check email verification status with StackAuth
    if (!stackUser.primaryEmailVerified) {
      return NextResponse.json(
        { error: "Email not verified in StackAuth" },
        { status: 400 }
      )
    }

    // Update email verification status in our database
    await query`
      UPDATE users 
      SET email_verified = ${verified}, updated_at = NOW()
      WHERE id = ${userId} AND email = ${email}
    `

    // Log the verification event for admin tracking
    await query`
      INSERT INTO admin_activities (activity_type, message, admin_id)
      VALUES ('email_verification', ${`User ${email} verified their email address`}, ${userId})
    `

    return NextResponse.json({ 
      success: true, 
      message: "Email verification status updated successfully" 
    })

  } catch (error) {
    console.error("Email verification sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync email verification status" },
      { status: 500 }
    )
  }
}
