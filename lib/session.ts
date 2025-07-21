"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export interface SessionUser {
  id: string
  email: string
  name: string
  role: "admin" | "provider" | "student"
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("varsitynest_session")

    if (!sessionCookie) {
      return null
    }

    const session = JSON.parse(sessionCookie.value)
    return session
  } catch (error) {
    console.error("Session parsing error:", error)
    return null
  }
}

export async function requireAuth(allowedRoles?: string[]): Promise<SessionUser> {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    redirect("/unauthorized")
  }

  return session
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("varsitynest_session")
  redirect("/")
}
