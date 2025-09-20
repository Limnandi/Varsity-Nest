import { NextResponse } from "next/server"
import { sendOTP } from "@/lib/otp"

export async function POST(request: Request) {
  try {
    const { email, userType } = await request.json()

    if (!email || !userType) {
      return NextResponse.json(
        { success: false, error: "Email and user type are required" },
        { status: 400 }
      )
    }

    const result = await sendOTP(email, "registration", userType as "student" | "provider")
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Resend OTP error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to resend OTP" },
      { status: 500 }
    )
  }
}