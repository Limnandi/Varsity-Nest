import { NextRequest, NextResponse } from 'next/server'
import { defaultSecurityConfig, SecurityMiddleware } from '@/lib/security-config'

export async function middleware(request: NextRequest) {
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

  // Enforce email verification for protected API routes (allowlist public endpoints)
  const path = request.nextUrl.pathname
  const publicApi = [
    '/api/health',
    '/api/docs',
    '/api/auth/login',
    '/api/auth/secure-login',
    '/api/auth/session',
    '/api/auth/secure-logout',
    '/api/auth/register',
    '/api/auth/ensure-user',
    '/api/auth/check-email',
    '/api/auth/resend-verification',
    '/api/auth/send-verification',
    '/api/auth/verify-email',
    '/api/auth/verify-email-native',
    '/api/stack/webhook',
    '/api/admin/settings', // Allow admin settings to be fetched without verification
    '/api/auth/user-role', // Allow user role to be fetched without verification
  ]

  const isPublic = publicApi.some((p) => path.startsWith(p)) || request.method === 'OPTIONS'
  if (isPublic) {
    return response
  }

  // For protected routes, let StackAuth handle authentication
  // The individual API routes will check authentication using getCurrentUser()
  return response
}

export const config = {
  matcher: ['/api/:path*']
}


