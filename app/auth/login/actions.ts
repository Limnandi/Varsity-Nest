"use server"

import { login } from "@/lib/auth"
import { verifyRecaptcha } from "@/lib/recaptcha"

export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const recaptchaToken = formData.get("g-recaptcha-response") as string

  const recaptchaResult = await verifyRecaptcha(recaptchaToken)
  if (!recaptchaResult.success) {
    return { success: false, error: recaptchaResult.message || "reCAPTCHA verification failed." }
  }

  try {
    const result = await login(email, password)

    if (!result.success || !result.user) {
      return { success: false, error: result.error || "Invalid email or password." }
    }

    const { user } = result
    let redirectTo = "/"
    if (user.role === "admin") {
      redirectTo = "/admin/dashboard"
    } else if (user.role === "provider") {
      redirectTo = "/provider/dashboard"
    } else if (user.role === "student") {
      redirectTo = "/student/dashboard"
    }

    // The client-side will handle the redirect based on this state
    return { success: true, redirectTo }
  } catch (error) {
    console.error(error)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}
