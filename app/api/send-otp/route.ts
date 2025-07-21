import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { Sentry } from "@/lib/sentry"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, otp, type, name, role } = await request.json()

    const subject =
      type === "registration" ? "Welcome to Varsity Nest - Verify Your Account" : "Reset Your Password - Varsity Nest"

    const university = email.includes("ufs4life.ac.za")
      ? "University of the Free State"
      : email.includes("cut.ac.za")
        ? "Central University of Technology"
        : "University"

    const { data, error } = await resend.emails.send({
      from: "Varsity Nest <noreply@varsitynest.space>",
      to: [email],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Varsity Nest</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Student Accommodation Platform</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">
              ${type === "registration" ? "🎉 Verify Your Account" : "🔐 Reset Your Password"}
            </h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              ${
                type === "registration"
                  ? `Welcome to Varsity Nest, ${name}! 🏠 We're excited to help you ${role === "student" ? "find the perfect student accommodation" : "manage your accommodation listings"}. Please use the verification code below to complete your ${university} ${role} registration.`
                  : "You requested to reset your password. No worries! Use the verification code below to set a new password for your account."
              }
            </p>
            
            <!-- OTP Box -->
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 3px dashed #0891b2; border-radius: 12px; padding: 35px; text-align: center; margin: 30px 0;">
              <p style="color: #666; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
              <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #333; font-size: 42px; font-weight: bold; letter-spacing: 12px; margin: 0; font-family: 'Courier New', monospace; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                  ${otp}
                </h1>
              </div>
            </div>
            
            <!-- Warning Box -->
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 6px; padding: 20px; margin: 25px 0;">
              <div style="display: flex; align-items: center;">
                <span style="font-size: 20px; margin-right: 10px;">⚠️</span>
                <div>
                  <p style="color: #856404; margin: 0; font-size: 14px; font-weight: 600;">Important Security Notice</p>
                  <p style="color: #856404; margin: 5px 0 0 0; font-size: 13px;">This code expires in <strong>1 minute</strong>. Never share it with anyone!</p>
                </div>
              </div>
            </div>
            
            <!-- Instructions -->
            <div style="background: #e7f3ff; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #0066cc; margin: 0 0 10px 0; font-size: 16px;">📋 Next Steps:</h3>
              <ol style="color: #0066cc; margin: 0; padding-left: 20px; font-size: 14px;">
                <li style="margin-bottom: 5px;">Return to the Varsity Nest website</li>
                <li style="margin-bottom: 5px;">Enter the 6-digit code above</li>
                <li style="margin-bottom: 5px;">${type === "registration" ? "Complete your profile setup" : "Create your new password"}</li>
                <li>Start ${role === "student" ? "exploring amazing student accommodations" : "managing your accommodation listings"}! 🏠</li>
              </ol>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              If you didn't request this ${type === "registration" ? "registration" : "password reset"}, 
              please ignore this email or contact our support team at <a href="mailto:support@varsitynest.space" style="color: #0891b2;">support@varsitynest.space</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="color: #666; font-size: 12px; margin: 0 0 10px 0;">
              © 2024 Varsity Nest. Connecting students with quality accommodation.
            </p>
            <p style="color: #999; font-size: 11px; margin: 0;">
              This email was sent to ${email}. If you have questions, contact us anytime.
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      Sentry.captureException(error)
      console.error("Resend error:", error)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      message: "Email sent successfully!",
    })
  } catch (error) {
    Sentry.captureException(error)
    console.error("Send OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
