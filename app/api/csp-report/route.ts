import { NextRequest, NextResponse } from "next/server"
import { Sentry } from "@/lib/sentry"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    Sentry.captureMessage('CSP Violation Reported', {
      level: 'warning',
      tags: { component: 'csp' },
      extra: body
    })
    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json({ received: false }, { status: 400 })
  }
}


