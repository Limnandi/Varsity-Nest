import { NextRequest, NextResponse } from "next/server"
import { getStackServerApp } from "@/lib/stack"
import { ApiErrorResponseBuilder } from "@/lib/api-error-response"
import { redis } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { userId: "User ID is required" },
        request
      )
    }

    const stackServerApp = getStackServerApp()
    
    // Get the user to verify they exist and get their contact channels
    const user = await stackServerApp.getUser(userId)
    if (!user) {
      return await ApiErrorResponseBuilder.createNotFoundErrorResponse(
        "User",
        request
      )
    }

    // Get the user's contact channels to find their email
    const contactChannels = await user.listContactChannels()
    const emailChannel = contactChannels.find((channel: any) => 
      channel.type === 'email' && channel.value === user.primaryEmail
    )

    if (!emailChannel) {
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { emailChannel: "Email contact channel not found" },
        request
      )
    }

    // Generate a unique verification token and store the mapping
    const verificationToken = (await import('crypto')).randomBytes(24).toString('hex')
    await redis.set(`verify:${verificationToken}`, userId, { ex: 60 * 30 }) // 30 minutes expiry

    // Send verification code using StackAuth's REST API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.varsitynest.space'
    const callbackUrl = `${appUrl}/auth/verify?token=${verificationToken}`
    
    const response = await fetch(`https://api.stack-auth.com/api/v1/contact-channels/${userId}/${emailChannel.id}/send-verification-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-stack-access-type': 'server',
        'x-stack-project-id': process.env.STACK_PROJECT_ID!,
        'x-stack-secret-server-key': process.env.STACK_SECRET_SERVER_KEY!,
      },
      body: JSON.stringify({
        callback_url: callbackUrl
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return await ApiErrorResponseBuilder.createErrorResponse(
        new Error(errorData.message || 'Failed to send verification code'),
        request,
        { operation: "send_verification_email" }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: "Verification email sent successfully"
    })

  } catch (error: any) {
    console.error("Send verification email error:", error)
    return await ApiErrorResponseBuilder.createErrorResponse(
      error,
      request,
      { operation: "send_verification_email" }
    )
  }
}
