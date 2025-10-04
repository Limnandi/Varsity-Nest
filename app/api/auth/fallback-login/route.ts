import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/database"
import { getStackServerApp } from "@/lib/stack"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Step 1: Try StackAuth first
    try {
      const app = getStackServerApp()
      const stackUser = await app.getUser({ or: "return-null" })
      
      if (stackUser && stackUser.primaryEmail?.toLowerCase() === email.toLowerCase()) {
        // User exists in StackAuth, let StackAuth handle the authentication
        // We'll return a flag indicating StackAuth should be used
        return NextResponse.json({
          useStackAuth: true,
          message: "User found in StackAuth"
        })
      }
    } catch (stackError) {
      // StackAuth failed, continue to database fallback
      console.log("StackAuth check failed, falling back to database:", stackError)
    }

    // Step 2: Fallback to database authentication
    try {
      const userResult = await authenticateUser(email, password)
      
      if (userResult) {
        // User authenticated successfully via database
        return NextResponse.json({
          success: true,
          user: userResult,
          authMethod: "database"
        })
      }
    } catch (dbError) {
      console.error("Database authentication failed:", dbError)
    }

    // Step 3: User not found in either system
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    )

  } catch (error) {
    console.error("Fallback authentication error:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}
