import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { uploadDocument } from "@/lib/cloudinary"
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
        address: String(form.get('address') || ''),
        description: String(form.get('description') || ''),
        website: String(form.get('website') || '')
      }

      // Validate the form data
      const validation = validateRequest(providerFormDataSchema, formData)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid form data', details: validation.errors },
          { status: 400 }
        )
      }

      const { email, firstName, lastName, phone, companyName, address, description, website } = validation.data

      // Get existing user (created by webhook) and update with additional info
      const [user] = await secureDb.db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1)
      
      if (!user) {
        return NextResponse.json({ error: 'User not found. Please complete registration first.' }, { status: 404 })
      }
      
      const userId = user.id
      
      // Update user with additional provider info
      await secureDb.db
        .update(schema.users)
        .set({
          firstName: firstName,
          lastName: lastName,
          phone: phone || null,
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, userId))

      // Create provider record
      const { randomUUID } = await import('crypto')
      const providerId = randomUUID()
      await secureDb.db
        .insert(schema.providers)
        .values({
          id: providerId,
          userId: userId,
          companyName: companyName,
          contactPerson: `${firstName} ${lastName}`,
          contactEmail: email,
          contactPhone: phone || null,
          address: address || '',
          registrationStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: schema.providers.userId,
          set: {
            companyName: companyName,
            contactPerson: `${firstName} ${lastName}`,
            contactEmail: email,
            contactPhone: phone || null,
            address: address || '',
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
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
