"use server"

import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { query } from "./database"
import type { User, SessionPayload } from "./definitions"

const secretKey = process.env.NEXTAUTH_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    console.log("🔍 Authenticating user:", email)

    const result = await query`
      SELECT id, email, password, first_name, last_name, role, is_active, email_verified, created_at 
      FROM users 
      WHERE email = ${email}
    `

    if (!result.rows || result.rows.length === 0) {
      console.log("❌ User not found")
      return null
    }

    const user = result.rows[0]
    console.log("👤 Found user:", { id: user.id, email: user.email, role: user.role })

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      console.log("❌ Invalid password")
      return null
    }

    if (!user.is_active) {
      console.log("❌ User account is not active")
      return null
    }

    console.log("✅ Authentication successful")

    return {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      isVerified: user.email_verified || false,
      isActive: user.is_active,
      createdAt: user.created_at,
      firstName: user.first_name,
      lastName: user.last_name,
    }
  } catch (error) {
    console.error("❌ Authentication error:", error)
    return null
  }
}

export async function createSession(userId: string, role: "admin" | "provider" | "student") {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, role, expiresAt })

  const cookieStore = await cookies()
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("session")?.value
  const session = await decrypt(cookie)
  return session
}

export async function getSessionUser(): Promise<User | null> {
  const session = await getSession()
  if (!session?.userId) return null

  try {
    const result = await query`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, u.email_verified, u.created_at, s.university
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.id = ${session.userId}
    `

    if (!result.rows || result.rows.length === 0) return null

    const user = result.rows[0]
    return {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      isVerified: user.email_verified || false,
      isActive: user.is_active,
      createdAt: user.created_at,
      firstName: user.first_name,
      lastName: user.last_name,
      university: user.university as "UFS" | "CUT" | undefined,
    }
  } catch (error) {
    console.error("Failed to fetch session user:", error)
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  const user = await authenticateUser(email, password)
  if (user) {
    await createSession(user.id, user.role)
    return { success: true, user }
  }
  return { success: false, error: "Invalid credentials" }
}

async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey)
}

async function decrypt(session: string | undefined = ""): Promise<SessionPayload | null> {
  if (!session) return null
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    return payload as unknown as SessionPayload
  } catch (error) {
    console.error("Failed to verify session:", error)
    return null
  }
}

export async function createUser(userData: {
  email: string
  password: string
  firstName: string
  lastName: string
  role: "student" | "provider" | "admin"
  phone?: string
  studentNumber?: string
  institution?: string
}): Promise<User | null> {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    const result = await query`
      INSERT INTO users (email, password, first_name, last_name, role, phone, student_number, institution, created_at, updated_at)
      VALUES (${userData.email}, ${hashedPassword}, ${userData.firstName}, ${userData.lastName}, ${userData.role}, ${userData.phone || null}, ${userData.studentNumber || null}, ${userData.institution || null}, NOW(), NOW())
      RETURNING id, email, first_name, last_name, role, phone, student_number, institution, created_at, updated_at
    `

    const user = result.rows[0]
    return {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      isVerified: false,
      isActive: true,
      createdAt: user.created_at,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      studentNumber: user.student_number,
      institution: user.institution,
    }
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await query`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, u.email_verified, u.created_at, s.university
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.email = ${email}
    `

    if (!result.rows || result.rows.length === 0) return null

    const user = result.rows[0]
    return {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      isVerified: user.email_verified || false,
      isActive: user.is_active,
      createdAt: user.created_at,
      firstName: user.first_name,
      lastName: user.last_name,
      university: user.university as "UFS" | "CUT" | undefined,
    }
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

export async function getAllStudents(): Promise<User[]> {
  try {
    const result = await query`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, u.email_verified, u.created_at, s.university
      FROM users u
      JOIN students s ON u.id = s.user_id
      WHERE u.role = 'student'
      ORDER BY u.created_at DESC
    `

    if (!result.rows) return []

    return result.rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      name: `${row.first_name} ${row.last_name}`,
      role: row.role,
      isVerified: row.email_verified || false,
      isActive: row.is_active,
      createdAt: row.created_at,
      firstName: row.first_name,
      lastName: row.last_name,
      university: row.university as "UFS" | "CUT" | undefined,
    }))
  } catch (error) {
    console.error("Error getting all students:", error)
    return []
  }
}

export async function toggleUserStatus(userId: string, isActive: boolean): Promise<boolean> {
  try {
    await query`UPDATE users SET is_active = ${isActive} WHERE id = ${userId}`
    return true
  } catch (error) {
    console.error("Error toggling user status:", error)
    return false
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    await query`DELETE FROM users WHERE id = ${userId}`
    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}

