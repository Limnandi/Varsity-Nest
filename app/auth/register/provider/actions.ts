"use server"

import { createUser } from "@/lib/auth"

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
    await createUser(email, password, companyName, "provider")

    return {
      success: true,
      message: "Registration successful! Your account is pending approval.",
    }
  } catch (error: any) {
    console.error("Provider registration error:", error)
    return {
      success: false,
      error: error.message || "Registration failed. Please try again.",
    }
  }
}
