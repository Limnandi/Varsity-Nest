import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { getCurrentUserFromRequest } from "@/lib/auth-server"
import { z } from "zod"

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  phone: z.string().optional(),
  yearOfStudy: z.number().int().min(1).max(10).optional(),
  course: z.string().max(200, "Course name too long").optional(),
  emergencyContactName: z.string().max(100, "Emergency contact name too long").optional(),
  emergencyContactPhone: z.string().max(20, "Emergency contact phone too long").optional(),
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

    // Get student data with preferences
    const studentData = await secureDb.db
      .select({
        id: schema.students.id,
        userId: schema.students.userId,
        studentNumber: schema.students.studentNumber,
        university: schema.students.university,
        yearOfStudy: schema.students.yearOfStudy,
        course: schema.students.course,
        emergencyContactName: schema.students.emergencyContactName,
        emergencyContactPhone: schema.students.emergencyContactPhone,
        user: {
          id: schema.users.id,
          email: schema.users.email,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          phone: schema.users.phone,
          profileImageUrl: schema.users.profileImageUrl,
          profileImageCloudinaryId: schema.users.profileImageCloudinaryId,
          isActive: schema.users.isActive,
          emailVerified: schema.users.emailVerified,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt,
        }
      })
      .from(schema.students)
      .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
      .where(eq(schema.students.userId, user.id))
      .limit(1)

    if (studentData.length === 0) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    const student = studentData[0]

    return NextResponse.json({
      success: true,
      data: {
        id: student.id,
        userId: student.userId,
        email: student.user.email,
        name: `${student.user.firstName} ${student.user.lastName}`.trim(),
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        phone: student.user.phone,
        profileImageUrl: student.user.profileImageUrl,
        studentNumber: student.studentNumber,
        university: student.university,
        yearOfStudy: student.yearOfStudy,
        course: student.course,
        emergencyContactName: student.emergencyContactName,
        emergencyContactPhone: student.emergencyContactPhone,
        isActive: student.user.isActive,
        emailVerified: student.user.emailVerified,
        createdAt: student.user.createdAt,
        updatedAt: student.user.updatedAt,
      },
      message: "Student profile retrieved successfully"
    })

  } catch (error) {
    console.error("Error fetching student profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
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
    const validation = profileUpdateSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid input data", 
        details: validation.error.issues 
      }, { status: 400 })
    }

    const { name, phone, yearOfStudy, course, emergencyContactName, emergencyContactPhone } = validation.data

    // Split name into first and last name
    const nameParts = name.trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    // Get current student data for audit
    const currentStudent = await secureDb.db
      .select({
        id: schema.students.id,
        yearOfStudy: schema.students.yearOfStudy,
        course: schema.students.course,
        emergencyContactName: schema.students.emergencyContactName,
        emergencyContactPhone: schema.students.emergencyContactPhone,
        user: {
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          phone: schema.users.phone,
        }
      })
      .from(schema.students)
      .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
      .where(eq(schema.students.userId, user.id))
      .limit(1)

    if (currentStudent.length === 0) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    const current = currentStudent[0]

    // Update user table
    await secureDb.db
      .update(schema.users)
      .set({
        firstName,
        lastName,
        phone: phone || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id))

    // Update student table
    await secureDb.db
      .update(schema.students)
      .set({
        yearOfStudy: yearOfStudy || null,
        course: course || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.students.userId, user.id))

    // Create audit records for changed fields
    const auditRecords = []

    if (current.user.firstName !== firstName) {
      auditRecords.push({
        studentId: current.id,
        fieldName: "firstName",
        oldValue: current.user.firstName,
        newValue: firstName,
        updatedBy: user.id,
      })
    }

    if (current.user.lastName !== lastName) {
      auditRecords.push({
        studentId: current.id,
        fieldName: "lastName",
        oldValue: current.user.lastName,
        newValue: lastName,
        updatedBy: user.id,
      })
    }

    if (current.user.phone !== phone) {
      auditRecords.push({
        studentId: current.id,
        fieldName: "phone",
        oldValue: current.user.phone,
        newValue: phone,
        updatedBy: user.id,
      })
    }

    if (current.yearOfStudy !== yearOfStudy) {
      auditRecords.push({
        studentId: current.id,
        fieldName: "yearOfStudy",
        oldValue: current.yearOfStudy?.toString(),
        newValue: yearOfStudy?.toString(),
        updatedBy: user.id,
      })
    }

    if (current.course !== course) {
      auditRecords.push({
        studentId: current.id,
        fieldName: "course",
        oldValue: current.course,
        newValue: course,
        updatedBy: user.id,
      })
    }

    if (current.emergencyContactName !== emergencyContactName) {
      auditRecords.push({
        studentId: current.id,
        fieldName: "emergencyContactName",
        oldValue: current.emergencyContactName,
        newValue: emergencyContactName,
        updatedBy: user.id,
      })
    }

    if (current.emergencyContactPhone !== emergencyContactPhone) {
      auditRecords.push({
        studentId: current.id,
        fieldName: "emergencyContactPhone",
        oldValue: current.emergencyContactPhone,
        newValue: emergencyContactPhone,
        updatedBy: user.id,
      })
    }

    // Insert audit records if any changes were made
    if (auditRecords.length > 0) {
      await secureDb.db
        .insert(schema.studentProfileAudit)
        .values(auditRecords)
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      changesCount: auditRecords.length,
    })

  } catch (error) {
    console.error("Error updating student profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}