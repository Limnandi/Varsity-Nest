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

    // Use Stack Auth's native verification system (automatically uses email_verification template)
    // This method uses Stack Auth's built-in verification system which handles the template
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.varsitynest.space'
    const callbackUrl = `${appUrl}/auth/verify-email?userId=${userId}`
    
    // Call Stack Auth's send-verification-code endpoint
    // This automatically uses the built-in email_verification template
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
      
      // Fallback to using Stack Auth's email_verification template via sendEmail
      return await sendCustomVerificationEmail(userId, user.primaryEmail || '')
    }

    return { success: true }
  } catch (error: any) {
    console.error('Stack Auth verification email error:', error)
    
    // Fallback to using Stack Auth's email_verification template via sendEmail
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
    
    // Use Stack Auth's built-in email_verification template
    const result = await app.sendEmail({
      userIds: [userId],
      templateId: 'email_verification',
      subject: 'Verify your email address',
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


