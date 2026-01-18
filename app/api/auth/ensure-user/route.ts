import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import * as schema from "@/lib/schema"
import { eq, and, ne } from "drizzle-orm"
import { getStackServerApp } from "@/lib/stack"
import { DomainValidationService } from "@/lib/domain-validation"
import { randomUUID } from "crypto"

function splitFullName(fullName?: string): { firstName: string; lastName: string } {
  const safe = (fullName || '').trim().replace(/\s+/g, ' ')
  if (!safe) return { firstName: '', lastName: '' }
  const parts = safe.split(' ')
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export async function POST(request: NextRequest) {
  try {
    // Safely parse JSON body - handle empty or malformed requests
    let body
    try {
      const text = await request.text()
      if (!text || text.trim() === '') {
        return NextResponse.json({ error: 'Request body is required' }, { status: 400 })
      }
      body = JSON.parse(text)
    } catch (parseError) {
      console.error('ensure-user JSON parse error:', parseError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { 
      userId, 
      fullName, 
      firstName: providedFirstName, 
      lastName: providedLastName,
      cellNumber,
      studentNumber,
      university
    } = body

    console.log('ensure-user received:', { userId, fullName, providedFirstName, providedLastName, cellNumber, studentNumber, university })

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }
    
    const app = getStackServerApp()

    const stackUser = await app.getUser(userId)
    if (!stackUser?.id || !stackUser.primaryEmail) {
      return NextResponse.json({ error: 'User not found in StackAuth' }, { status: 404 })
    }

    // Role assignment logic:
    // - This endpoint is called from student registration page
    // - Always set role to 'student' since this endpoint is only for student registration
    let role: 'student' | 'provider' | 'admin' | 'agent' = 'student'
    
    // Validate that studentNumber and university are provided (required for students)
    if (!studentNumber) {
      return NextResponse.json({ 
        error: 'Student number is required for student registration.' 
      }, { status: 400 })
    }
    
    if (!university) {
      console.error('ensure-user: University is missing from request body', { userId, studentNumber, university })
      return NextResponse.json({ 
        error: 'University is required for student registration. Please ensure your email domain is whitelisted.' 
      }, { status: 400 })
    }

    // Validate domain
    const domainValidation = await DomainValidationService.isEmailWhitelisted(stackUser.primaryEmail)
    console.log('Domain validation result:', domainValidation)
    if (!domainValidation.isValid) {
      return NextResponse.json({ 
        error: 'Email domain not whitelisted for student registration. Please use a valid university email address.' 
      }, { status: 403 })
    }

    console.log('Assigned role: student')
    
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

    // Check if user exists by email with different ID (clean up old records)
    const [existingByEmail] = await secureDb.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, stackUser.primaryEmail))
      .limit(1)
    
    if (existingByEmail && existingByEmail.id !== stackUser.id) {
      console.warn(`Email ${stackUser.primaryEmail} exists with different ID. Deleting old ID: ${existingByEmail.id}, using StackAuth ID: ${stackUser.id}`)
      await secureDb.db
        .delete(schema.users)
        .where(eq(schema.users.id, existingByEmail.id))
    }
    
    // Upsert into users table
    const [existingUser] = await secureDb.db
      .select({ id: schema.users.id, role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, stackUser.id))
      .limit(1)

    if (existingUser) {
      // If user exists, preserve admin role, otherwise update to determined role
      // This endpoint is specifically for student registration, so always set role to 'student'
      // unless the user is already an admin (admin role takes precedence)
      const finalRole = existingUser.role === 'admin' ? 'admin' : role
      
      // Log role change if it's different from current role
      if (existingUser.role !== finalRole && existingUser.role !== 'admin') {
        console.log(`ensure-user: Updating role from '${existingUser.role}' to '${finalRole}' for user ${stackUser.id}`)
      } else {
        console.log(`ensure-user: User ${stackUser.id} exists with role '${existingUser.role}', final role will be '${finalRole}'`)
      }
      
      try {
        await secureDb.db
          .update(schema.users)
          .set({
            email: stackUser.primaryEmail,
            firstName: firstName,
            lastName: lastName,
            role: finalRole as any,
            phone: cellNumber,
            studentNumber: finalRole === 'student' ? studentNumber : null,
            institution: finalRole === 'student' ? university : null,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, stackUser.id))
        
        console.log(`ensure-user: User update completed for ${stackUser.id}`)
      } catch (updateError) {
        console.error(`ensure-user: Failed to update user ${stackUser.id}:`, updateError)
        throw updateError
      }
      
      // Verify role was set correctly
      const [verifiedUser] = await secureDb.db
        .select({ role: schema.users.role, email: schema.users.email })
        .from(schema.users)
        .where(eq(schema.users.id, stackUser.id))
        .limit(1)
      
      if (!verifiedUser) {
        console.error(`CRITICAL: User ${stackUser.id} was not found in database after update!`)
      } else if (verifiedUser.role !== finalRole) {
        console.error(`CRITICAL: Role mismatch in ensure-user! Expected: ${finalRole}, Got: ${verifiedUser?.role}`)
      } else {
        console.log(`VERIFIED: Student user role set correctly: ${finalRole}, email: ${verifiedUser.email}`)
      }
    } else {
      console.log(`ensure-user: Creating new user in database with ID: ${stackUser.id}, email: ${stackUser.primaryEmail}, role: ${role}`)
      
      try {
        const [insertedUser] = await secureDb.db
          .insert(schema.users)
          .values({
            id: stackUser.id,
            email: stackUser.primaryEmail,
            password: 'stackauth',
            firstName: firstName,
            lastName: lastName,
            role: role as any,
            phone: cellNumber,
            studentNumber: role === 'student' ? studentNumber : null,
            institution: role === 'student' ? university : null,
            emailVerified: !!stackUser.primaryEmailVerified,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()
        
        if (!insertedUser) {
          throw new Error('User insert returned no data - insert may have failed')
        }
        
        console.log(`ensure-user: User insert completed for ${stackUser.id}, inserted user:`, {
          id: insertedUser.id,
          email: insertedUser.email,
          role: insertedUser.role
        })
      } catch (insertError: any) {
        console.error(`ensure-user: Failed to insert user ${stackUser.id}:`, insertError)
        console.error(`ensure-user: Error details:`, {
          code: insertError?.code,
          message: insertError?.message,
          detail: insertError?.detail,
          constraint: insertError?.constraint
        })
        
        // If it's a duplicate key error, the user might have been created by webhook
        if (insertError?.code === '23505' || insertError?.message?.includes('duplicate') || insertError?.message?.includes('unique') || insertError?.constraint) {
          console.log(`ensure-user: User ${stackUser.id} already exists (likely created by webhook), updating instead`)
          // User was created by webhook, update it instead
          const finalRole = role
          const [updatedUser] = await secureDb.db
            .update(schema.users)
            .set({
              email: stackUser.primaryEmail,
              firstName: firstName,
              lastName: lastName,
              role: finalRole as any,
              phone: cellNumber,
              studentNumber: finalRole === 'student' ? studentNumber : null,
              institution: finalRole === 'student' ? university : null,
              updatedAt: new Date(),
            })
            .where(eq(schema.users.id, stackUser.id))
            .returning()
          
          if (!updatedUser) {
            throw new Error(`Failed to update user ${stackUser.id} - user may not exist in database`)
          }
          
          console.log(`ensure-user: User updated successfully:`, {
            id: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role
          })
        } else {
          // Re-throw the error so it's properly handled
          throw insertError
        }
      }
      
      // Verify role was set correctly
      const [verifiedUser] = await secureDb.db
        .select({ role: schema.users.role, email: schema.users.email })
        .from(schema.users)
        .where(eq(schema.users.id, stackUser.id))
        .limit(1)
      
      if (!verifiedUser) {
        console.error(`CRITICAL: User ${stackUser.id} was not found in database after insert/update!`)
      } else if (verifiedUser.role !== role) {
        console.error(`CRITICAL: Role mismatch in ensure-user insert! Expected: ${role}, Got: ${verifiedUser?.role}`)
      } else {
        console.log(`VERIFIED: Student user created with correct role: ${role}, email: ${verifiedUser.email}`)
      }
    }

    // Create student record if role is student
    // IMPORTANT: Only create student record if user exists in users table
    if (role === 'student') {
      // Verify user exists before creating student record
      const [userCheck] = await secureDb.db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.id, stackUser.id))
        .limit(1)
      
      if (!userCheck) {
        console.error(`CRITICAL: Cannot create student record - user ${stackUser.id} does not exist in users table!`)
        return NextResponse.json({ 
          error: 'User was not created in database',
          details: 'Failed to create user record. Student record cannot be created without a user record.'
        }, { status: 500 })
      }
      
      console.log(`ensure-user: User ${stackUser.id} confirmed in database, proceeding with student record creation`)
      
      const existingStudent = await secureDb.db
        .select({ 
          id: schema.students.id,
          studentNumber: schema.students.studentNumber,
          university: schema.students.university
        })
        .from(schema.students)
        .where(eq(schema.students.userId, stackUser.id))
        .limit(1)

      if (existingStudent.length === 0) {
        // Check if student_number/university combination already exists for another student
        const conflictingStudent = await secureDb.db
          .select({ id: schema.students.id })
          .from(schema.students)
          .where(
            and(
              eq(schema.students.studentNumber, studentNumber),
              eq(schema.students.university, university as 'UFS' | 'CUT')
            )
          )
          .limit(1)

        if (conflictingStudent.length > 0) {
          console.warn(`Student number ${studentNumber} for ${university} already exists for another student. Skipping insert.`)
          // Don't insert if it would violate unique constraint
          // The user record is already created, so we'll just skip the student record
        } else {
          try {
            const [insertedStudent] = await secureDb.db
              .insert(schema.students)
              .values({
                id: randomUUID(),
                userId: stackUser.id,
                studentNumber: studentNumber,
                university: university as 'UFS' | 'CUT',
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning()
            
            if (!insertedStudent) {
              console.error(`CRITICAL: Student record insert returned no data for user ${stackUser.id}`)
            } else {
              console.log(`ensure-user: Student record created successfully:`, {
                id: insertedStudent.id,
                userId: insertedStudent.userId,
                studentNumber: insertedStudent.studentNumber,
                university: insertedStudent.university
              })
            }
          } catch (studentInsertError: any) {
            console.error(`ensure-user: Failed to insert student record for user ${stackUser.id}:`, studentInsertError)
            console.error(`ensure-user: Student insert error details:`, {
              code: studentInsertError?.code,
              message: studentInsertError?.message,
              detail: studentInsertError?.detail,
              constraint: studentInsertError?.constraint
            })
            // Don't throw - user record is more important than student record
            // Student record can be created later if needed
          }
        }
      } else {
        const currentStudent = existingStudent[0]
        // Only update if values have changed
        const valuesChanged = 
          currentStudent.studentNumber !== studentNumber || 
          currentStudent.university !== university

        if (valuesChanged) {
          // Check if the new student_number/university combination already exists for another student
          const conflictingStudent = await secureDb.db
            .select({ id: schema.students.id })
            .from(schema.students)
            .where(
              and(
                eq(schema.students.studentNumber, studentNumber),
                eq(schema.students.university, university as 'UFS' | 'CUT'),
                ne(schema.students.userId, stackUser.id)
              )
            )
            .limit(1)

          if (conflictingStudent.length > 0) {
            console.warn(`Student number ${studentNumber} for ${university} already exists for another student. Skipping update.`)
            // Don't update if it would violate unique constraint
            // Just update the timestamp to indicate we tried
            await secureDb.db
              .update(schema.students)
              .set({
                updatedAt: new Date(),
              })
              .where(eq(schema.students.userId, stackUser.id))
      } else {
            // Safe to update
        await secureDb.db
          .update(schema.students)
          .set({
            studentNumber: studentNumber,
            university: university as 'UFS' | 'CUT',
            updatedAt: new Date(),
          })
          .where(eq(schema.students.userId, stackUser.id))
          }
        } else {
          // Values haven't changed, just update timestamp
          await secureDb.db
            .update(schema.students)
            .set({
              updatedAt: new Date(),
            })
            .where(eq(schema.students.userId, stackUser.id))
        }
      }
    }

    // Final verification - check that user exists in database with correct role
    const [finalCheck] = await secureDb.db
      .select({ 
        id: schema.users.id, 
        email: schema.users.email, 
        role: schema.users.role,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName
      })
      .from(schema.users)
      .where(eq(schema.users.id, stackUser.id))
      .limit(1)
    
    if (!finalCheck) {
      console.error(`CRITICAL: User ${stackUser.id} does not exist in database after ensure-user completion!`)
      return NextResponse.json({ 
        error: 'User was not created in database',
        details: 'Please try again or contact support'
      }, { status: 500 })
    }
    
    if (finalCheck.role !== role) {
      console.error(`CRITICAL: Final check - User ${stackUser.id} has wrong role! Expected: ${role}, Got: ${finalCheck.role}`)
      return NextResponse.json({ 
        error: 'Role was not set correctly',
        details: `Expected role: ${role}, but got: ${finalCheck.role}. Please contact support.`
      }, { status: 500 })
    }
    
    console.log(`ensure-user: SUCCESS - User ${stackUser.id} (${finalCheck.email}) created/updated with role '${finalCheck.role}'`)
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: finalCheck.id,
        email: finalCheck.email,
        role: finalCheck.role,
        firstName: finalCheck.firstName,
        lastName: finalCheck.lastName
      }
    })
  } catch (error) {
    console.error('ensure-user error', error)
    return NextResponse.json({ 
      error: 'Failed to ensure user in database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


