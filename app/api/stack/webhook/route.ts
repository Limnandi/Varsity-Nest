import { NextRequest } from "next/server"
import crypto from "crypto"
import { query } from "@/lib/database"

function verifySignature(rawBody: string, secret: string, signature: string | null): boolean {
  if (!signature) return false
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  // Support signatures like "sha256=..." or raw hex
  const normalized = signature.startsWith('sha256=') ? signature.slice(7) : signature
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(normalized))
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.STACK_WEBHOOK_SECRET || ''
    if (!secret) {
      return new Response('MISSING_SECRET', { status: 500, headers: { 'Content-Type': 'text/plain' } })
    }

    const raw = await request.text()
    // Prefer x-stack-auth header (present in local package types), fall back to others
    const sig = request.headers.get('x-stack-auth') || request.headers.get('x-stack-signature') || request.headers.get('authorization')

    if (!verifySignature(raw, secret, sig)) {
      return new Response('INVALID_SIGNATURE', { status: 401, headers: { 'Content-Type': 'text/plain' } })
    }

    const event = JSON.parse(raw)

    // Idempotency: skip if already processed
    const eventId: string | undefined = event?.id || event?.data?.id || undefined
    if (eventId) {
      const existing = await query`SELECT id FROM webhook_events WHERE id = ${eventId} LIMIT 1`
      if (existing.rows?.[0]) {
        return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
      }
      await query`INSERT INTO webhook_events (id) VALUES (${eventId}) ON CONFLICT (id) DO NOTHING`
    }

    switch (event.type) {
      case 'user.created': {
        const { id, primaryEmail, firstName, lastName } = event.data || {}
        if (primaryEmail) {
          // Determine role based on email domain and admin emails
          let role = 'student' // default for student domains
          
          // Check if it's an admin email
          const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
          if (adminEmails.includes(primaryEmail.toLowerCase())) {
            role = 'admin'
          }
          // Check if it's a provider email (non-student domain)
          else if (!primaryEmail.includes('@ufs4life.ac.za') && !primaryEmail.includes('@cut.ac.za')) {
            role = 'provider'
          }
          // Student domains (@ufs4life.ac.za, @cut.ac.za) get 'student' role by default
          
          await query`INSERT INTO users (email, password, first_name, last_name, role, email_verified, is_active)
            VALUES (${primaryEmail}, ${'stackauth'}, ${firstName || ''}, ${lastName || ''}, ${role}, false, true)
            ON CONFLICT (email) DO NOTHING`
        }
        break
      }
      case 'user.verified': {
        const { primaryEmail } = event.data || {}
        if (primaryEmail) {
          await query`UPDATE users SET email_verified = true, updated_at = NOW() WHERE email = ${primaryEmail}`
        }
        break
      }
      case 'user.updated': {
        const { primaryEmail, firstName, lastName } = event.data || {}
        if (primaryEmail) {
          await query`UPDATE users SET first_name = ${firstName || ''}, last_name = ${lastName || ''}, updated_at = NOW() WHERE email = ${primaryEmail}`
        }
        break
      }
      default:
        break
    }

    return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
  } catch (e) {
    console.error('Stack webhook error:', e)
    return new Response('ERROR', { status: 500, headers: { 'Content-Type': 'text/plain' } })
  }
}


