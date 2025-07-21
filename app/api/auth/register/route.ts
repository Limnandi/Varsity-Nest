import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/auth"
import { generateOTP, storeOTP } from "@/lib/otp"
import { query } from "@/lib/database"
import { Sentry } from "@/lib/sentry"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, companyName, contactNumber, address } = await request.json()

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // For providers, verify against accredited list
    if (role === "provider") {
      const accreditedResult = await query(
        "SELECT id FROM accredited_providers WHERE email = $1 AND is_active = true",
        [email],
      )

      if (accreditedResult.rows.length === 0) {
        return NextResponse.json(
          {
            error: "Email not found in accredited providers list. Please contact support.",
          },
          { status: 400 },
        )
      }
    }

    // For students, verify email domain
    if (role === "student") {
      const allowedDomains = ["ufs4life.ac.za", "cut.ac.za"]
      const emailDomain = email.split("@")[1]

      if (!allowedDomains.includes(emailDomain)) {
        return NextResponse.json(
          {
            error: "Please use your university email address",
          },
          { status: 400 },
        )
      }
    }

    // Generate and send OTP
    const otp = generateOTP()
    await storeOTP(email, otp, "registration")

    // Send OTP email
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        otp,
        type: "registration",
        name,
        role,
      }),
    })

    if (!emailResponse.ok) {
      throw new Error("Failed to send OTP email")
    }

    // Store registration data temporarily (you might want to use Redis for this)
    const registrationData = {
      email,
      password,
      name,
      role,
      companyName,
      contactNumber,
      address,
      timestamp: Date.now(),
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email",
      registrationId: Buffer.from(JSON.stringify(registrationData)).toString("base64"),
    })
  } catch (error) {
    Sentry.captureException(error)
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
