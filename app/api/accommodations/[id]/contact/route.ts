import { NextRequest, NextResponse } from 'next/server'
import { getStackServerApp } from '@/lib/stack'
import { secureDb } from '@/lib/database-secure'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/schema'
import { getCurrentUserFromStackAuth } from '@/lib/auth-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, mobile, message } = body

    // Check authentication and role
    const currentUser = await getCurrentUserFromStackAuth()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in as a student.' },
        { status: 401 }
      )
    }

    if (currentUser.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can send messages to providers.' },
        { status: 403 }
      )
    }

    // Validate input
    if (!name || !email || !mobile || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Fetch accommodation with provider info
    const [accommodation] = await secureDb.db
      .select({
        id: schema.accommodations.id,
        name: schema.accommodations.name,
        providerId: schema.accommodations.providerId,
        providerUserId: schema.providers.userId,
        providerEmail: schema.providers.contactEmail,
        providerName: schema.providers.businessName,
      })
      .from(schema.accommodations)
      .leftJoin(schema.providers, eq(schema.accommodations.providerId, schema.providers.id))
      .where(eq(schema.accommodations.id, id))
      .limit(1)

    if (!accommodation) {
      return NextResponse.json(
        { error: 'Accommodation not found' },
        { status: 404 }
      )
    }

    if (!accommodation.providerUserId) {
      return NextResponse.json(
        { error: 'Provider information not available' },
        { status: 404 }
      )
    }

    // Get Stack Auth app
    const app = getStackServerApp()

    // Create email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Property Inquiry</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">New Property Inquiry</h1>
          </div>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
            <p style="margin-top: 0;">You have received a new inquiry for your property listing:</p>
            <h2 style="color: #667eea; margin-top: 20px;">${accommodation.name}</h2>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #333;">Contact Information:</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #667eea;">${email}</a></p>
              <p><strong>Mobile:</strong> <a href="tel:${mobile}" style="color: #667eea;">${mobile}</a></p>
            </div>

            <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #764ba2;">
              <h3 style="margin-top: 0; color: #333;">Message:</h3>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                This inquiry was sent through VarsityNest. Please respond directly to the contact information provided above.
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email to provider using Stack Auth
    const result = await app.sendEmail({
      userIds: [accommodation.providerUserId],
      subject: `New Property Inquiry: ${accommodation.name}`,
      html: emailHtml,
    })

    if ((result as any).status === 'error') {
      const error = (result as any).error || {}
      console.error('Failed to send email:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry sent successfully',
    })
  } catch (error: any) {
    console.error('Contact agent error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send inquiry' },
      { status: 500 }
    )
  }
}

