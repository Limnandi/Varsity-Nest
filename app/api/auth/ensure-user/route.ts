import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import * as schema from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getStackServerApp } from "@/lib/stack"

function inferRoleFromEmail(email: string): 'student' | 'provider' | 'admin' {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const lower = email.toLowerCase()
  if (adminEmails.includes(lower)) return 'admin'
  if (lower.endsWith('@ufs4life.ac.za') || lower.endsWith('@cut.ac.za')) return 'student'
  return 'provider'
}

function splitFullName(fullName?: string): { firstName: string; lastName: string } {
  const safe = (fullName || '').trim().replace(/\s+/g, ' ')
  if (!safe) return { firstName: '', lastName: '' }
  const parts = safe.split(' ')
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      fullName, 
      firstName: providedFirstName, 
      lastName: providedLastName,
      cellNumber,
      studentNumber,
      university
    } = await request.json()
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }
    
    // Validate required fields for students
    if (!studentNumber || !university) {
      return NextResponse.json({ 
        error: 'studentNumber and university are required for student registration' 
      }, { status: 400 })
    }
    const app = getStackServerApp()

    const stackUser = await app.getUser(userId)
    if (!stackUser?.id || !stackUser.primaryEmail) {
      return NextResponse.json({ error: 'User not found in StackAuth' }, { status: 404 })
    }

    const role = inferRoleFromEmail(stackUser.primaryEmail)
    // Determine names with precedence: explicit body -> fullName -> StackAuth fields -> displayName -> email local-part
    let firstName = (providedFirstName as string | undefined) || ''
    let lastName = (providedLastName as string | undefined) || ''
    if (!firstName && !lastName && typeof fullName === 'string') {
      const split = splitFullName(fullName)
      firstName = split.firstName
      lastName = split.lastName
    }
    if (!firstName && !(stackUser as any).firstName && (stackUser as any).displayName) {
      const split = splitFullName((stackUser as any).displayName)
      firstName = firstName || split.firstName
      lastName = lastName || split.lastName
    }
    firstName = firstName || (stackUser as any).firstName || (stackUser as any).givenName || ''
    lastName = lastName || (stackUser as any).lastName || (stackUser as any).familyName || ''
    if (!firstName && !lastName) {
      const localPart = stackUser.primaryEmail.split('@')[0]
      const split = splitFullName(localPart.replace(/[._-]+/g, ' '))
      firstName = split.firstName
      lastName = split.lastName
    }

    // Upsert into users table
    const existing = await secureDb.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, stackUser.id))
      .limit(1)

    if (existing && existing.length > 0) {
      await secureDb.db
        .update(schema.users)
        .set({
          email: stackUser.primaryEmail,
          firstName: firstName,
          lastName: lastName,
          role: role as any,
          phone: cellNumber,
          studentNumber: studentNumber,
          institution: university,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, stackUser.id))
    } else {
      await secureDb.db
        .insert(schema.users)
        .values({
          id: stackUser.id,
          email: stackUser.primaryEmail,
          password: 'stackauth',
          firstName: firstName,
          lastName: lastName,
          role: role as any,
          phone: cellNumber,
          studentNumber: studentNumber,
          institution: university,
          emailVerified: !!stackUser.primaryEmailVerified,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.users.id,
          set: {
            email: stackUser.primaryEmail,
            firstName: firstName,
            lastName: lastName,
            role: role as any,
            phone: cellNumber,
            studentNumber: studentNumber,
            institution: university,
            updatedAt: new Date(),
          }
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ensure-user error', error)
    return NextResponse.json({ error: 'Failed to ensure user in database' }, { status: 500 })
  }
}


