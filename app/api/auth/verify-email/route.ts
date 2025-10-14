import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { query } from "@/lib/database"
// import { getStackServerApp } from "@/lib/stack"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token') || ''
    const userId = searchParams.get('userId') || ''
    const redirectTo = searchParams.get('redirect_to') || ''

    if (!token || !userId) {
      return NextResponse.redirect(new URL('/auth/check-email', request.url))
    }

    const key = `verify:${userId}`
    const stored = (await redis.get(key)) as string | null
    if (!stored || stored !== token) {
      return NextResponse.redirect(new URL('/auth/check-email', request.url))
    }

    // Invalidate token
    await redis.del(key)

    // Ensure our DB reflects verification
    try {
      await query`UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = ${userId}`
    } catch {}

    // Redirect to email-verified (which will route to dashboard), honoring redirect param
    const base = new URL('/auth/email-verified', request.url)
    if (redirectTo) base.searchParams.set('redirect_to', redirectTo)
    return NextResponse.redirect(base)
  } catch (error) {
    return NextResponse.redirect(new URL('/auth/check-email', request.url))
  }
}


