import { Resend } from "resend"
import { redis } from "./redis"
import { env } from "@/lib/env"

const resend = new Resend(env.RESEND_API_KEY)

export async function storeOTP(email: string, otp: string, type: "registration" | "password_reset" = "registration") {
  const key = `otp:${type}:${email}`
  await redis.setex(key, 1800, otp) // 30 minutes expiry
  await redis.setex(`${key}:attempts`, 1800, "0") // Track attempts
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOTP(
  email: string,
  type: "registration" | "password_reset" = "registration",
  userType: "student" | "provider" = "student",
): Promise<{ success: boolean; error?: string }> {
  try {
    const otp = generateOTP()
    await storeOTP(email, otp, type)

    const subject =
      type === "registration"
        ? `Varsity Nest - Verify Your ${userType === "student" ? "Student" : "Provider"} Account`
        : "Varsity Nest - Password Reset Code"

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Varsity Nest</h1>
          <p style="color: #e0f2fe; margin: 10px 0 0 0;">Student Accommodation Platform</p>
        </div>
        
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #0f172a; margin-bottom: 20px;">
            ${type === "registration" ? "Verify Your Account" : "Reset Your Password"}
          </h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            ${
              type === "registration"
                ? `Welcome to Varsity Nest! Please use the verification code below to complete your ${userType} registration:`
                : "You requested to reset your password. Use the code below to proceed:"
            }
          </p>
          
          <div style="background: #f1f5f9; border: 2px dashed #0891b2; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
            <div style="font-size: 36px; font-weight: bold; color: #0891b2; letter-spacing: 8px; font-family: monospace;">
              ${otp}
            </div>
            <p style="color: #64748b; margin: 15px 0 0 0; font-size: 14px;">
              This code expires in 5 minutes
            </p>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>Security Notice:</strong> Never share this code with anyone. Varsity Nest will never ask for your verification code.
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            If you didn't request this ${type === "registration" ? "registration" : "password reset"}, please ignore this email.
          </p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            © 2024 Varsity Nest - Student Accommodation Platform<br>
            Powered by Massive Operations
          </p>
        </div>
      </div>
    `

    await resend.emails.send({
      from: "Varsity Nest <noreply@varsitynest.space>",
      to: [email],
      subject,
      html,
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to send OTP:", error)
    return { success: false, error: "Failed to send verification email" }
  }
}

export async function verifyOTP(
  email: string,
  inputOTP: string,
  type: "registration" | "password_reset" = "registration",
): Promise<{ success: boolean; error?: string }> {
  try {
    const storedOTP = await redis.get(`otp:${type}:${email}`)

    if (!storedOTP) {
      return { success: false, error: "OTP has expired or doesn't exist" }
    }

    const attempts = (await redis.get(`otp:${type}:${email}:attempts`)) || "0"
    if (Number.parseInt(attempts as string) >= 3) {
      await redis.del(`otp:${type}:${email}`)
      await redis.del(`otp:${type}:${email}:attempts`)
      return { success: false, error: "Too many failed attempts. Please request a new code." }
    }

    if (storedOTP !== inputOTP) {
      await redis.incr(`otp:${type}:${email}:attempts`)
      return { success: false, error: "Invalid verification code" }
    }

    // Success - clean up
    await redis.del(`otp:${type}:${email}`)
    await redis.del(`otp:${type}:${email}:attempts`)

    return { success: true }
  } catch (error) {
    console.error("OTP verification error:", error)
    return { success: false, error: "Verification failed" }
  }
}

export async function incrementOTPAttempts(
  email: string,
  type: "registration" | "password_reset" = "registration",
): Promise<number> {
  const key = `otp:${type}:${email}:attempts`
  const attempts = await redis.incr(key)
  await redis.expire(key, 1800) // Reset expiry (30 minutes)
  return attempts
}

export async function getOTPAttempts(
  email: string,
  type: "registration" | "password_reset" = "registration",
): Promise<number> {
  const key = `otp:${type}:${email}:attempts`
  const attempts = await redis.get(key)
  return attempts ? Number.parseInt(attempts as string) : 0
}
