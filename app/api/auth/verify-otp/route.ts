import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()
    if (!email || !otp) {
      return NextResponse.json({ error: "Missing email or otp" }, { status: 400 })
    }

    const key = `otp:registration:${email}`
    const stored = await redis.get<string>(key)
    if (!stored) {
      return NextResponse.json({ success: false, error: "No OTP found" }, { status: 400 })
    }

    // OTP is stored as plain for 10 minutes (send-otp handles TTL). Hash if needed.
    if (stored !== otp) {
      return NextResponse.json({ success: false, error: "Invalid OTP" }, { status: 400 })
    }

    await redis.del(key)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


