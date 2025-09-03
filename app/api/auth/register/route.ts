import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getStackServerApp } from "@/lib/stack"
import { uploadDocument } from "@/lib/cloudinary"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      // Provider registration with documents
      const form = await request.formData()
      const email = String(form.get('email') || '')
      const password = String(form.get('password') || '')
      const firstName = String(form.get('firstName') || '')
      const lastName = String(form.get('lastName') || '')
      const phone = String(form.get('phone') || '')
      const institution = String(form.get('institution') || '')

      if (!email || !password || !firstName || !lastName) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      // Create StackAuth user
      const app = getStackServerApp()
      // Create StackAuth user (role metadata can be set client-side post-verification)
      await app.signUpWithCredential({ email, password })

      // Create DB user and provider
      const userRes = await query`
        INSERT INTO users (email, password, first_name, last_name, role, phone, email_verified, is_active)
        VALUES (${email}, ${'stackauth'}, ${firstName}, ${lastName}, 'provider', ${phone || null}, true, true)
        ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
        RETURNING id
      `
      const userId = userRes.rows?.[0]?.id

      const providerRes = await query`
        INSERT INTO providers (user_id, business_name, contact_person, contact_email, contact_phone, address, registration_status)
        VALUES (${userId}, ${institution || 'Provider Business'}, ${firstName + ' ' + lastName}, ${email}, ${phone || null}, ${''}, 'pending')
        ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
        RETURNING id
      `
      const providerId = providerRes.rows?.[0]?.id

      // Upload up to 2 documents
      const docs = (form.getAll('documents') as unknown as File[]) || []
      const urls: string[] = []
      for (const d of docs.slice(0, 2)) {
        const result: any = await uploadDocument(d, 'varsity-nest/provider-documents')
        if (result?.secure_url) urls.push(result.secure_url)
      }

      if (urls.length > 0) {
        await query`UPDATE providers SET documents = ${JSON.stringify(urls)}::jsonb WHERE id = ${providerId}`
      }

      return NextResponse.json({ success: true, providerId, documents: urls }, { status: 201 })
    }

    // Fallback: simple JSON registration (students/admins)
    const body = await request.json()
    const { email, password, firstName, lastName, role } = body
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const app = getStackServerApp()
    await app.signUpWithCredential({ email, password })

    return NextResponse.json({ success: true }, { status: 201 })

  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
