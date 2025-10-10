import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { providerFormDataSchema, validateRequest } from "@/lib/validation-schemas"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    console.log('Registration request received with content-type:', contentType)

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

      // Create or update provider record (manual upsert because userId is not unique)
      const existingProvider = await secureDb.db
        .select({ id: schema.providers.id })
        .from(schema.providers)
        .where(eq(schema.providers.userId, userId))
        .limit(1)

      const providerId = (await import('crypto')).randomUUID()

      if (existingProvider && existingProvider.length > 0) {
        await secureDb.db
          .update(schema.providers)
          .set({
            businessName: companyName,
            contactPerson: `${firstName} ${lastName}`,
            contactEmail: email,
            contactPhone: phone || 'Not provided',
            address: address || 'Not provided',
            updatedAt: new Date(),
          })
          .where(eq(schema.providers.userId, userId))
      } else {
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
            registrationStatus: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
      }

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
          .set({ documents: urls, updatedAt: new Date() })
          .where(eq(schema.providers.userId, userId))
      }

      return NextResponse.json({ success: true, providerId, documents: urls }, { status: 201 })
    }

    // Unsupported content type to avoid server-side StackAuth sign-up
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 })

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
