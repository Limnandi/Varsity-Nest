import { NextRequest, NextResponse } from "next/server"
import { postgrest } from "@/lib/postgrest"

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

    const existingUser = await postgrest.single<any>("users", { email })
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    const passwordHash = password

    await postgrest.post("users", {
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role,
      is_active: true
    })

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
