import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { getCurrentUserFromRequest } from "@/lib/auth-server"
import { z } from "zod"
import bcrypt from "bcryptjs"

// Validation schema for password change
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long"),
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "student") {
      return NextResponse.json({ error: "Student access required" }, { status: 403 })
    }

    const body = await request.json()
    const validation = passwordChangeSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid input data", 
        details: validation.error.issues 
      }, { status: 400 })
    }

    const { currentPassword, newPassword } = validation.data

    // Get current user data with password
    const userData = await secureDb.db
      .select({
        id: schema.users.id,
        password: schema.users.password,
        email: schema.users.email,
      })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1)

    if (userData.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const currentUser = userData[0]

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, currentUser.password)
    if (isSamePassword) {
      return NextResponse.json({ error: "New password must be different from current password" }, { status: 400 })
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await secureDb.db
      .update(schema.users)
      .set({
        password: hashedNewPassword,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id))

    // Log password change for security audit
    console.log(`Password changed for user ${user.id} (${currentUser.email})`)

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    })

  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}