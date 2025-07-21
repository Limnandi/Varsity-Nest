"use server"

export async function verifyRecaptcha(token: string | null) {
  if (!token) {
    return { success: false, message: "reCAPTCHA token is missing." }
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    console.error("RECAPTCHA_SECRET_KEY is not set.")
    // In development, you might want to bypass this check
    if (process.env.NODE_ENV !== "production") {
      return { success: true, message: "reCAPTCHA bypassed in development." }
    }
    return { success: false, message: "Server configuration error." }
  }

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
