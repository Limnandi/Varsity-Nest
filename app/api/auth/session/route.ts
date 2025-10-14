import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth, createSecureSession } from "@/lib/auth-server"
import { ApiMiddleware } from "@/lib/api-middleware"
import { ApiErrorResponseBuilder } from "@/lib/api-error-response"

export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      // Try secure JWT session first
      let user = await getCurrentUserFromRequest(request)
      
      // Fallback to StackAuth if no JWT session; if found, mint our secure session cookie
      if (!user) {
        const stackUser = await getCurrentUserFromStackAuth()
        if (stackUser) {
          const sessionToken = await createSecureSession(stackUser)
          const bootstrap = ApiMiddleware.createResponse(
            {
              userId: stackUser.id,
              email: stackUser.email,
              firstName: stackUser.firstName,
              lastName: stackUser.lastName,
              name: `${stackUser.firstName} ${stackUser.lastName}`.trim(),
              role: stackUser.role,
              phone: stackUser.phone,
              studentNumber: stackUser.studentNumber,
              institution: stackUser.institution,
              isActive: stackUser.isActive,
              emailVerified: stackUser.emailVerified,
              createdAt: stackUser.createdAt,
              updatedAt: stackUser.updatedAt,
              university: stackUser.university,
              yearOfStudy: stackUser.yearOfStudy,
              course: stackUser.course,
              emergencyContactName: stackUser.emergencyContactName,
              emergencyContactPhone: stackUser.emergencyContactPhone,
            },
            "Session bootstrapped from StackAuth"
          )

          // attach cookie
          ;(bootstrap as NextResponse).cookies.set('varsity-nest-session', sessionToken, {
            httpOnly: true,
            secure: (await import('@/lib/env')).env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
          })

          return bootstrap
        }
      }
      
      if (!user) {
        return await ApiErrorResponseBuilder.createAuthErrorResponse(
          "Authentication required",
          request,
          { component: 'session_get' }
        )
      }

      if (!user.isActive) {
        return await ApiErrorResponseBuilder.createAuthorizationErrorResponse(
          "Account deactivated",
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
      }

      return ApiMiddleware.createResponse(
        userData,
        "Session retrieved successfully"
      )
    } catch (error) {
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
