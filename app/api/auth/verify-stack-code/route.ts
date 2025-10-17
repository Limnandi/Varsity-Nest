import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Verification code is required" }, { status: 400 })
    }

    // Call Stack Auth's verify endpoint
    const response = await fetch(
      'https://api.stack-auth.com/api/v1/contact-channels/verify',
      {
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
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ 
        success: false, 
        message: errorData.message || 'Failed to verify email' 
      }, { status: 400 })
    }

    // Verify the response is successful
    await response.json()

    // Update our database to mark email as verified
    if (userId) {
      try {
        const { query } = await import('@/lib/database')
        await query`
          UPDATE users 
          SET email_verified = true, updated_at = NOW()
          WHERE id = ${userId}
        `
      } catch (dbError) {
        console.error('Failed to update database:', dbError)
        // Don't fail the verification if database update fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email verified successfully' 
    })

  } catch (error) {
    console.error('verify-stack-code error', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to verify email' 
    }, { status: 500 })
  }
}
