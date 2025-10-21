import { NextRequest, NextResponse } from 'next/server'
import { createAuthMiddleware, hasRequiredRole } from './auth-server'

// Middleware for protecting API routes
export function withAuth(requiredRole?: string) {
  return function (handler: (request: NextRequest, user: any) => Promise<NextResponse>) {
    return async function (request: NextRequest) {
      const authMiddleware = createAuthMiddleware(requiredRole)
      const authResult = await authMiddleware(request)
      
      if (authResult.error) {
        return NextResponse.json(
          { error: authResult.error },
          { status: authResult.status }
        )
      }
      
      return handler(request, authResult.user)
    }
  }
}

// Middleware for protecting pages (server components)
export async function requireAuth(requiredRole?: string) {
  const { headers } = await import('next/headers')
  const { getCurrentUserFromRequest } = await import('./auth-server')
  
  // Get headers and create request object
  const headersList = await headers()
  const request = new NextRequest('http://localhost', {
    headers: headersList
  })
  
  const user = await getCurrentUserFromRequest(request)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  if (!user.isActive) {
    throw new Error('Account deactivated')
  }
  
  if (!user.emailVerified) {
    throw new Error('Email not verified')
  }
  
  if (requiredRole && !hasRequiredRole(user.role, requiredRole)) {
    throw new Error('Insufficient permissions')
  }
  
  return user
}


// Redirect helper for unauthorized access
export function createUnauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  )
}

export function createForbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  )
}
