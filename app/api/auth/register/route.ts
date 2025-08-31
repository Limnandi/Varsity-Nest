import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, role } = body

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const existingUser = await query`
      SELECT id FROM users WHERE email = ${email}
    `
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    const passwordHash = password

    const userResult = await query`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
      VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName}, ${role}, true, NOW(), NOW())
      RETURNING id
    `

    return NextResponse.json(
      { success: true, message: "User registered successfully" },
      { status: 201 }
    )

  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    )
  }
}
