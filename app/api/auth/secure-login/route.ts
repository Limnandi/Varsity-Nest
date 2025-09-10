import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { createSecureSession } from "@/lib/auth-server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Get user from database
    const userResult = await query`
      SELECT u.id, u.email, u.password, u.first_name, u.last_name, u.role, u.phone, u.student_number, u.institution,
             u.is_active, u.email_verified, u.created_at, u.updated_at,
             s.university, s.year_of_study, s.course, s.emergency_contact_name, s.emergency_contact_phone
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.email = ${email.toLowerCase().trim()}
    `

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const userData = userResult.rows[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!userData.is_active) {
      return NextResponse.json(
        { error: "Account is deactivated" },
        { status: 403 }
      )
    }

    // Create secure session
    const user = {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      role: userData.role,
      phone: userData.phone,
      studentNumber: userData.student_number,
      institution: userData.institution,
      isActive: userData.is_active,
      emailVerified: userData.email_verified,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
      university: userData.university,
      yearOfStudy: userData.year_of_study,
      course: userData.course,
      emergencyContactName: userData.emergency_contact_name,
      emergencyContactPhone: userData.emergency_contact_phone,
    }

    const sessionToken = await createSecureSession(user)

    // Set secure HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        studentNumber: user.studentNumber,
        institution: user.institution,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        university: user.university,
        yearOfStudy: user.yearOfStudy,
        course: user.course,
        emergencyContactName: user.emergencyContactName,
        emergencyContactPhone: user.emergencyContactPhone,
      }
    })

    response.cookies.set('varsity-nest-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error("Secure login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
