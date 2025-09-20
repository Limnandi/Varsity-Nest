import { NextRequest } from "next/server"
import crypto from "crypto"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"

function verifySignature(rawBody: string, secret: string, signature: string | null): boolean {
  if (!signature) return false
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  // Support signatures like "sha256=..." or raw hex
  const normalized = signature.startsWith('sha256=') ? signature.slice(7) : signature
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(normalized))
}

export async function POST(request: NextRequest) {
  try {
    const { env } = await import('@/lib/env')
    const secret = process.env.STACK_WEBHOOK_SECRET || env.STACK_SECRET_SERVER_KEY || ''
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
      const [existing] = await secureDb.db
        .select({ id: schema.webhookEvents.id })
        .from(schema.webhookEvents)
        .where(eq(schema.webhookEvents.id, eventId))
        .limit(1)
      
      if (existing) {
        return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
      }
      
      await secureDb.db
        .insert(schema.webhookEvents)
        .values({ id: eventId })
        .onConflictDoNothing()
    }

    switch (event.type) {
      case 'user.created': {
        const { id, primaryEmail, firstName, lastName } = event.data || {}
        
        if (!id || !primaryEmail) {
          console.error(' Invalid user.created event: missing id or email', { id, primaryEmail, firstName, lastName })
          break
        }

        try {
          // Determine role based on email domain and admin emails
          let role = 'student' // default for student domains
          
          // Check if it's an admin email
          const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
          if (adminEmails.includes(primaryEmail.toLowerCase())) {
            role = 'admin'
            console.log(` Admin user created: ${primaryEmail}`)
          }
          // Check if it's a provider email (non-student domain)
          else if (!primaryEmail.includes('@ufs4life.ac.za') && !primaryEmail.includes('@cut.ac.za')) {
            role = 'provider'
            console.log(` Provider user created: ${primaryEmail}`)
          }
          // Student domains (@ufs4life.ac.za, @cut.ac.za) get 'student' role by default
          else {
            console.log(` Student user created: ${primaryEmail}`)
          }
          
          // Insert user with proper column names and required fields
          await secureDb.db
            .insert(schema.users)
            .values({
              id,
              email: primaryEmail,
              password: 'stackauth', // Placeholder for StackAuth users
              firstName: firstName || '',
              lastName: lastName || '',
              role: role as any,
              emailVerified: false,
              isActive: true
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
          
          console.log(` User synced to database: ${id} (${primaryEmail}) with role: ${role}`)
        } catch (error) {
          console.error('Failed to sync user to database:', error)
          console.error('User data:', { id, primaryEmail, firstName, lastName })
          // Don't throw - we want to return 200 to StackAuth even if our sync fails
        }
        break
      }
      case 'user.verified': {
        const { id, primaryEmail } = event.data || {}
        if (id && primaryEmail) {
          try {
            await secureDb.db
              .update(schema.users)
              .set({ 
                emailVerified: true, 
                updatedAt: new Date() 
              })
              .where(eq(schema.users.id, id))
            console.log(` User email verified: ${id} (${primaryEmail})`)
          } catch (error) {
            console.error(' Failed to update email verification:', error)
          }
        }
        break
      }
      case 'user.updated': {
        const { id, primaryEmail, firstName, lastName, primaryEmailVerified } = event.data || {}
        if (id && primaryEmail) {
          try {
            // Update basic user info
            await secureDb.db
              .update(schema.users)
              .set({ 
                firstName: firstName || '', 
                lastName: lastName || '', 
                updatedAt: new Date() 
              })
              .where(eq(schema.users.id, id))
            
            // Check if email verification status changed
            if (primaryEmailVerified === true) {
              await secureDb.db
                .update(schema.users)
                .set({ 
                  emailVerified: true, 
                  updatedAt: new Date() 
                })
                .where(eq(schema.users.id, id))
              
              // Log the verification event
              await secureDb.db
                .insert(schema.adminActivities)
                .values({
                  activityType: 'email_verification_webhook',
                  message: `User ${primaryEmail} verified their email address via webhook`,
                  adminId: id
                })
              
              console.log(`User email verified via webhook: ${id} (${primaryEmail})`)
            }
            
            console.log(`User updated: ${id} (${primaryEmail})`)
          } catch (error) {
            console.error('Failed to update user:', error)
          }
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


