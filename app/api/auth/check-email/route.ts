import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { ApiMiddleware } from "@/lib/api-middleware"

/**
 * Check if an email is already registered
 * GET /api/auth/check-email?email=user@example.com
 */
export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const email = searchParams.get('email')?.toLowerCase().trim()

      if (!email) {
        return NextResponse.json(
          { error: 'Email parameter is required' },
          { status: 400 }
        )
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { available: false, reason: 'Invalid email format' },
          { status: 200 }
        )
      }

      // Check if email exists in database
      const [existingUser] = await secureDb.db
        .select({ 
          id: schema.users.id,
          role: schema.users.role,
          isActive: schema.users.isActive,
          emailVerified: schema.users.emailVerified
        })
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1)

      if (existingUser) {
        return NextResponse.json({
          available: false,
          reason: 'Email already registered',
          details: {
            hasAccount: true,
            isActive: existingUser.isActive,
            isVerified: existingUser.emailVerified
          }
        })
      }

      // Email is available
      return NextResponse.json({
        available: true,
        message: 'Email is available'
      })

    } catch (error) {
      console.error('Email check error:', error)
      return NextResponse.json(
        { error: 'Failed to check email availability' },
        { status: 500 }
      )
    }
  },
  {
    rateLimit: {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 10 // 10 requests per minute per IP
    },
    cors: true,
    requestSizeCheck: false
  }
)

