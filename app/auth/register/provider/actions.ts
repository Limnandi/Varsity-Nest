"use server"

import { createUser } from "@/lib/auth"
import { sendOTP } from "@/lib/otp"
import { query } from "@/lib/database"
import { redirect } from "next/navigation"

export interface ProviderRegistrationState {
  success: boolean
  error?: string
  message?: string
}

export async function registerProvider(
  prevState: ProviderRegistrationState,
  formData: FormData,
): Promise<ProviderRegistrationState | undefined> {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const companyName = formData.get("companyName") as string

    // Validation
    if (!email || !password || !confirmPassword || !companyName) {
      return {
        success: false,
        error: "All fields are required",
      }
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        error: "Passwords do not match",
      }
    }

    if (password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters long",
      }
    }

    // Extract and validate form fields
    const name = formData.get("name")?.toString().trim()
    const contactPhone = formData.get("contactPhone")?.toString().trim() || ""
    const address = formData.get("address")?.toString().trim() || ""
    const isAccredited = formData.get("isAccredited") === "yes"

    console.log("Form data received:", {
      name,
      contactPhone,
      address,
      isAccredited
    })

    // Parse name into first/last names
    if (!name) {
      return {
        success: false,
        error: "Name is required"
      }
    }

    const nameParts = name.split(/\s+/)
    const firstName = nameParts.slice(0, -1).join(" ")
    const lastName = nameParts[nameParts.length - 1]

    // Check if email already exists
    const existingUser = await query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    )
    if (existingUser.rows.length > 0) {
      return {
        success: false,
        error: "Email address is already registered",
      }
    }

    // Create user with validated fields
    let user
    try {
      user = await createUser({
        email,
        password,
        firstName: firstName as string,
        lastName: lastName as string,
        role: "provider"
      })

      if (!user) {
        return {
          success: false,
          error: "Failed to create user account",
        }
      }
    } catch (error: any) {
      console.error("User creation error:", error)
      let errorMessage = "Registration failed"
      if (error.code === "23505") { // Unique constraint violation
        if (error.constraint === "users_email_key") {
          errorMessage = "Email address is already registered"
        } else {
          errorMessage = "Account already exists with these details"
        }
      }
      return {
        success: false,
        error: errorMessage,
      }
    }

    // Create provider record
    const providerData = {
      userId: user.id,
      businessName: companyName,
      isVerified: false,
      contactPerson: name,
      contactEmail: email,
      contactPhone,
      address
    }

    // Only upload accreditation documents if provider is accredited
    let businessRegistration = null
    if (isAccredited) {
      const { uploadImage } = await import("@/lib/cloudinary")
      const files = formData.getAll("files") as File[]
      if (files.length === 0) {
        return {
          success: false,
          error: "Accreditation documents are required for accredited providers"
        }
      }
      businessRegistration = await Promise.all(
        files.map(async (file) => {
          const result = await uploadImage(file) as { secure_url: string }
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            url: result.secure_url
          }
        })
      )
    }

    // Save provider data
    await query(
      `INSERT INTO providers (
        user_id,
        business_name,
        contact_person,
        contact_email,
        contact_phone,
        address,
        is_verified,
        business_registration
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        user.id,
        companyName,
        providerData.contactPerson,
        providerData.contactEmail,
        providerData.contactPhone,
        providerData.address,
        false,
        businessRegistration ? JSON.stringify(businessRegistration) : null
      ]
    )

    // Send OTP for verification
    const otpResult = await sendOTP(email, "registration", "provider")
    if (!otpResult.success) {
      return {
        success: false,
        error: "Failed to send verification email"
      }
    }

    // Redirect to OTP verification page
    redirect(`/verify-otp?email=${encodeURIComponent(email)}&userType=provider`)
  } catch (error: any) {
    console.error("Provider registration error:", error)
    return {
      success: false,
      error: error.message || "Registration failed. Please try again.",
    }
  }
}
