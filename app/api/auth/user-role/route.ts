import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/stackauth"

export async function GET(_request: NextRequest) {
  try {
    // Get the current user from StackAuth
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Return the user's role
    return NextResponse.json({
      role: user.role,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    })
  } catch (error) {
    console.error("User role fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch user role" },
      { status: 500 }
    )
  }
}
