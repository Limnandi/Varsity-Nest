import { NextRequest, NextResponse } from "next/server"
import { getStackServerApp } from "@/lib/stack"
import { ApiErrorResponseBuilder } from "@/lib/api-error-response"
import { env } from "@/lib/env"
import { verifyRecaptcha } from "@/lib/recaptcha"

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, subject, message, recaptchaToken } = await request.json()

    if (!name || !email || !subject || !message) {
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { 
          name: !name ? "Name is required" : undefined,
          email: !email ? "Email is required" : undefined,
          subject: !subject ? "Subject is required" : undefined,
          message: !message ? "Message is required" : undefined,
        },
        request
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { email: "Invalid email format" },
        request
      )
    }

    // Verify reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(recaptchaToken)
    if (!recaptchaResult.success) {
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { recaptcha: recaptchaResult.message || "reCAPTCHA verification failed. Please try again." },
        request
      )
    }

    const recipientEmail = "limnandikent@gmail.com"

    // Use Stack Auth's sendEmail method with custom HTML
    // Since sendEmail requires userIds, we need to find or create the recipient user
    try {
      const app = getStackServerApp()
      
      // Try to find if the recipient email is a Stack Auth user
      let recipientUserId: string | null = null
      
      try {
        // Search through users to find matching email
        // listUsers returns ServerUser[] & { nextCursor: string | null }
        let usersResult = await app.listUsers({})
        let cursor: string | null = null
        
        // Iterate over the array directly (it's ServerUser[])
        for (const user of usersResult) {
          if (user.primaryEmail === recipientEmail) {
            recipientUserId = user.id
            break
          }
        }
        
        // Extract nextCursor from the result
        cursor = (usersResult as any).nextCursor || null
        
        // If user not found in first page, continue searching if there are more pages
        while (!recipientUserId && cursor) {
          usersResult = await app.listUsers({ cursor })
          
          // Iterate over the array
          for (const user of usersResult) {
            if (user.primaryEmail === recipientEmail) {
              recipientUserId = user.id
              break
            }
          }
          
          cursor = (usersResult as any).nextCursor || null
        }
      } catch (userIdError) {
        console.error('Error searching for recipient user:', userIdError)
      }
      
      // If user found, use Stack Auth's sendEmail method (as per user's example)
      if (recipientUserId) {
        const result = await app.sendEmail({
          userIds: [recipientUserId],
          subject: `Contact Form: ${subject}`,
          html: createContactFormEmailHTML(name, email, phone, subject, message),
        })

        if ((result as any).status === 'error') {
          const err = (result as any).error || {}
          console.error('Stack Auth sendEmail error:', err)
          throw new Error(err.message || 'Failed to send email')
        }

        return NextResponse.json({ 
          success: true,
          message: "Thank you for your message! We'll get back to you soon."
        })
      }

      // If user not found, Stack Auth's sendEmail requires userIds, so we can't use it
      // Use Resend instead to send to arbitrary email addresses
      console.log('Recipient not found as Stack Auth user, using Resend for email delivery')
      
      const { Resend } = await import('resend')
      const resend = new Resend(env.RESEND_API_KEY)
      
      const emailResult = await resend.emails.send({
        from: 'Varsity Nest <noreply@varsitynest.space>',
        to: recipientEmail,
        subject: `Contact Form: ${subject}`,
        html: createContactFormEmailHTML(name, email, phone, subject, message),
      })

      if (emailResult.error) {
        console.error('Resend email error:', emailResult.error)
        throw new Error(`Failed to send email: ${emailResult.error.message || 'Unknown error'}`)
      }

      return NextResponse.json({ 
        success: true,
        message: "Thank you for your message! We'll get back to you soon."
      })

    } catch (error: any) {
      console.error("Contact form email error:", error)
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      return await ApiErrorResponseBuilder.createErrorResponse(
        new Error(error.message || "Failed to send contact form email. Please try again later."),
        request,
        { operation: "contact_form" }
      )
    }

  } catch (error: any) {
    console.error("Contact form error:", error)
    return await ApiErrorResponseBuilder.createErrorResponse(
      error,
      request,
      { operation: "contact_form" }
    )
  }
}

function createContactFormEmailHTML(name: string, email: string, phone: string, subject: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Varsity Nest</h1>
          <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 16px;">Contact Form Submission</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <p style="color: #475569; font-size: 16px; margin-bottom: 20px;">
            You have received a new contact form submission from the Varsity Nest website.
          </p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0;">
            <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; margin-bottom: 15px;">Contact Information</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: bold; width: 120px;">Name:</td>
                <td style="padding: 8px 0; color: #1e293b;">${escapeHtml(name)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; color: #1e293b;">
                  <a href="mailto:${escapeHtml(email)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(email)}</a>
                </td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Phone:</td>
                <td style="padding: 8px 0; color: #1e293b;">
                  <a href="tel:${escapeHtml(phone)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(phone)}</a>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Subject:</td>
                <td style="padding: 8px 0; color: #1e293b;">${escapeHtml(subject)}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #7c3aed; padding: 20px; margin: 20px 0;">
            <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; margin-bottom: 15px;">Message</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.8; white-space: pre-wrap; margin: 0;">${escapeHtml(message)}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              This email was sent from the Varsity Nest contact form.<br>
              You can reply directly to this email to contact the sender.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            © 2025 Varsity Nest - Student Accommodation Platform<br>
            Powered by Massive Operations
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

