import { NextRequest } from "next/server"
import { getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { ApiMiddleware } from "@/lib/api-middleware"
import { ApiErrorResponseBuilder } from "@/lib/api-error-response"

export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      // Always query fresh data from database via StackAuth to ensure profile updates are reflected
      const user = await getCurrentUserFromStackAuth()
      
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

      if (!user.emailVerified) {
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
