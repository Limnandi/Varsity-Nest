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

    const existingRes = await query`SELECT id FROM users WHERE email = ${email} LIMIT 1`
    const existingUser = existingRes.rows?.[0]
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    const passwordHash = password

    await query`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
      VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName}, ${role}, true)
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
