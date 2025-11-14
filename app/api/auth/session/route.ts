import { NextRequest } from "next/server"
import { getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { ApiMiddleware } from "@/lib/api-middleware"
import { ApiErrorResponseBuilder } from "@/lib/api-error-response"

export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    const requestId = Math.random().toString(36).substring(7)
    console.log(`[SESSION API] [${requestId}] GET /api/auth/session - Headers:`, {
      cookie: request.headers.get('cookie') ? 'present' : 'missing',
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent')?.substring(0, 50)
    })
    
    try {
      // Always query fresh data from database via StackAuth to ensure profile updates are reflected
      console.log(`[SESSION API] [${requestId}] Calling getCurrentUserFromStackAuth()...`)
      const user = await getCurrentUserFromStackAuth()
      
      console.log(`[SESSION API] [${requestId}] getCurrentUserFromStackAuth result:`, user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified
      } : 'null')
      
      if (!user) {
        console.warn(`[SESSION API] [${requestId}] No user found - returning 401`)
        return await ApiErrorResponseBuilder.createAuthErrorResponse(
          "Authentication required",
          request,
          { component: 'session_get' }
        )
      }

      if (!user.isActive) {
        console.warn(`[SESSION API] [${requestId}] User account is deactivated - returning 403`)
        return await ApiErrorResponseBuilder.createAuthorizationErrorResponse(
          "Account deactivated",
          request,
          { component: 'session_get' }
        )
      }

      if (!user.emailVerified) {
        console.warn(`[SESSION API] [${requestId}] User email not verified - returning 403`)
        return await ApiErrorResponseBuilder.createAuthorizationErrorResponse(
          "Email not verified. Please verify your email to continue.",
          request,
          { component: 'session_get' }
        )
      }
      
      const userData = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
        role: user.role,
        phone: user.phone,
        studentNumber: user.studentNumber,
        institution: user.institution,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        university: user.university,
        yearOfStudy: user.yearOfStudy,
        course: user.course,
        emergencyContactName: user.emergencyContactName,
        emergencyContactPhone: user.emergencyContactPhone,
        profileImageUrl: user.profileImageUrl,
        profileImageCloudinaryId: user.profileImageCloudinaryId,
      }

      console.log(`[SESSION API] [${requestId}] Returning successful session data for user: ${userData.email}, role: ${userData.role}`)
      return ApiMiddleware.createResponse(
        userData,
        "Session retrieved successfully"
      )
    } catch (error) {
      console.error(`[SESSION API] [${requestId}] Error in session API:`, error)
      return await ApiErrorResponseBuilder.createErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        request,
        { component: 'session_get' }
      )
    }
  },
  {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200 // 200 requests per window
    },
    cors: true,
    requestSizeCheck: false // No body expected
  }
)
