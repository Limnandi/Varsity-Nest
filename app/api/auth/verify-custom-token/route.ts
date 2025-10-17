import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Update database to mark email as verified
    await query`
      UPDATE users 
      SET email_verified = true, updated_at = NOW()
      WHERE id = ${userId}
    `

    return NextResponse.json({ 
      success: true, 
      message: 'Email verified successfully' 
    })

  } catch (error) {
    console.error('verify-custom-token error', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to verify email' 
    }, { status: 500 })
  }
}
