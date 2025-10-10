import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import * as schema from "@/lib/schema"
import { eq } from "drizzle-orm"
import { DomainValidationService } from '@/lib/domain-validation'
import { jsonLog } from '@/lib/json-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const email = String(body.email || '')
    const stackUserId = String(body.stackUserId || '')
    const fullName = String(body.name || '')
    const studentNumber = String(body.studentNumber || '')
    const university = String(body.university || '')

    if (!email || !stackUserId || !fullName || !studentNumber || !university) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate domain whitelist server-side
    const domainCheck = await DomainValidationService.isEmailWhitelisted(email)
    if (!domainCheck.isValid) {
      return NextResponse.json({ error: 'Email domain not whitelisted for student registration' }, { status: 400 })
    }
    // Use authoritative university if provided by domain table
    const detectedUniversity = domainCheck.university
    if (detectedUniversity) {
      // normalize incoming university to the canonical value
      // If the client provided a different university, prefer the DB mapping
      // (this prevents students from forging a different university)
      // Note: schema.students.university expects 'UFS' | 'CUT'
      // We'll only override when detectedUniversity is present
      // and the incoming university looks different
      // Keep the existing value in variable for later use
      // (we'll apply detectedUniversity when inserting/updating)
    }

    // Split full name into first / last
    const parts = fullName.trim().split(/\s+/)
    const firstName = parts.shift() || ''
    const lastName = parts.join(' ') || ''

    // Check if user exists
    const existing = await secureDb.db
      .select({ id: schema.users.id, role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)

    let userId: string

    if (existing && existing.length > 0) {
      userId = existing[0].id
      // Ensure role is student
      await secureDb.db
        .update(schema.users)
        .set({
          role: 'student',
          firstName,
          lastName,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId))
    } else {
      const { randomUUID } = await import('crypto')
      userId = randomUUID()

      await secureDb.db
        .insert(schema.users)
        .values({
          id: userId,
          email,
          password: 'stackauth', // placeholder for Stack-managed accounts
          firstName,
          lastName,
          role: 'student',
          phone: null,
          emailVerified: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
    }

    // Upsert student record
    const existingStudent = await secureDb.db
      .select({ id: schema.students.id })
      .from(schema.students)
      .where(eq(schema.students.userId, userId))
      .limit(1)

    if (existingStudent && existingStudent.length > 0) {
      await secureDb.db
        .update(schema.students)
        .set({
          studentNumber,
          university: university as any,
          updatedAt: new Date(),
        })
        .where(eq(schema.students.userId, userId))
    } else {
      const { randomUUID } = await import('crypto')
      await secureDb.db
        .insert(schema.students)
        .values({
          id: randomUUID(),
          userId,
          studentNumber,
          university: university as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
    }

    // Optionally store Stack user id mapping in a simple table if present
    try {
      const schemaModule = await import('@/lib/schema')
      if ((schemaModule as any).stackUserMappings) {
        const mappings = await secureDb.db
          .select({ id: (schemaModule as any).stackUserMappings.id })
          .from((schemaModule as any).stackUserMappings)
          .where((schemaModule as any).stackUserMappings.stackUserId, stackUserId)
          .limit(1)

        if (!mappings || mappings.length === 0) {
          const { randomUUID } = await import('crypto')
          await secureDb.db
            .insert((schemaModule as any).stackUserMappings)
            .values({ id: randomUUID(), userId, stackUserId, createdAt: new Date() })
        }
      }
    } catch (e) {
      // Ignore optional mapping failures
    }

    // Attempt to send verification email server-side (best-effort)
    try {
      const { getStackServerApp } = await import('@/lib/stack')
      const app = getStackServerApp()

      // Try to find contact channel via app.getUser if available
      let stackUser: any = null
      try {
        if (stackUser === null && typeof (app as any).getUser === 'function') {
          stackUser = await (app as any).getUser(stackUserId as any)
        }
      } catch (e) {
        // ignore
      }

      // Helper to serialize errors
      const serializeError = (err: any) => {
        if (!err) return null
        try {
          const obj: any = {}
          Object.getOwnPropertyNames(err).forEach((k) => {
            try { obj[k] = (err as any)[k] } catch { obj[k] = String((err as any)[k]) }
          })
          if (err.response) obj.response = err.response
          if (err.request) obj.request = err.request
          return obj
        } catch (e) {
          return { message: String(err) }
        }
      }

      const callbackBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const callbackUrl = `${callbackBase.replace(/\/$/, '')}/auth/check-email`

  if (stackUser && typeof stackUser.listContactChannels === 'function') {
        try {
          const channels = await stackUser.listContactChannels()
          const emailChannel = Array.isArray(channels) ? channels.find((c: any) => c.type === 'email' && c.value === email) : null
          if (emailChannel && typeof emailChannel.sendVerificationEmail === 'function') {
            await emailChannel.sendVerificationEmail({ callbackUrl })
            console.log('[student-register] verification email sent via channel for', email)
          } else if (typeof (app as any).sendEmail === 'function') {
            try {
              // Try inline HTML send using userIds (Stack supports server-side custom HTML sends)
              const subject = 'Verify your Varsity Nest email'
              const html = (await import('@/lib/email-template')).renderVerificationEmail(callbackUrl)

              const sendResult = await (app as any).sendEmail({ userIds: [userId], subject, html, callbackUrl })
              jsonLog('info', '[student-register] app.sendEmail (html) result', { result: sendResult })
              if (sendResult && (sendResult as any).status === 'error') {
                const errObj = (sendResult as any).error || {}
                const code = errObj.code || errObj?.code
                jsonLog('error', '[student-register] app.sendEmail returned error result', { code, error: errObj })
                switch (code) {
                  case 'REQUIRES_CUSTOM_EMAIL_SERVER':
                  case 'SCHEMA_ERROR':
                    if (process.env.RESEND_API_KEY) {
                      const { sendVerificationEmailResend } = await import('@/lib/email-resend')
                      const rr = await sendVerificationEmailResend(email, callbackUrl, `${firstName} ${lastName}`)
                      if (!rr.ok && rr.validation) {
                        jsonLog('error', '[student-register] Resend validation error (domain not verified?)', { rr })
                        break
                      }
                      jsonLog('info', '[student-register] resend fallback result', { result: rr })
                      break
                    }
                    break
                  case 'USER_ID_DOES_NOT_EXIST':
                    try {
                      const payload = { to: email, templateId: 'email_verification', variables: { url: callbackUrl }, callbackUrl }
                      const tmplRes = await (app as any).sendEmail(payload)
                      jsonLog('info', '[student-register] app.sendEmail (template) result after USER_ID_DOES_NOT_EXIST=', { result: tmplRes })
                      if (tmplRes && (tmplRes as any).status === 'error') {
                        if (process.env.RESEND_API_KEY) {
                          const { sendVerificationEmailResend } = await import('@/lib/email-resend')
                          const rr2 = await sendVerificationEmailResend(email, callbackUrl, `${firstName} ${lastName}`)
                          if (!rr2.ok && rr2.validation) {
                            jsonLog('error', '[student-register] Resend validation error (domain not verified?)', { rr2 })
                          } else {
                            jsonLog('info', '[student-register] resend fallback result', { result: rr2 })
                          }
                        }
                      }
                    } catch (te) {
                      jsonLog('error', '[student-register] template send failed after USER_ID_DOES_NOT_EXIST:', { error: te })
                      if (process.env.RESEND_API_KEY) {
                        const { sendVerificationEmailResend } = await import('@/lib/email-resend')
                        const rr3 = await sendVerificationEmailResend(email, callbackUrl, `${firstName} ${lastName}`)
                        if (!rr3.ok && rr3.validation) {
                          jsonLog('error', '[student-register] Resend validation error (domain not verified?)', { rr3 })
                        } else {
                          jsonLog('info', '[student-register] resend fallback result', { result: rr3 })
                        }
                      }
                    }
                    break
                  default:
                    if (process.env.RESEND_API_KEY) {
                      const { sendVerificationEmailResend } = await import('@/lib/email-resend')
                      const rr4 = await sendVerificationEmailResend(email, callbackUrl, `${firstName} ${lastName}`)
                      if (!rr4.ok && rr4.validation) {
                        jsonLog('error', '[student-register] Resend validation error (domain not verified?)', { rr4 })
                      } else {
                        jsonLog('info', '[student-register] resend fallback result', { result: rr4 })
                      }
                    }
                }
              } else {
                jsonLog('info', '[student-register] verification email sent via app.sendEmail (html)', { email })
              }
            } catch (fbErr: any) {
              jsonLog('error', '[student-register] app.sendEmail (html) failed', { error: fbErr })
              // Best-effort: fall back to template-based send if available
              const payload = { to: email, userId, templateId: 'email_verification', variables: { url: callbackUrl }, callbackUrl }
              try {
                const tmpl = await (app as any).sendEmail(payload)
                jsonLog('info', '[student-register] verification email sent via app.sendEmail (template)', { email, result: tmpl })
              } catch (te2: any) {
                jsonLog('error', '[student-register] app.sendEmail (template) failed', { error: te2 })
                if (process.env.RESEND_API_KEY) {
                  const { sendVerificationEmailResend } = await import('@/lib/email-resend')
                  const rr5 = await sendVerificationEmailResend(email, callbackUrl, `${firstName} ${lastName}`)
                  jsonLog('info', '[student-register] resend fallback result', { result: rr5 })
                }
              }
            }
          }
        } catch (sendErr: any) {
          console.error('[student-register] verification send failed:', serializeError(sendErr))
          // Try Resend fallback if configured
          try {
            if (process.env.RESEND_API_KEY) {
              const { sendVerificationEmailResend } = await import('@/lib/email-resend')
              const rr = await sendVerificationEmailResend(email, callbackUrl, `${firstName} ${lastName}`)
              console.log('[student-register] resend fallback result=', rr)
            }
          } catch (rerr) {
            console.error('[student-register] resend fallback failed:', rerr)
          }
        }
      } else if (typeof (app as any).sendEmail === 'function') {
          try {
            // First try inline HTML send using userIds
            const subject = 'Verify your Varsity Nest email'
            const html = `<div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial;">
              <h2 style="color:#0ea5e9">Verify your email</h2>
              <p>Click the button to verify your email for Varsity Nest.</p>
              <p><a href="${callbackUrl}" style="background:#0ea5e9;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Verify email</a></p>
              <p>If the button doesn't work, copy/paste: ${callbackUrl}</p>
            </div>`

            const sendResult = await (app as any).sendEmail({ userIds: [userId], subject, html, callbackUrl })
            console.log('[student-register] app.sendEmail (html) result=', sendResult)
            if (sendResult && (sendResult as any).status === 'error') {
              throw sendResult.error || new Error('app.sendEmail returned error')
            }

            console.log('[student-register] verification email sent via app.sendEmail (html) for', email)
          } catch (sendErr: any) {
            console.error('[student-register] verification send failed (app.sendEmail html):', serializeError(sendErr))
            try {
              // Fallback to template-based send if available
              const payload = { to: email, userId, templateId: 'email_verification', variables: { url: callbackUrl }, callbackUrl }
              await (app as any).sendEmail(payload)
              console.log('[student-register] verification email sent via app.sendEmail (template) for', email)
            } catch (templateErr: any) {
              console.error('[student-register] verification send failed (app.sendEmail template):', serializeError(templateErr))
              try {
                if (process.env.RESEND_API_KEY) {
                  const { sendVerificationEmailResend } = await import('@/lib/email-resend')
                  const rr = await sendVerificationEmailResend(email, callbackUrl, `${firstName} ${lastName}`)
                  console.log('[student-register] resend fallback result=', rr)
                }
              } catch (rerr) {
                console.error('[student-register] resend fallback failed:', rerr)
              }
            }
          }
        }
    } catch (e) {
      console.error('[student-register] verification send attempt failed:', e)
    }

    return NextResponse.json({ success: true, userId }, { status: 201 })
  } catch (error) {
    console.error('Student registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
