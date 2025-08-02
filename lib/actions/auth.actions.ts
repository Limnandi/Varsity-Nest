"use server"

import bcrypt from "bcryptjs"
import { createSession, deleteSession } from "@/lib/auth"
import { query } from "@/lib/database"
import { LoginFormSchema, ProviderRegisterFormSchema, StudentRegisterFormSchema } from "@/lib/definitions"
import { redirect } from "next/navigation"

// A utility function to validate student emails
async function isStudentEmailDomainValid(email: string): Promise<boolean> {
  try {
    const result = await query("SELECT value FROM admin_settings WHERE key = 'email_domains'", [])
    if (result.rows.length === 0) {
      // Default if not set in DB
      return email.endsWith(".ac.za")
    }
    const allowedDomains = result.rows[0].value as string[]
    return allowedDomains.some((domain) => email.endsWith(domain))
  } catch (error) {
    console.error("Error fetching student email domains:", error)
    return false // Fail safely
  }
}

export async function login(prevState: any, formData: FormData) {
  const validatedFields = LoginFormSchema.safeParse(Object.fromEntries(formData.entries()))

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields. Please check your input.",
    }
  }

  const { email, password } = validatedFields.data

  try {
    const result = await query("SELECT id, email, first_name, last_name, password, role, is_active, email_verified, created_at FROM users WHERE email = $1", [
      email.toLowerCase(),
    ])
    const user = result.rows[0]

    if (!user) {
      return { message: "Invalid email or password." }
    }

    if (!user.is_active) {
      return { message: "Your account has been deactivated. Please contact support." }
    }

    const passwordsMatch = await bcrypt.compare(password, user.password)

    if (!passwordsMatch) {
      return { message: "Invalid email or password." }
    }

    await createSession({
      id: user.id,
      email: user.email,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      role: user.role,
      isVerified: user.email_verified || false,
      isActive: user.is_active,
      createdAt: user.created_at,
      firstName: user.first_name || '',
      lastName: user.last_name || ''
    })
  } catch (error) {
    console.error("Login error:", error)
    return { message: "An unexpected error occurred. Please try again." }
  }

  // Redirect is handled on the client-side after successful state update
  return { success: true }
}

export async function registerStudent(prevState: any, formData: FormData) {
  const validatedFields = StudentRegisterFormSchema.safeParse(Object.fromEntries(formData.entries()))

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields. Please check your input.",
    }
  }

  const { email, password, university, studentNumber } = validatedFields.data
  const lowerCaseEmail = email.toLowerCase()

  const isEmailValid = await isStudentEmailDomainValid(lowerCaseEmail)
  if (!isEmailValid) {
    return { message: "Please use a valid student email address from a supported institution." }
  }

  try {
    const existingUserResult = await query("SELECT id FROM users WHERE email = $1", [lowerCaseEmail])
    if (existingUserResult.rows.length > 0) {
      return { message: "An account with this email already exists." }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const userResult = await query(
      "INSERT INTO users (email, password, first_name, last_name, role, email_verified) VALUES ($1, $2, $3, $4, 'student', true) RETURNING id, email, first_name, last_name",
      [lowerCaseEmail, hashedPassword, '', ''],
    )
    const newUser = userResult.rows[0]

    await query("INSERT INTO students (user_id, university, student_number) VALUES ($1, $2, $3)", [
      newUser.id,
      university,
      studentNumber,
    ])

    await createSession({
      id: newUser.id,
      email: newUser.email,
      name: `${newUser.first_name || ''} ${newUser.last_name || ''}`.trim() || 'Student',
      role: "student",
      isVerified: true,
      isActive: true,
      createdAt: new Date(),
      firstName: newUser.first_name || '',
      lastName: newUser.last_name || ''
    })
  } catch (error) {
    console.error("Student registration error:", error)
    return { message: "An unexpected error occurred during registration." }
  }

  return { success: true }
}

export async function registerProvider(prevState: any, formData: FormData) {
  const validatedFields = ProviderRegisterFormSchema.safeParse(Object.fromEntries(formData.entries()))

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields. Please check your input.",
    }
  }

  const { email, password, businessName, contactPerson, contactPhone } = validatedFields.data
  const lowerCaseEmail = email.toLowerCase()

  try {
    const existingUserResult = await query("SELECT id FROM users WHERE email = $1", [lowerCaseEmail])
    if (existingUserResult.rows.length > 0) {
      return { message: "An account with this email already exists." }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const userResult = await query(
      "INSERT INTO users (email, password, first_name, last_name, role, email_verified) VALUES ($1, $2, $3, $4, 'provider', false) RETURNING id",
      [lowerCaseEmail, hashedPassword, contactPerson, ''],
    )
    const newUser = userResult.rows[0]

    await query("INSERT INTO service_providers (user_id, company_name, contact_number) VALUES ($1, $2, $3)", [
      newUser.id,
      businessName,
      contactPhone,
    ])

    // Providers are not logged in automatically. They need verification.
  } catch (error) {
    console.error("Provider registration error:", error)
    return { message: "An unexpected error occurred during registration." }
  }

  return { success: true, message: "Registration successful! Your account is pending verification." }
}

export async function logout() {
  await deleteSession()
  redirect("/")
}
