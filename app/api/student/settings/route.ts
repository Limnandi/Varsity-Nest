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
  showEmail: z.boolean().optional(),
  twoFactorAuth: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Try secure JWT session first
    let user = await getCurrentUserFromRequest(request)
    
    // Fallback to StackAuth if no JWT session
    if (!user) {
      const { getCurrentUserFromStackAuth } = await import("@/lib/auth-server")
      user = await getCurrentUserFromStackAuth()
    }
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "student") {
      return NextResponse.json({ error: "Student access required" }, { status: 403 })
    }

    // Get student preferences with student ID lookup in a single query
    const preferences = await secureDb.db
      .select({
        id: schema.studentPreferences.id,
        studentId: schema.studentPreferences.studentId,
        emailNotifications: schema.studentPreferences.emailNotifications,
        smsNotifications: schema.studentPreferences.smsNotifications,
        marketingEmails: schema.studentPreferences.marketingEmails,
        profileVisibility: schema.studentPreferences.profileVisibility,
        showPhoneNumber: schema.studentPreferences.showPhoneNumber,
        showStudentNumber: schema.studentPreferences.showStudentNumber,
        showEmail: schema.studentPreferences.showEmail,
        twoFactorAuth: schema.studentPreferences.twoFactorAuth,
        createdAt: schema.studentPreferences.createdAt,
        updatedAt: schema.studentPreferences.updatedAt,
        studentRecordId: schema.students.id,
      })
      .from(schema.studentPreferences)
      .innerJoin(schema.students, eq(schema.studentPreferences.studentId, schema.students.id))
      .where(eq(schema.students.userId, user.id))
      .limit(1)

    if (preferences.length === 0) {
      // Get student ID to create preferences
      const studentRecord = await secureDb.db
        .select({ id: schema.students.id })
        .from(schema.students)
        .where(eq(schema.students.userId, user.id))
        .limit(1)

      if (studentRecord.length === 0) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
      }

      const studentId = studentRecord[0].id

      // Create default preferences if none exist
      const defaultPreferences = {
        studentId: studentId,
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        profileVisibility: "public" as const,
        showPhoneNumber: false,
        showStudentNumber: false,
        showEmail: true,
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

    // Extract only preference fields (exclude studentRecordId)
    const { studentRecordId, ...preferenceData } = preferences[0]

    return NextResponse.json({
      success: true,
      data: preferenceData,
      message: "Settings retrieved successfully"
    })

  } catch (error) {
    console.error("Error fetching student settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Try secure JWT session first
    let user = await getCurrentUserFromRequest(request)
    
    // Fallback to StackAuth if no JWT session
    if (!user) {
      const { getCurrentUserFromStackAuth } = await import("@/lib/auth-server")
      user = await getCurrentUserFromStackAuth()
    }
    
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

    // Check if preferences exist with student ID lookup in a single query
    const existingPreferences = await secureDb.db
      .select({
        id: schema.studentPreferences.id,
        studentId: schema.studentPreferences.studentId,
        studentRecordId: schema.students.id,
      })
      .from(schema.studentPreferences)
      .innerJoin(schema.students, eq(schema.studentPreferences.studentId, schema.students.id))
      .where(eq(schema.students.userId, user.id))
      .limit(1)

    if (existingPreferences.length === 0) {
      // Get student ID to create preferences
      const studentRecord = await secureDb.db
        .select({ id: schema.students.id })
        .from(schema.students)
        .where(eq(schema.students.userId, user.id))
        .limit(1)

      if (studentRecord.length === 0) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
      }

      const studentId = studentRecord[0].id

      // Create new preferences
      const newPreferences = {
        studentId: studentId,
        emailNotifications: updateData.emailNotifications ?? true,
        smsNotifications: updateData.smsNotifications ?? false,
        marketingEmails: updateData.marketingEmails ?? false,
        profileVisibility: updateData.profileVisibility ?? "public",
        showPhoneNumber: updateData.showPhoneNumber ?? false,
        showStudentNumber: updateData.showStudentNumber ?? false,
        showEmail: updateData.showEmail ?? true,
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
      // Update existing preferences using the studentId from the query
      const studentId = existingPreferences[0].studentId
      
      await secureDb.db
        .update(schema.studentPreferences)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(schema.studentPreferences.studentId, studentId))

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