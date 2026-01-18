import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { providerFormDataSchema, validateRequest } from "@/lib/validation-schemas"
import { getStackServerApp } from "@/lib/stack"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    console.log('Registration request received with content-type:', contentType)

    if (contentType.includes('multipart/form-data')) {
      // Provider registration documents and DB linkage after client StackAuth signup
      const form = await request.formData()
      
      // Get userId from form data (passed from client after StackAuth signup)
      const userId = String(form.get('userId') || '')
      
      if (!userId) {
        return NextResponse.json({ 
          error: 'User ID required',
          details: 'User ID must be provided from StackAuth signup.'
        }, { status: 400 })
      }
      
      // Validate and sanitize form data
      const formData = {
        email: String(form.get('email') || ''),
        firstName: String(form.get('firstName') || ''),
        lastName: String(form.get('lastName') || ''),
        phone: String(form.get('phone') || ''),
        companyName: String(form.get('institution') || ''),
        address: String(form.get('address') || 'Not provided'),
        description: String(form.get('description') || 'Provider registration pending details'),
        website: String(form.get('website') || ''),
        referralCode: String(form.get('referralCode') || '').trim() || undefined
      }

      // Validate the form data (make address and description optional for now)
      const validation = validateRequest(providerFormDataSchema, formData)
      if (!validation.success) {
        console.error('Validation errors:', validation.errors)
        return NextResponse.json(
          { error: 'Invalid form data', details: validation.errors },
          { status: 400 }
        )
      }

      const { email, firstName, lastName, phone, companyName, address } = validation.data
      
      console.log(`Provider registration - StackAuth user ID from client: ${userId}`)
      
      // Verify the userId exists in StackAuth
      const app = getStackServerApp()
      let stackUser
      try {
        stackUser = await app.getUser(userId)
        if (!stackUser) {
          return NextResponse.json({ 
            error: 'Invalid user',
            details: 'User not found in StackAuth.'
          }, { status: 404 })
        }
        console.log(`Provider registration - Verified StackAuth user: ${stackUser.id} (${stackUser.primaryEmail})`)
      } catch (error) {
        console.error('Error verifying StackAuth user:', error)
        return NextResponse.json({ 
          error: 'Authentication error',
          details: 'Could not verify user in StackAuth.'
        }, { status: 401 })
      }
      
      // Check if user exists by ID
      let [userById] = await secureDb.db
        .select({ 
          id: schema.users.id,
          email: schema.users.email,
          role: schema.users.role,
          isActive: schema.users.isActive
        })
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1)
      
      // Check if user exists by email (might have different ID from old registration)
      let [userByEmail] = await secureDb.db
        .select({ 
          id: schema.users.id,
          email: schema.users.email,
          role: schema.users.role,
          isActive: schema.users.isActive
        })
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1)
      
      // Handle case where email exists with different ID
      if (userByEmail && userByEmail.id !== userId) {
        console.warn(`Email ${email} exists with different ID. Old ID: ${userByEmail.id}, New StackAuth ID: ${userId}`)
        // Delete the old user record with the wrong ID
        await secureDb.db
          .delete(schema.users)
          .where(eq(schema.users.id, userByEmail.id))
        console.log(`Deleted old user record with ID: ${userByEmail.id}`)
        userByEmail = undefined
      }
      
      const user = userById || userByEmail
      
      const role = form.get('role');

      // Ensure role is explicitly provided
      if (!role) {
        console.error('Role is missing in registration request.');
        return NextResponse.json({
          error: 'Role is required for registration.',
          details: 'Please specify a valid role (e.g., student, agent, provider) during registration.'
        }, { status: 400 }); // 400 Bad Request
      }

      // Ensure role is a string
      if (typeof role !== 'string') {
        console.error('Role must be a string.');
        return NextResponse.json({
          error: 'Invalid role.',
          details: 'The role must be a valid string.'
        }, { status: 400 }); // 400 Bad Request
      }
      
      // Validate role
      const validRoles = ['student', 'agent', 'provider'];
      if (!validRoles.includes(role)) {
        console.error(`Invalid role provided: ${role}`);
        return NextResponse.json({
          error: 'Invalid role.',
          details: `The role '${role}' is not valid. Allowed roles are: ${validRoles.join(', ')}.`
        }, { status: 400 }); // 400 Bad Request
      }
      
      // Role assignment logic:
      // - If user exists with same role, reject duplicate registration
      // - If user exists with temporary 'student' role (set by webhook), allow update to actual role
      // - If user exists with 'student' role, allow change to agent/provider (edge case)
      // - If user exists with different non-temporary role, reject
      if (user && user.role === role) {
        console.warn(`Duplicate ${role} registration attempt: ${email} (ID: ${userId})`)
        return NextResponse.json({ 
          error: `Email already registered as a ${role}`,
          details: `This email is already associated with a ${role} account. Please log in instead.`
        }, { status: 409 }) // 409 Conflict
      }
      
      // Allow role updates from temporary 'student' role set by webhook
      // Webhook sets temporary 'student' role for all non-admin users
      // Registration endpoint sets the correct role based on which registration page was used
      const isTemporaryRole = user && user.role === 'student' && (role === 'agent' || role === 'provider')
      const isStudentToAgentProvider = user && user.role === 'student' && (role === 'agent' || role === 'provider')
      const isDifferentNonTemporaryRole = user && user.role !== role && user.role !== 'student' && user.role !== 'admin'
      
      if (isTemporaryRole) {
        console.log(`Updating temporary 'provider' role to actual '${role}' for ${email} (ID: ${userId})`)
        // Continue with registration to update role
      } else if (isStudentToAgentProvider) {
        // Allow role change from student to agent/provider (edge case)
        console.log(`Allowing role change from 'student' to '${role}' for ${email} (ID: ${userId})`)
        // Continue with registration to update role
      } else if (isDifferentNonTemporaryRole) {
        // User exists with a different non-temporary role, reject
        console.warn(`User ${email} (ID: ${userId}) already registered as ${user.role}, cannot change to ${role}.`)
        return NextResponse.json({ 
          error: `Email already registered as a ${user.role}`,
          details: `This email is already associated with a ${user.role} account. Please log in instead.`
        }, { status: 409 }) // 409 Conflict
      }
      
      if (!user) {
        // User not created by webhook yet, create it now using StackAuth ID
        console.log(`Creating user in database with StackAuth ID: ${userId} (${email})`)
        console.log(`StackAuth user email verification status: ${stackUser.primaryEmailVerified}`)
        
        await secureDb.db
          .insert(schema.users)
          .values({
            id: userId,
            email: email,
            password: 'stackauth',
            firstName: firstName,
            lastName: lastName,
            role: role as 'provider' | 'agent',
            phone: phone || null,
            studentNumber: null,
            institution: null,
            emailVerified: !!stackUser.primaryEmailVerified,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        
        // Verify role was set correctly
        const [verifiedUser] = await secureDb.db
          .select({ role: schema.users.role })
          .from(schema.users)
          .where(eq(schema.users.id, userId))
          .limit(1)

        if (verifiedUser?.role !== role) {
          console.error(`CRITICAL: Role mismatch! Expected: ${role}, Got: ${verifiedUser?.role}`)
        } else {
          console.log(`VERIFIED: Provider/Agent user created with correct role: ${role}`)
        }

        console.log(`SUCCESS: User created in Neon with ID: ${userId}`)
      } else {
        // Update existing user to the specified role
        console.log(`Updating existing user (${user.id}) to ${role} role`)
        await secureDb.db
          .update(schema.users)
          .set({
            role: role as 'provider' | 'agent',
            firstName: firstName,
            lastName: lastName,
            phone: phone || null,
            studentNumber: null,
            institution: null,
            updatedAt: new Date()
          })
          .where(eq(schema.users.id, userId))

        // Verify role was updated correctly
        const [verifiedUser] = await secureDb.db
          .select({ role: schema.users.role })
          .from(schema.users)
          .where(eq(schema.users.id, userId))
          .limit(1)

        if (verifiedUser?.role !== role) {
          console.error(`CRITICAL: Role update mismatch! Expected: ${role}, Got: ${verifiedUser?.role}`)
        } else {
          console.log(`VERIFIED: Provider/Agent user updated with correct role: ${role}`)
        }

        console.log(`SUCCESS: User ${userId} updated to ${role} role`)
      }

      // Create or update provider/agent record based on role
      if (role === 'provider') {
        const existingProvider = await secureDb.db
          .select({ id: schema.providers.id })
          .from(schema.providers)
          .where(eq(schema.providers.userId, userId))
          .limit(1)

        const providerId = (await import('crypto')).randomUUID()
        
        console.log(`Creating provider record with userId: ${userId}`)

        const { referralCode } = formData

        if (existingProvider && existingProvider.length > 0) {
          console.log(`Updating existing provider record for userId: ${userId}`)
          await secureDb.db
            .update(schema.providers)
            .set({
              businessName: companyName,
              contactPerson: `${firstName} ${lastName}`,
              contactEmail: email,
              contactPhone: phone || 'Not provided',
              address: address || 'Not provided',
              referralCode: referralCode,
              updatedAt: new Date(),
            })
            .where(eq(schema.providers.userId, userId))
          console.log(`SUCCESS: Provider record updated for userId: ${userId}`)
        } else {
          console.log(`Creating new provider record with providerId: ${providerId}, userId: ${userId}`)
          await secureDb.db
            .insert(schema.providers)
            .values({
              id: providerId,
              userId: userId,
              businessName: companyName,
              contactPerson: `${firstName} ${lastName}`,
              contactEmail: email,
              contactPhone: phone || 'Not provided',
              address: address || 'Not provided',
              referralCode: referralCode,
              registrationStatus: 'pending',
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          console.log(`SUCCESS: Provider record created with userId: ${userId}`)
        }

        // Note: Documents and accreditation are handled during property creation, not registration

        return NextResponse.json({ success: true, providerId }, { status: 201 })
      } else if (role === 'agent') {
        const existingAgent = await secureDb.db
          .select({ id: schema.agents.id })
          .from(schema.agents)
          .where(eq(schema.agents.userId, userId))
          .limit(1)

        const agentId = (await import('crypto')).randomUUID()
        
        console.log(`Creating agent record with userId: ${userId}`)

        if (existingAgent && existingAgent.length > 0) {
          console.log(`Updating existing agent record for userId: ${userId}`)
          await secureDb.db
            .update(schema.agents)
            .set({
              businessName: companyName,
              contactPerson: `${firstName} ${lastName}`,
              contactEmail: email,
              contactPhone: phone || 'Not provided',
              address: address || 'Not provided',
              updatedAt: new Date(),
            })
            .where(eq(schema.agents.userId, userId))
          console.log(`SUCCESS: Agent record updated for userId: ${userId}`)
        } else {
          console.log(`Creating new agent record with agentId: ${agentId}, userId: ${userId}`)
          await secureDb.db
            .insert(schema.agents)
            .values({
              id: agentId,
              userId: userId,
              businessName: companyName,
              contactPerson: `${firstName} ${lastName}`,
              contactEmail: email,
              contactPhone: phone || 'Not provided',
              address: address || 'Not provided',
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          console.log(`SUCCESS: Agent record created with userId: ${userId}`)
        }

        return NextResponse.json({ success: true, agentId }, { status: 201 })
      } else {
        return NextResponse.json({ 
          error: 'Invalid role',
          details: 'Role must be either "provider" or "agent"'
        }, { status: 400 })
      }
    } else if (contentType.includes('application/json')) {
      // Student registration (JSON body)
      const body = await request.json()
      const { email, firstName, lastName, password, role: jsonRole, university } = body

      if (!email || !firstName || !password || !jsonRole) {
        return NextResponse.json({
          error: 'Missing required fields',
          details: 'Email, firstName, password, and role are required.'
        }, { status: 400 })
      }

      const role = jsonRole

      // Ensure role is a string
      if (typeof role !== 'string') {
        console.error('Role must be a string.');
        return NextResponse.json({
          error: 'Invalid role.',
          details: 'The role must be a valid string.'
        }, { status: 400 }); // 400 Bad Request
      }

      // Validate role
      const validRoles = ['student', 'agent', 'provider'];
      if (!validRoles.includes(role)) {
        console.error(`Invalid role provided: ${role}`);
        return NextResponse.json({
          error: 'Invalid role.',
          details: `The role '${role}' is not valid. Allowed roles are: ${validRoles.join(', ')}.`
        }, { status: 400 }); // 400 Bad Request
      }

      // For student registration, create user in StackAuth first
      const app = getStackServerApp()
      const signUpResult = await app.signUpWithCredential({
        email,
        password,
      })

      if (signUpResult.status !== 'ok') {
        console.error('Error creating StackAuth user:', signUpResult.error)
        return NextResponse.json({
          error: 'Registration failed',
          details: signUpResult.error.message || 'Could not create user account.'
        }, { status: 400 })
      }

      const stackUser = signUpResult.data as any // Assuming data is the user object
      console.log(`Student registration - Created StackAuth user: ${stackUser.id} (${email})`)

      const userId = stackUser.id

      // Check if user exists in DB (shouldn't, but check)
      const [userById] = await secureDb.db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          role: schema.users.role,
          isActive: schema.users.isActive
        })
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1)

      if (userById) {
        // User exists - check if role needs to be updated
        // This can happen if webhook created user before this endpoint ran
        if (userById.role !== role && userById.role !== 'admin') {
          console.log(`User ${userId} exists with role '${userById.role}', updating to '${role}'`)
          await secureDb.db
            .update(schema.users)
            .set({
              role: role as any,
              firstName: firstName,
              lastName: lastName,
              institution: university || null,
              updatedAt: new Date(),
            })
            .where(eq(schema.users.id, userId))
        } else if (userById.role === role) {
          console.log(`User ${userId} already exists with correct role '${role}'`)
          return NextResponse.json({
            error: 'User already exists',
            details: 'This user is already registered.'
          }, { status: 409 })
        } else {
          // User is admin, don't change role
          console.log(`User ${userId} is admin, preserving admin role`)
          return NextResponse.json({
            error: 'User already exists',
            details: 'This user is already registered.'
          }, { status: 409 })
        }
      } else {

        // Create user in DB
        await secureDb.db
          .insert(schema.users)
          .values({
            id: userId,
            email: email,
            password: 'stackauth',
            firstName: firstName,
            lastName: lastName,
            phone: null,
            studentNumber: null,
            institution: university || null,
            role: role,
            isActive: true,
            emailVerified: stackUser.primaryEmailVerified || false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })

        // Verify role was set correctly
        const [verifiedUser] = await secureDb.db
          .select({ role: schema.users.role })
          .from(schema.users)
          .where(eq(schema.users.id, userId))
          .limit(1)

        if (verifiedUser?.role !== role) {
          console.error(`CRITICAL: Role mismatch! Expected: ${role}, Got: ${verifiedUser?.role}`)
          // Correct the role if it's wrong
          await secureDb.db
            .update(schema.users)
            .set({ role: role as any, updatedAt: new Date() })
            .where(eq(schema.users.id, userId))
          console.log(`CORRECTED: Role fixed to '${role}' for user ${userId}`)
        } else {
          console.log(`VERIFIED: Student user created with correct role: ${role}`)
        }
      }

      console.log(`Student user created successfully with role: ${role}`)

      return NextResponse.json({
        success: true,
        message: "Student registered successfully",
        user: {
          id: userId,
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: role,
          isActive: true,
          emailVerified: stackUser.primaryEmailVerified || false,
        }
      })
    } else {
      // Unsupported content type
      return NextResponse.json({
        error: 'Unsupported content type',
        details: 'Only multipart/form-data and application/json are supported.'
      }, { status: 400 })
    }

  } catch (error) {
    console.error("=== Registration Error Caught ===")
    console.error("Error object:", error)
    console.error("Error type:", typeof error)
    
    // Extract detailed error information
    let errorMessage = "Registration failed"
    let errorDetails: any = {}
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined
      }
      
      // Check if it's a database error
      if ((error as any).code) {
        errorDetails.code = (error as any).code
        errorDetails.detail = (error as any).detail
        errorDetails.hint = (error as any).hint
      }
    } else if (typeof error === 'object' && error !== null) {
      errorDetails = error
      errorMessage = (error as any).message || 'An unexpected error occurred'
    } else {
      errorMessage = String(error)
    }
    
    console.error("Formatted error response:", { error: "Registration failed", details: errorMessage, debugInfo: errorDetails })
    
    // Always return valid JSON
    const response = { 
      error: "Registration failed", 
      details: errorMessage,
      debugInfo: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
