import { NextRequest, NextResponse } from "next/server"
import { ApiErrorResponseBuilder } from "@/lib/api-error-response"
import { publicEnv } from "@/lib/env.client"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { email: "Email is required" },
        request
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { email: "Invalid email format" },
        request
      )
    }

    // Use Stack Auth's dedicated password reset endpoint
    // This automatically uses the password_reset template
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.varsitynest.space'
    const callbackUrl = `${appUrl}/auth/reset-password`
    
    const response = await fetch(
      'https://api.stack-auth.com/api/v1/auth/password/send-reset-code',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-stack-access-type': 'server',
          'x-stack-project-id': publicEnv.STACK_PROJECT_ID,
          'x-stack-secret-server-key': process.env.STACK_SECRET_SERVER_KEY!,
        },
        body: JSON.stringify({
          email: email,
          callback_url: callbackUrl
        })
      }
    )

    // Stack Auth's endpoint handles security - always returns success for valid requests
    // regardless of whether user exists or not
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Stack Auth password reset error:', errorData)
      
      // For security, always return generic success message
      // Don't reveal if user exists or not
      return NextResponse.json({ 
        success: true,
        message: "If an account exists with this email, a password reset link has been sent."
      })
    }

    // Success - return generic message for security
    return NextResponse.json({ 
      success: true,
      message: "If an account exists with this email, a password reset link has been sent."
    })

  } catch (error: any) {
    console.error("Forgot password error:", error)
    // For security, always return success message
    return NextResponse.json({ 
      success: true,
      message: "If an account exists with this email, a password reset link has been sent."
    })
  }
}

