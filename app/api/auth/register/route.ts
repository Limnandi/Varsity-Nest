import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { uploadDocument } from "@/lib/cloudinary"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      // Provider registration documents and DB linkage after client StackAuth signup
      const form = await request.formData()
      const email = String(form.get('email') || '')
      const firstName = String(form.get('firstName') || '')
      const lastName = String(form.get('lastName') || '')
      const phone = String(form.get('phone') || '')
      const institution = String(form.get('institution') || '')

      if (!email || !firstName || !lastName) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      // Get existing user (created by webhook) and update with additional info
      const userRes = await query`
        SELECT id FROM users WHERE email = ${email}
      `
      
      if (userRes.rows.length === 0) {
        return NextResponse.json({ error: 'User not found. Please complete registration first.' }, { status: 404 })
      }
      
      const userId = userRes.rows[0].id
      
      // Update user with additional provider info
      await query`
        UPDATE users 
        SET first_name = ${firstName}, last_name = ${lastName}, phone = ${phone || null}, updated_at = NOW()
        WHERE id = ${userId}
      `

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

    // Unsupported content type to avoid server-side StackAuth sign-up
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 })

  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
