"use server"

import { createUser } from "@/lib/auth"
import { sendOTP } from "@/lib/otp"
import { query } from "@/lib/database"

export interface ProviderRegistrationState {
  success: boolean
  error?: string
  message?: string
}

export async function registerProvider(
  prevState: ProviderRegistrationState,
  formData: FormData,
): Promise<ProviderRegistrationState> {
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

    // Create user
    const user = await createUser({
      email,
      password,
      firstName: companyName,
      lastName: "",
      role: "provider"
    })

    if (!user) {
      return {
        success: false,
        error: "Failed to create user account",
      }
    }

    // Create provider record
    const providerData = {
      userId: user.id,
      businessName: companyName,
      isVerified: false,
      accreditationStatus: formData.get("isAccredited") === "yes" ? "accredited" : "pending"
    }

    // Store uploaded files
    const files = formData.getAll("files") as File[]
    const storedFiles = await Promise.all(
      files.map(async (file) => {
        // In production, upload to cloud storage like S3 or Cloudinary
        // For demo, just store file metadata
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          // In real app, this would be the storage URL
          url: `user-uploads/${user.id}/${file.name}`
        }
      })
    )

    // Save provider data with file references
    await query(
      `INSERT INTO providers (
        user_id,
        business_name,
        is_verified,
        accreditation_status,
        documents
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        companyName,
        false,
        formData.get("isAccredited") === "yes" ? "accredited" : "pending",
        JSON.stringify(storedFiles)
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

    return {
      success: true,
      message: "Registration successful! Please check your email for verification code.",
    }
  } catch (error: any) {
    console.error("Provider registration error:", error)
    return {
      success: false,
      error: error.message || "Registration failed. Please try again.",
    }
  }
}
