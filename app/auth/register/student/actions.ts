"use server"

import { createUser, createSession, getUserByEmail } from "@/lib/auth"
import { verifyRecaptcha } from "@/lib/recaptcha"
import { redirect } from "next/navigation"
import { z } from "zod"

const StudentRegisterSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export async function registerStudent(prevState: any, formData: FormData) {
  const recaptchaToken = formData.get("g-recaptcha-response") as string
  const recaptchaResult = await verifyRecaptcha(recaptchaToken)
  if (!recaptchaResult.success) {
    return { success: false, message: recaptchaResult.message || "reCAPTCHA verification failed." }
  }

  const validatedFields = StudentRegisterSchema.safeParse(Object.fromEntries(formData.entries()))

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password, firstName, lastName } = validatedFields.data

  try {
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return { success: false, message: "An account with this email already exists." }
    }

    const newUser = await createUser({
      email,
      password,
      firstName,
      lastName,
      role: "student",
    })

    if (!newUser) {
      return { success: false, message: "Failed to create account. Please try again." }
    }

    // Automatically log the user in
    await createSession(newUser.id, "student")
  } catch (error) {
    console.error("Student registration error:", error)
    return { success: false, message: "An unexpected error occurred." }
  }

  // Redirect to dashboard with a flag for the welcome message
  redirect("/student/dashboard?new_user=true")
}
