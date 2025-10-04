import { NextRequest, NextResponse } from 'next/server'
import { defaultSecurityConfig, SecurityMiddleware } from '@/lib/security-config'

export function middleware(request: NextRequest) {
  // Only apply CORS/security headers to API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Preflight handling
  if (request.method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 204 })
    return SecurityMiddleware.applyCORS(preflight, defaultSecurityConfig)
  }

  const response = NextResponse.next()

  // Apply CORS
  SecurityMiddleware.applyCORS(response, defaultSecurityConfig)

  // Apply security headers
  SecurityMiddleware.applySecurityHeaders(response, defaultSecurityConfig)

  return response
}

export const config = {
  matcher: ['/api/:path*']
}


