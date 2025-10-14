import { NextRequest, NextResponse } from "next/server"
import { ApiErrorResponseBuilder } from "@/lib/api-error-response"
import { query } from "@/lib/database"
import { redis } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const { code, token } = await request.json()

    if (!code) {
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { code: "Verification code is required" },
        request
      )
    }

    // Get userId from token if provided
    let userId = null
    if (token) {
      userId = await redis.get(`verify:${token}`)
      if (userId) {
        // Clean up the token
        await redis.del(`verify:${token}`)
      }
    }

    // Verify the email using StackAuth's REST API
    const response = await fetch('https://api.stack-auth.com/api/v1/contact-channels/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-stack-access-type': 'server',
        'x-stack-project-id': process.env.STACK_PROJECT_ID!,
        'x-stack-secret-server-key': process.env.STACK_SECRET_SERVER_KEY!,
      },
      body: JSON.stringify({
        code: code
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { code: errorData.message || 'Invalid verification code' },
        request
      )
    }

    const result = await response.json()
    
    if (!result.success) {
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { code: 'Invalid verification code' },
        request
      )
    }

    // Update our database to mark email as verified if we have userId
    if (userId) {
      try {
        await query`UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = ${userId}`
      } catch (error) {
        console.error('Failed to update email verification status:', error)
        // Don't fail the verification if DB update fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Email verified successfully",
      userId: userId
    })

  } catch (error: any) {
    console.error("Email verification error:", error)
    return await ApiErrorResponseBuilder.createErrorResponse(
      error,
      request,
      { operation: "verify_email" }
    )
  }
}
