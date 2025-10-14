import { getStackServerApp } from "@/lib/stack"
import { query } from "@/lib/database"

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
    const result = await app.sendEmail({
      userIds: [userId],
      templateId: 'email_verification',
      subject: 'Verify your Varsity Nest account',
      // Use default theme/config from StackAuth; no custom variables required for built-in template
    })

    if ((result as any).status === 'error') {
      const err = (result as any).error || {}
      // Fallback: attempt a direct HTML email using StackAuth email system
      // Build role-aware redirect link
      let role: 'student' | 'provider' | 'admin' = 'student'
      try {
        const res = await query`SELECT role FROM users WHERE id = ${userId} LIMIT 1`
        if (res.rows?.[0]?.role) role = res.rows[0].role
      } catch {}

      // Generate and store a short-lived verification token in Redis
      const token = (await import('crypto')).randomBytes(24).toString('hex')
      try {
        const { redis } = await import('@/lib/redis')
        await redis.set(`verify:${userId}`, token, { ex: 60 * 5 }) // 5 minutes expiry
      } catch {}

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.varsitynest.space'
      const redirectPath = role === 'provider' ? '/provider/dashboard' : role === 'admin' ? '/admin/dashboard' : '/student/dashboard'
      const verificationLink = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(userId)}&redirect_to=${encodeURIComponent(redirectPath)}`
      const fallback = await app.sendEmail({
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
              <p style="margin: 0 0 16px 0; line-height: 1.5;"><a href="${verificationLink}" style="color: #2563eb; text-decoration: none;">Verify Email</a></p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #475569;">If you didn’t request this, you can safely ignore this email.</p>
            </div>
            <div style="padding: 16px 24px; background: #f8fafc; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;">
              © Varsity Nest
            </div>
          </div>
        `,
      })

      if ((fallback as any).status === 'error') {
        const ferr = (fallback as any).error || {}
        return { success: false, code: ferr.code || err.code, message: ferr.message || err.message || 'Failed to send verification email' }
      }
      return { success: true }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, message: error?.message || 'Failed to send verification email' }
  }
}


