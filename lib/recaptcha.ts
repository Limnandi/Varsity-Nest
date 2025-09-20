"use server"

import { env } from "@/lib/env"

export async function verifyRecaptcha(token: string | null) {
  if (!token) {
    return { success: false, message: "reCAPTCHA token is missing." }
  }

  const secretKey = env.RECAPTCHA_SECRET_KEY

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    })

    const data = await response.json()

    if (data.success) {
      return { success: true }
    } else {
      return { success: false, message: "reCAPTCHA verification failed.", errors: data["error-codes"] }
    }
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error)
    return { success: false, message: "Could not verify reCAPTCHA. Please try again." }
  }
}
