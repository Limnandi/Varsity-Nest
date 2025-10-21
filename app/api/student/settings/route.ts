import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { getCurrentUserFromRequest } from "@/lib/auth-server"
import { z } from "zod"

// Validation schema for settings updates
const settingsUpdateSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  profileVisibility: z.enum(["public", "private", "friends"]).optional(),
  showPhoneNumber: z.boolean().optional(),
  showStudentNumber: z.boolean().optional(),
  twoFactorAuth: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "student") {
      return NextResponse.json({ error: "Student access required" }, { status: 403 })
    }

    // Get student preferences
    const preferences = await secureDb.db
      .select()
      .from(schema.studentPreferences)
      .where(eq(schema.studentPreferences.studentId, user.id))
      .limit(1)

    if (preferences.length === 0) {
      // Create default preferences if none exist
      const defaultPreferences = {
        studentId: user.id,
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        profileVisibility: "public" as const,
        showPhoneNumber: false,
        showStudentNumber: false,
        twoFactorAuth: false,
      }

      await secureDb.db
        .insert(schema.studentPreferences)
        .values(defaultPreferences)

      return NextResponse.json({
        success: true,
        data: defaultPreferences,
        message: "Default settings created"
      })
    }

    return NextResponse.json({
      success: true,
      data: preferences[0],
      message: "Settings retrieved successfully"
    })

  } catch (error) {
    console.error("Error fetching student settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "student") {
      return NextResponse.json({ error: "Student access required" }, { status: 403 })
    }

    const body = await request.json()
    const validation = settingsUpdateSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid input data", 
        details: validation.error.issues 
      }, { status: 400 })
    }

    const updateData = validation.data

    // Check if preferences exist
    const existingPreferences = await secureDb.db
      .select()
      .from(schema.studentPreferences)
      .where(eq(schema.studentPreferences.studentId, user.id))
      .limit(1)

    if (existingPreferences.length === 0) {
      // Create new preferences
      const newPreferences = {
        studentId: user.id,
        emailNotifications: updateData.emailNotifications ?? true,
        smsNotifications: updateData.smsNotifications ?? false,
        marketingEmails: updateData.marketingEmails ?? false,
        profileVisibility: updateData.profileVisibility ?? "public",
        showPhoneNumber: updateData.showPhoneNumber ?? false,
        showStudentNumber: updateData.showStudentNumber ?? false,
        twoFactorAuth: updateData.twoFactorAuth ?? false,
      }

      await secureDb.db
        .insert(schema.studentPreferences)
        .values(newPreferences)

      return NextResponse.json({
        success: true,
        message: "Settings created successfully",
      })
    } else {
      // Update existing preferences
      await secureDb.db
        .update(schema.studentPreferences)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(schema.studentPreferences.studentId, user.id))

      return NextResponse.json({
        success: true,
        message: "Settings updated successfully",
      })
    }

  } catch (error) {
    console.error("Error updating student settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}