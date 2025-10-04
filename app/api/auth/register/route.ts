import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { providerFormDataSchema, validateRequest } from "@/lib/validation-schemas"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      // Provider registration documents and DB linkage after client StackAuth signup
      const form = await request.formData()
      
      // Validate and sanitize form data
      const formData = {
        email: String(form.get('email') || ''),
        firstName: String(form.get('firstName') || ''),
        lastName: String(form.get('lastName') || ''),
        phone: String(form.get('phone') || ''),
        companyName: String(form.get('institution') || ''),
        address: String(form.get('address') || 'Not provided'),
        description: String(form.get('description') || 'Provider registration pending details'),
        website: String(form.get('website') || '')
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

      // Check if user already has a provider account
      let [user] = await secureDb.db
        .select({ 
          id: schema.users.id,
          role: schema.users.role,
          isActive: schema.users.isActive
        })
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1)
      
      let userId: string
      
      // If user exists and is already a provider, reject duplicate registration
      if (user && user.role === 'provider') {
        console.warn(`Duplicate provider registration attempt: ${email}`)
        return NextResponse.json({ 
          error: 'Email already registered as a provider',
          details: 'This email is already associated with a provider account. Please log in instead.'
        }, { status: 409 }) // 409 Conflict
      }
      
      if (!user) {
        // User not created by webhook yet, create it now
        console.log(`Creating user in database: ${email}`)
        const { randomUUID } = await import('crypto')
        const newUserId = randomUUID()
        
        const insertResult = await secureDb.db
          .insert(schema.users)
          .values({
            id: newUserId,
            email: email,
            password: 'stackauth', // Placeholder for StackAuth users
            firstName: firstName,
            lastName: lastName,
            role: 'provider',
            phone: phone || null, // Users table allows NULL for phone
            emailVerified: false,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: schema.users.email,
            set: {
              firstName: firstName,
              lastName: lastName,
              phone: phone || null, // Users table allows NULL for phone
              updatedAt: new Date()
            }
          })
          .returning({ id: schema.users.id })
        
        // If conflict occurred, get the existing user's ID
        if (insertResult && insertResult.length > 0) {
          userId = insertResult[0].id
          console.log(`User created/updated with ID: ${userId}`)
        } else {
          // Fallback: query for the user by email
          const [existingUser] = await secureDb.db
            .select({ id: schema.users.id })
            .from(schema.users)
            .where(eq(schema.users.email, email))
            .limit(1)
          
          if (existingUser) {
            userId = existingUser.id
            console.log(`Found existing user ID: ${userId}`)
          } else {
            userId = newUserId
            console.log(`Using new user ID: ${userId}`)
          }
        }
      } else {
        userId = user.id
        console.log(`Using existing user ID: ${userId}`)
      }
      
      // Update user role to provider if it wasn't set
      if (user) {
        await secureDb.db
          .update(schema.users)
          .set({
            role: 'provider',
            firstName: firstName,
            lastName: lastName,
            phone: phone || null, // Users table allows NULL for phone
            updatedAt: new Date()
          })
          .where(eq(schema.users.id, userId))
      }

      // Create provider record
      const providerId = (await import('crypto')).randomUUID()
      await secureDb.db
        .insert(schema.providers)
        .values({
          id: providerId,
          userId: userId,
          businessName: companyName, // Database column is businessName, not companyName
          contactPerson: `${firstName} ${lastName}`,
          contactEmail: email,
          contactPhone: phone || 'Not provided', // Database requires NOT NULL, provide default
          address: address || 'Not provided',
          registrationStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: schema.providers.userId,
          set: {
            businessName: companyName, // Database column is businessName, not companyName
            contactPerson: `${firstName} ${lastName}`,
            contactEmail: email,
            contactPhone: phone || 'Not provided', // Database requires NOT NULL, provide default
            address: address || 'Not provided',
            updatedAt: new Date()
          }
        })

      // Upload up to 2 documents securely
      const docs = (form.getAll('documents') as unknown as File[]) || []
      const urls: string[] = []
      const uploadWarnings: string[] = []
      
      for (const d of docs.slice(0, 2)) {
        try {
          const { uploadDocumentSecurely } = await import('@/lib/cloudinary')
          const result = await uploadDocumentSecurely(d, {
            folder: 'varsity-nest/provider-documents',
            purpose: 'accreditation',
            userId: userId
          })
          
          if (result.success && result.result?.secure_url) {
            urls.push(result.result.secure_url)
            if (result.warnings) {
              uploadWarnings.push(...result.warnings)
            }
          } else {
            console.error('Document upload failed:', result.error)
            // Continue with other documents even if one fails
          }
        } catch (error) {
          console.error('Document upload error:', error)
          // Continue with other documents even if one fails
        }
      }

      if (urls.length > 0) {
        await secureDb.db
          .update(schema.providers)
          .set({ documents: urls })
          .where(eq(schema.providers.id, providerId))
      }

      return NextResponse.json({ success: true, providerId, documents: urls }, { status: 201 })
    }

    // Unsupported content type to avoid server-side StackAuth sign-up
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 })

  } catch (error) {
    console.error("Registration error:", error)
    
    // Extract detailed error information
    let errorMessage = "Registration failed"
    let errorDetails: any = undefined
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n') // First 3 lines of stack
      }
    } else if (typeof error === 'object' && error !== null) {
      errorDetails = error
      errorMessage = (error as any).message || JSON.stringify(error)
    }
    
    console.error("Detailed error:", errorDetails)
    
    return NextResponse.json({ 
      error: "Registration failed", 
      details: errorMessage,
      debugInfo: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 })
  }
}
