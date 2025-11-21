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
          // Role assignment logic:
          // - Only set 'admin' if email is in admin list
          // - For all others, set temporary 'provider' role (required field)
          // - Registration endpoints (/api/auth/register or /api/auth/ensure-user) will set the correct role
          //   based on which registration page was used (agent, provider, or student)
          let role: 'admin' | 'provider' | 'student' | 'agent' = 'provider'
          
          // Check if it's an admin email
          const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
          if (adminEmails.includes(primaryEmail.toLowerCase())) {
            role = 'admin'
            console.log(` Admin user created: ${primaryEmail}`)
          } else {
            // Temporary role - will be overridden by registration endpoint based on which page was used
            role = 'provider'
            console.log(` User created (temporary role, will be set by registration endpoint): ${primaryEmail}`)
          }
          
          // Check if user exists by email with different ID
          const [existingByEmail] = await secureDb.db
            .select({ id: schema.users.id })
            .from(schema.users)
            .where(eq(schema.users.email, primaryEmail))
            .limit(1)
          
          if (existingByEmail && existingByEmail.id !== id) {
            console.warn(` Email ${primaryEmail} exists with different ID. Deleting old ID: ${existingByEmail.id}, using StackAuth ID: ${id}`)
            await secureDb.db
              .delete(schema.users)
              .where(eq(schema.users.id, existingByEmail.id))
          }
          
          // Check if user exists by ID
          const [existingById] = await secureDb.db
            .select({ id: schema.users.id })
            .from(schema.users)
            .where(eq(schema.users.id, id))
            .limit(1)
          
          if (existingById) {
            // Update existing user
            await secureDb.db
              .update(schema.users)
              .set({
                email: primaryEmail,
                firstName: firstName || '',
                lastName: lastName || '',
                role: role as any,
                updatedAt: new Date()
              })
              .where(eq(schema.users.id, id))
            console.log(` User updated in database: ${id} (${primaryEmail})`)
          } else {
            // Insert new user
            await secureDb.db
              .insert(schema.users)
              .values({
                id,
                email: primaryEmail,
                password: 'stackauth',
                firstName: firstName || '',
                lastName: lastName || '',
                role: role as any,
                phone: null,
                studentNumber: null,
                institution: null,
                emailVerified: false,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
              })
            console.log(` User created in database: ${id} (${primaryEmail}) with role: ${role}`)
          }
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


