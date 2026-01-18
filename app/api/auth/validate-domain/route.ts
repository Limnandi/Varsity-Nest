import { NextRequest, NextResponse } from "next/server"
import { DomainValidationService } from "@/lib/domain-validation"

export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          isValid: false, 
          error: "Invalid email format" 
        },
        { status: 400 }
      )
    }

    // Only validate domain whitelisting for students
    // Agents and providers can use any email domain
    // Default to student validation if role is not provided (for backward compatibility)
    if (role === 'student' || !role) {
      // Check if email domain is whitelisted in database
      const validationResult = await DomainValidationService.isEmailWhitelisted(email)
      return NextResponse.json(validationResult)
    } else {
      // For agents and providers, always return valid (no domain restriction)
      return NextResponse.json({
        isValid: true,
        university: undefined
      })
    }
  } catch (error) {
    console.error('Domain validation error:', error)
    return NextResponse.json(
      { 
        isValid: false, 
        error: "Failed to validate email domain" 
      },
      { status: 500 }
    )
  }
}

