import { getStackServerApp } from "@/lib/stack"

export type EmailSendResult = {
  success: true
} | {
  success: false
  code?: string
  message: string
}

export async function sendVerificationEmailViaStack(userId: string): Promise<EmailSendResult> {
  try {
    const app = getStackServerApp()
    
    // Get user details to find their contact channels
    const user = await app.getUser(userId)
    if (!user) {
      return { success: false, message: 'User not found' }
    }

    // Get the user's contact channels to find their email
    const contactChannels = await user.listContactChannels()
    const emailChannel = contactChannels.find((channel: any) => 
      channel.type === 'email' && channel.value === user.primaryEmail
    )

    if (!emailChannel) {
      return { success: false, message: 'Email contact channel not found' }
    }

    // Use Stack Auth's native verification system
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.varsitynest.space'
    const callbackUrl = `${appUrl}/auth/verify-email?userId=${userId}`
    
    // Call Stack Auth's send-verification-code endpoint
    const response = await fetch(
      `https://api.stack-auth.com/api/v1/contact-channels/${userId}/${emailChannel.id}/send-verification-code`,
      {
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
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Stack Auth verification email failed:', errorData)
      
      // Fallback to custom email with Stack Auth's sendEmail method
      return await sendCustomVerificationEmail(userId, user.primaryEmail || '')
    }

    return { success: true }
  } catch (error: any) {
    console.error('Stack Auth verification email error:', error)
    
    // Fallback to custom email
    try {
      const app = getStackServerApp()
      const user = await app.getUser(userId)
      if (user?.primaryEmail) {
        return await sendCustomVerificationEmail(userId, user.primaryEmail)
      }
    } catch (fallbackError) {
      console.error('Fallback email also failed:', fallbackError)
    }
    
    return { success: false, message: error?.message || 'Failed to send verification email' }
  }
}

async function sendCustomVerificationEmail(userId: string, _email: string): Promise<EmailSendResult> {
  try {
    const app = getStackServerApp()
    
    // Generate verification token using Stack Auth's method
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.varsitynest.space'
    const verificationLink = `${appUrl}/auth/verify-email?userId=${userId}&token=stack-auth-verification`
    
    // Use Stack Auth's sendEmail method with custom HTML
    const result = await app.sendEmail({
      userIds: [userId],
      subject: 'Verify your Varsity Nest account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 24px; color: #fff;">
            <h1 style="margin: 0; font-size: 20px;">Varsity Nest</h1>
          </div>
          <div style="padding: 24px; background: #ffffff; color: #0f172a;">
            <h2 style="margin: 0 0 12px 0; font-size: 18px;">Verify your email</h2>
            <p style="margin: 0 0 16px 0; line-height: 1.5;">To complete your registration, please verify your email:</p>
            <p style="margin: 0 0 16px 0; line-height: 1.5;">
              <a href="${verificationLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Verify Email
              </a>
            </p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #475569;">If you didn't request this, you can safely ignore this email.</p>
          </div>
          <div style="padding: 16px 24px; background: #f8fafc; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;">
            © Varsity Nest
          </div>
        </div>
      `,
    })

    if ((result as any).status === 'error') {
      const err = (result as any).error || {}
      return { success: false, code: err.code, message: err.message || 'Failed to send verification email' }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, message: error?.message || 'Failed to send verification email' }
  }
}


