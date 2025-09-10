import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, invalidateSession } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    
    if (user) {
      // Get session ID from token to invalidate specific session
      const authHeader = request.headers.get('authorization')
      const cookieToken = request.cookies.get('varsity-nest-session')?.value
      
      let token = null
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      } else if (cookieToken) {
        token = cookieToken
      }
      
      if (token) {
        try {
          const { verifySecureSession } = await import('@/lib/auth-server')
          const session = await verifySecureSession(token)
          if (session) {
            await invalidateSession(session.sessionId)
          }
        } catch (error) {
          console.error('Session invalidation error:', error)
        }
      }
    }

    // Clear the session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('varsity-nest-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })

    return response
  } catch (error) {
    console.error("Secure logout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
