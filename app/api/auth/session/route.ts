import { NextRequest, NextResponse } from "next/server"
import { getStackServerApp } from "@/lib/stack"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const app = getStackServerApp()
    const user = await app.getUser({ or: "return-null" })
    
    if (!user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get user data from database
    const userResult = await query`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.student_number, u.institution, 
             u.is_active, u.email_verified, u.created_at, u.updated_at,
             s.university, s.year_of_study, s.course, s.emergency_contact_name, s.emergency_contact_phone
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.id = ${user.id}
    `
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    const userData = userResult.rows[0]
    
    return NextResponse.json({
      userId: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      name: `${userData.first_name} ${userData.last_name}`.trim(),
      role: userData.role,
      phone: userData.phone,
      studentNumber: userData.student_number,
      institution: userData.institution,
      isActive: userData.is_active,
      emailVerified: userData.email_verified,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
      university: userData.university,
      yearOfStudy: userData.year_of_study,
      course: userData.course,
      emergencyContactName: userData.emergency_contact_name,
      emergencyContactPhone: userData.emergency_contact_phone,
    })
  } catch (error) {
    console.error("Session API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
