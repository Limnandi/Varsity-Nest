"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { jwtVerify } from "jose"
import { encodedKey } from "./auth-constants"

export interface SessionUser {
  id: string
  email: string
  name: string
  role: "admin" | "provider" | "student"
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return null
    }

    const { payload } = await jwtVerify(sessionCookie.value, encodedKey, {
      algorithms: ["HS256"],
    })
    
    // Validate payload matches SessionUser structure
    if (payload &&
        typeof (payload as any).id === 'string' &&
        typeof (payload as any).email === 'string' &&
        typeof (payload as any).name === 'string' &&
        (payload as any).role &&
        typeof (payload as any).role === 'string' &&
        ['admin','provider','student'].includes((payload as any).role)) {
      return {
        id: (payload as any).id,
        email: (payload as any).email,
        name: (payload as any).name,
        role: (payload as any).role
      }
    }
    return null
  } catch (error) {
    console.error("Session verification error:", error)
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
  cookieStore.delete("session")
  redirect("/")
}
