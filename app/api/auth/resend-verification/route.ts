import { NextRequest, NextResponse } from 'next/server'
import { getStackServerApp } from '@/lib/stack'
import { sendVerificationEmailResend } from '@/lib/email-resend'
import { renderVerificationEmail } from '@/lib/email-template'
import { jsonLog } from '@/lib/json-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email } = body || {}

    if (!userId && !email) {
      return NextResponse.json({ success: false, error: 'userId or email is required' }, { status: 400 })
    }

  const app = getStackServerApp()
  console.log('[resend-verification] getStackServerApp created. has sendEmail=', typeof (app as any).sendEmail === 'function')

    // Try to resolve the user via ID if provided, otherwise attempt by email
    let stackUser: any = null
    if (userId) {
      stackUser = await app.getUser(userId)
    }

    if (!stackUser && email) {
      // Try to find user by email via SDK list or fallback to handler route not available here.
      // Some Stack SDKs expose a lookup; if not, return an informative error.
      try {
        if (typeof (app as any).findUserByEmail === 'function') {
          stackUser = await (app as any).findUserByEmail(email)
        }
      } catch (e) {
        // ignore and continue
      }
    }

    if (!stackUser) {
      console.warn('[resend-verification] stackUser not found for', { userId, email })
      return NextResponse.json({ success: false, error: 'StackAuth user not found' }, { status: 404 })
    }

    console.log('[resend-verification] stackUser resolved:', { id: stackUser.id, email: stackUser.primaryEmail || stackUser.email || email })

    // Try to fetch contact channels server-side and send verification email
    // Helper to serialize Error objects (including non-enumerable props)
    const serializeError = (err: any) => {
      if (!err) return null
      try {
        const obj: any = {}
        Object.getOwnPropertyNames(err).forEach((k) => {
          try { obj[k] = (err as any)[k] } catch { obj[k] = String((err as any)[k]) }
        })
        // Also include common nested fields
        if (err.response) obj.response = err.response
        if (err.request) obj.request = err.request
        return obj
      } catch (e) {
        return { message: String(err) }
      }
    }

    try {
      const channels = await stackUser.listContactChannels()
      console.log('[resend-verification] contact channels count=', Array.isArray(channels) ? channels.length : 'unknown')
      const emailChannel = Array.isArray(channels) ? channels.find((c: any) => c.type === 'email' && (!email || c.value === email)) : null

      if (!emailChannel) {
        console.warn('[resend-verification] email channel not found', { channels })
        return NextResponse.json({ success: false, error: 'Email contact channel not found on Stack user', channels }, { status: 404 })
      }

      // Some channel objects expose sendVerificationEmail server-side as well
      const callbackBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const callbackUrl = `${callbackBase.replace(/\/$/, '')}/auth/check-email`
      if (typeof emailChannel.sendVerificationEmail === 'function') {
        try {
          // When called from a non-browser (server) environment the SDK requires an explicit callbackUrl
          const result = await emailChannel.sendVerificationEmail({ callbackUrl })
          console.log('[resend-verification] emailChannel.sendVerificationEmail result=', result)
          return NextResponse.json({ success: true, result })
        } catch (chErr: any) {
          const serialized = serializeError(chErr)
          console.error('[resend-verification] emailChannel.sendVerificationEmail failed:', serialized)

          // Try server-side app.sendEmail fallback if available (best-effort)
          if (typeof (app as any).sendEmail === 'function') {
            try {
              // Prefer server-side sendEmail with inline HTML using userIds when available (Stack supports this)
              const subject = 'Verify your Varsity Nest email'
              const html = renderVerificationEmail(callbackUrl)

              const sendResult = await (app as any).sendEmail({
                userIds: [stackUser.id],
                subject,
                html,
                callbackUrl,
              })

              jsonLog('info', '[resend-verification] app.sendEmail (html) result', { result: sendResult })
              if (sendResult && (sendResult as any).status === 'error') {
                const errObj = (sendResult as any).error || {}
                const code = errObj.code || errObj?.code
                jsonLog('error', '[resend-verification] app.sendEmail returned error result', { code, error: errObj })
                // Handle known error codes with specific fallback behavior
                switch (code) {
                  case 'REQUIRES_CUSTOM_EMAIL_SERVER':
                    jsonLog('error', '[resend-verification] sendEmail requires custom email server - falling back to Resend if configured', { code })
                    if (process.env.RESEND_API_KEY) {
                      const rr = await sendVerificationEmailResend(emailChannel.value, callbackUrl)
                      if (!rr.ok && rr.validation) {
                        jsonLog('error', '[resend-verification] Resend validation error (domain not verified?)', { rr })
                        return NextResponse.json({ success: false, error: 'Resend domain not verified', details: rr }, { status: 422 })
                      }
                      console.log('[resend-verification] resend fallback result=', rr)
                      return NextResponse.json({ success: true, fallback: 'resend', result: rr })
                    }
                    break
                  case 'SCHEMA_ERROR':
                    jsonLog('error', '[resend-verification] sendEmail schema error - will try Resend fallback if available', { code })
                    if (process.env.RESEND_API_KEY) {
                      const rr = await sendVerificationEmailResend(emailChannel.value, callbackUrl)
                      console.log('[resend-verification] resend fallback result=', rr)
                      return NextResponse.json({ success: true, fallback: 'resend', result: rr })
                    }
                    break
                  case 'USER_ID_DOES_NOT_EXIST':
                    jsonLog('error', '[resend-verification] sendEmail reports USER_ID_DOES_NOT_EXIST - trying template send to email address', { code })
                    try {
                      const payload = {
                        to: emailChannel.value,
                        templateId: 'email_verification',
                        variables: { url: callbackUrl },
                        callbackUrl,
                      }
                      const tmplRes = await (app as any).sendEmail(payload)
                      jsonLog('info', '[resend-verification] app.sendEmail (template) result after USER_ID_DOES_NOT_EXIST=', { result: tmplRes })
                      if (tmplRes && (tmplRes as any).status === 'error') {
                        // if template also errors, try Resend
                        if (process.env.RESEND_API_KEY) {
                            const rr2 = await sendVerificationEmailResend(emailChannel.value, callbackUrl)
                            if (!rr2.ok && rr2.validation) {
                              jsonLog('error', '[resend-verification] Resend validation error (domain not verified?)', { rr2 })
                              return NextResponse.json({ success: false, error: 'Resend domain not verified', details: rr2 }, { status: 422 })
                            }
                            console.log('[resend-verification] resend fallback result=', rr2)
                            return NextResponse.json({ success: true, fallback: 'resend', result: rr2 })
                          }
                        return NextResponse.json({ success: false, error: 'template send failed', details: tmplRes }, { status: 500 })
                      }
                      return NextResponse.json({ success: true, fallback: 'app.sendEmail.template', result: tmplRes })
                    } catch (te) {
                      jsonLog('error', '[resend-verification] template send failed after USER_ID_DOES_NOT_EXIST:', { error: te })
                      if (process.env.RESEND_API_KEY) {
                        const rr3 = await sendVerificationEmailResend(emailChannel.value, callbackUrl)
                        if (!rr3.ok && rr3.validation) {
                          jsonLog('error', '[resend-verification] Resend validation error (domain not verified?)', { rr3 })
                          return NextResponse.json({ success: false, error: 'Resend domain not verified', details: rr3 }, { status: 422 })
                        }
                        console.log('[resend-verification] resend fallback result=', rr3)
                        return NextResponse.json({ success: true, fallback: 'resend', result: rr3 })
                      }
                    }
                    break
                  default:
                    jsonLog('error', '[resend-verification] Unknown sendEmail error code, attempting Resend fallback if available', { code })
                    if (process.env.RESEND_API_KEY) {
                      const rr4 = await sendVerificationEmailResend(emailChannel.value, callbackUrl)
                      if (!rr4.ok && rr4.validation) {
                        jsonLog('error', '[resend-verification] Resend validation error (domain not verified?)', { rr4 })
                        return NextResponse.json({ success: false, error: 'Resend domain not verified', details: rr4 }, { status: 422 })
                      }
                      console.log('[resend-verification] resend fallback result=', rr4)
                      return NextResponse.json({ success: true, fallback: 'resend', result: rr4 })
                    }
                }

                jsonLog('error', '[resend-verification] app.sendEmail returned error', { details: errObj })
                return NextResponse.json({ success: false, error: 'app.sendEmail returned error', details: errObj }, { status: 500 })
              }

              return NextResponse.json({ success: true, fallback: 'app.sendEmail.html', result: sendResult })
            } catch (fbErr: any) {
              const fbSerialized = serializeError(fbErr)
              console.error('[resend-verification] app.sendEmail (html) failed:', fbSerialized)
              // Try Resend fallback if configured
              try {
                if (process.env.RESEND_API_KEY) {
                  const rr = await sendVerificationEmailResend(emailChannel.value, callbackUrl)
                  console.log('[resend-verification] resend fallback result=', rr)
                  return NextResponse.json({ success: true, fallback: 'resend', result: rr })
                }
              } catch (rerr) {
                console.error('[resend-verification] resend fallback failed:', rerr)
              }

              return NextResponse.json({ success: false, error: 'emailChannel.sendVerificationEmail failed', details: { channelError: serialized, fallbackError: fbSerialized } }, { status: 500 })
            }
          }

          return NextResponse.json({ success: false, error: 'emailChannel.sendVerificationEmail failed', details: serialized }, { status: 500 })
        }
      }

      // Fallback: try server-side sendEmail on the app if available
      if (typeof (app as any).sendEmail === 'function') {
        try {
          // Best-effort: pass variables that common templates expect and include explicit callbackUrl
          const payload = {
            to: emailChannel.value,
            userId: stackUser.id,
            templateId: 'email_verification',
            variables: { url: callbackUrl },
            callbackUrl,
          }
          console.log('[resend-verification] calling app.sendEmail with payload:', { to: payload.to, templateId: payload.templateId })
          const result = await (app as any).sendEmail(payload)
          jsonLog('info', '[resend-verification] app.sendEmail result=', { result })
          if (result && (result as any).status === 'error') {
            const errObj = (result as any).error || {}
            const code = errObj.code || errObj?.code
            jsonLog('error', '[resend-verification] app.sendEmail (template) returned error', { code, error: errObj })
            // Try Resend fallback for known issues
            if (process.env.RESEND_API_KEY) {
              const rr = await sendVerificationEmailResend(emailChannel.value, callbackUrl)
              jsonLog('info', '[resend-verification] resend fallback result=', { result: rr })
              return NextResponse.json({ success: true, fallback: 'resend', result: rr })
            }
            return NextResponse.json({ success: false, error: 'app.sendEmail failed', details: errObj }, { status: 500 })
          }

          return NextResponse.json({ success: true, result })
        } catch (sendErr: any) {
          const serialized = serializeError(sendErr)
          console.error('[resend-verification] app.sendEmail failed:', serialized)
          return NextResponse.json({ success: false, error: 'app.sendEmail failed', details: serialized }, { status: 500 })
        }
      }

      console.error('[resend-verification] No send API available on Stack SDK (neither channel nor app.sendEmail)')
      return NextResponse.json({ success: false, error: 'No server-side send API available on Stack SDK' }, { status: 500 })
    } catch (e: any) {
      const serialized = serializeError(e)
      console.error('[resend-verification] Server resend verification error:', serialized)
      return NextResponse.json({ success: false, error: serialized?.message || String(serialized), details: serialized }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[resend-verification] Resend verification endpoint error:', error)
    return NextResponse.json({ success: false, error: error?.message || String(error), stack: error?.stack }, { status: 500 })
  }
}
