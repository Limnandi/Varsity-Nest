import { type NextRequest, NextResponse } from "next/server"
import { verifyOTP, incrementOTPAttempts } from "@/lib/otp"
import { createUser } from "@/lib/auth"
import { query } from "@/lib/database"
import { Sentry } from "@/lib/sentry"

export async function POST(request: NextRequest) {
  try {
    const { email, otp, type, registrationId } = await request.json()

    const result = await verifyOTP(email, otp, type)

    if (!result.success) {
      await incrementOTPAttempts(email, type)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    if (type === "registration" && registrationId) {
      // Complete registration
      const registrationData = JSON.parse(Buffer.from(registrationId, "base64").toString())

      // Check if registration data is not too old (5 minutes)
      if (Date.now() - registrationData.timestamp > 5 * 60 * 1000) {
        return NextResponse.json({ error: "Registration session expired" }, { status: 400 })
      }

      const user = await createUser(
        registrationData.email,
        registrationData.password,
        registrationData.name,
        registrationData.role,
      )

      // Mark user as verified
      await query("UPDATE users SET is_verified = true WHERE id = $1", [user.id])

      // Create additional profile based on role
      if (registrationData.role === "provider") {
        await query(
          "INSERT INTO service_providers (user_id, company_name, contact_number, address) VALUES ($1, $2, $3, $4)",
          [user.id, registrationData.companyName, registrationData.contactNumber, registrationData.address],
        )
      } else if (registrationData.role === "student") {
        const university = registrationData.email.includes("ufs4life.ac.za") ? "UFS" : "CUT"
        await query("INSERT INTO students (user_id, university) VALUES ($1, $2)", [user.id, university])
      }

      return NextResponse.json({
        success: true,
        message: "Registration completed successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      })
    }

    return NextResponse.json({ success: true, message: "OTP verified successfully" })
  } catch (error) {
    Sentry.captureException(error)
    console.error("OTP verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
