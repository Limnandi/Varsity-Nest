import { NextRequest, NextResponse } from "next/server"
import { ApiErrorResponseBuilder } from "@/lib/api-error-response"
import { publicEnv } from "@/lib/env.client"

export async function POST(request: NextRequest) {
  try {
    const { code, password } = await request.json()

    if (!code) {
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { code: "Reset code is required" },
        request
      )
    }

    if (!password) {
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { password: "Password is required" },
        request
      )
    }

    if (password.length < 8) {
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { password: "Password must be at least 8 characters long" },
        request
      )
    }

    // Call Stack Auth's password reset endpoint
    const response = await fetch(
      'https://api.stack-auth.com/api/v1/auth/password/reset',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-stack-access-type': 'server',
          'x-stack-project-id': publicEnv.STACK_PROJECT_ID,
          'x-stack-secret-server-key': process.env.STACK_SECRET_SERVER_KEY!,
        },
        body: JSON.stringify({
          code: code,
          password: password
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 400 || response.status === 404) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired reset code. Please request a new password reset link." },
          { status: 400 }
        )
      }
      
      return await ApiErrorResponseBuilder.createErrorResponse(
        new Error(data.message || data.error || "Failed to reset password"),
        request,
        { operation: "reset_password" }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: "Password reset successfully"
    })

  } catch (error: any) {
    console.error("Password reset error:", error)
    return await ApiErrorResponseBuilder.createErrorResponse(
      error,
      request,
      { operation: "reset_password" }
    )
  }
}

