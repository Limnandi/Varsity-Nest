import { NextRequest } from 'next/server'
import { secureDb } from '@/lib/database-secure'
import * as schema from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { env } from '@/lib/env'
import crypto from 'crypto'

function verifySignature(rawBody: string, secret: string, signature: string | null): boolean {
  if (!signature) return false
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const normalized = signature.startsWith('sha256=') ? signature.slice(7) : signature
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(normalized))
  } catch (e) {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text()

    // Optional signature verification
    const secret = process.env.STACK_WEBHOOK_SECRET || (env as any).STACK_WEBHOOK_SECRET || (env as any).STACK_SECRET_SERVER_KEY || ''
    if (secret) {
      const sig = request.headers.get('x-stack-auth') || request.headers.get('x-stack-signature') || request.headers.get('authorization')
      if (!verifySignature(raw, secret, sig)) {
        console.warn('Stack webhook signature verification failed')
        return new Response('INVALID_SIGNATURE', { status: 401 })
      }
    }

    const event = JSON.parse(raw || '{}')

    // Idempotency via webhook_events table
    const eventId: string | undefined = event?.id || event?.data?.id || undefined
    if (eventId) {
      const [existing] = await secureDb.db
        .select({ id: schema.webhookEvents.id })
        .from(schema.webhookEvents)
        .where(eq(schema.webhookEvents.id, eventId))
        .limit(1)

      if (existing) {
        return new Response('OK', { status: 200 })
      }

      try {
        await secureDb.db.insert(schema.webhookEvents).values({ id: eventId }).onConflictDoNothing()
      } catch (e) {
        console.error('Failed to insert webhook event idempotency row:', e)
      }
    }

    switch (event.type) {
      case 'user.created': {
        const { id, primaryEmail, firstName, lastName } = event.data || {}
        if (!id || !primaryEmail) break

        try {
          const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
          let role: 'admin' | 'provider' | 'student' = 'student'
          if (adminEmails.includes(primaryEmail.toLowerCase())) role = 'admin'
          else if (!primaryEmail.includes('@ufs4life.ac.za') && !primaryEmail.includes('@cut.ac.za')) role = 'provider'

          await secureDb.db
            .insert(schema.users)
            .values({
              id,
              email: primaryEmail,
              password: 'stackauth',
              firstName: firstName || '',
              lastName: lastName || '',
              role: role as any,
              emailVerified: false,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .onConflictDoUpdate({
              target: schema.users.id,
              set: {
                email: primaryEmail,
                firstName: firstName || '',
                lastName: lastName || '',
                role: role as any,
                updatedAt: new Date()
              }
            })
        } catch (e) {
          console.error('Failed to sync user to database:', e)
        }
        break
      }
      case 'user.verified': {
        const { id } = event.data || {}
        if (id) {
          try {
            await secureDb.db.update(schema.users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(schema.users.id, id))
          } catch (e) {
            console.error('Failed to update emailVerified:', e)
          }
        }
        break
      }
      case 'user.updated': {
        const { id, primaryEmail, firstName, lastName, primaryEmailVerified } = event.data || {}
        if (id && primaryEmail) {
          try {
            await secureDb.db.update(schema.users).set({ firstName: firstName || '', lastName: lastName || '', updatedAt: new Date() }).where(eq(schema.users.id, id))
            if (primaryEmailVerified === true) {
              await secureDb.db.update(schema.users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(schema.users.id, id))
              await secureDb.db.insert(schema.adminActivities).values({ id: (await import('crypto')).randomUUID(), activityType: 'email_verification_webhook', message: `User ${primaryEmail} verified via webhook`, adminId: id }).onConflictDoNothing()
            }
          } catch (e) {
            console.error('Failed to update user via webhook:', e)
          }
        }
        break
      }
      default:
        break
    }

    return new Response('OK', { status: 200 })
  } catch (e) {
    console.error('Stack webhook error:', e)
    return new Response('ERROR', { status: 500 })
  }
}


