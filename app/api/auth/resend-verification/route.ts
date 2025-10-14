import { NextRequest, NextResponse } from "next/server"
import { sendVerificationEmailViaStack } from "@/lib/email"
import { redis } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Rate limiting: max 1 per 60s and 5 per hour per user
    try {
      const burstKey = `resend:burst:${userId}`
      const hourlyKey = `resend:hour:${userId}`
      const burst = await redis.incr(burstKey)
      if (burst === 1) {
        await redis.expire(burstKey, 60)
      }
      if (burst > 1) {
        return NextResponse.json({ error: "Please wait a minute before requesting another email." }, { status: 429 })
      }

      const hourCount = await redis.incr(hourlyKey)
      if (hourCount === 1) {
        await redis.expire(hourlyKey, 3600)
      }
      if (hourCount > 5) {
        return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
      }
    } catch {}

    const result = await sendVerificationEmailViaStack(String(userId))
    if (!result.success) {
      const body: any = { error: result.message }
      if (result.code) body.code = result.code
      return NextResponse.json(body, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('resend-verification error', error)
    const message = error instanceof Error ? error.message : 'Failed to resend verification'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


