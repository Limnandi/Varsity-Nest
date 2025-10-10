import { env } from '@/lib/env'

type ResendResult =
  | { ok: true; data: any }
  | { ok: false; status?: number; statusText?: string; body?: any; validation?: boolean; error?: string }

export async function sendVerificationEmailResend(to: string, callbackUrl: string, name?: string): Promise<ResendResult> {
  const apiKey = env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const from = env.RESEND_FROM || 'support@varsitynest.space'
  const subject = 'Verify your Varsity Nest email'
  const safeName = name || 'Student'
  const html = `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial; color: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e6eef8; border-radius: 8px;">
        <h2 style="color:#0ea5e9;">Verify your email</h2>
        <p>Hi ${safeName},</p>
        <p>Thanks for signing up for Varsity Nest. Click the button below to verify your email address.</p>
        <div style="text-align:center; margin: 24px 0;">
          <a href="${callbackUrl}" style="background:#0ea5e9;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">Verify email</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break:break-all;"><a href="${callbackUrl}">${callbackUrl}</a></p>
        <hr style="border:none;border-top:1px solid #eef2ff;margin:24px 0" />
        <p style="font-size:12px;color:#64748b">If you didn't request this, you can ignore this email.</p>
      </div>
    </div>
  `

  const payload = {
    from,
    to: [to],
    subject,
    html,
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const text = await res.text().catch(() => '')
    let body: any = undefined
    try {
      body = text ? JSON.parse(text) : undefined
    } catch (e) {
      body = text
    }

    if (!res.ok) {
      // Common validation: resend returns 403 when domain not verified (validation_error)
      const validation = res.status === 403 || res.status === 422
      return { ok: false, status: res.status, statusText: res.statusText, body, validation }
    }

    // Successful send
    return { ok: true, data: body }
  } catch (err: any) {
    return { ok: false, error: String(err) }
  }
}
