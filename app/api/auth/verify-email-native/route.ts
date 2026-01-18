import { NextRequest, NextResponse } from "next/server"
import { ApiErrorResponseBuilder } from "@/lib/api-error-response"
import { query } from "@/lib/database"
import { redis } from "@/lib/redis"
import { getStackServerApp } from "@/lib/stack"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"

export async function POST(request: NextRequest) {
  try {
    const { code, token, userId: providedUserId } = await request.json()

    if (!code) {
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { code: "Verification code is required" },
        request
      )
    }

    // Get userId from multiple sources (priority order):
    // 1. Directly provided userId
    // 2. From Redis token
    // 3. Will be extracted from StackAuth response or queries below
    let userId = providedUserId || null
    if (!userId && token) {
      userId = await redis.get(`verify:${token}`)
      if (userId) {
        // Clean up the token
        await redis.del(`verify:${token}`)
      }
    }
    
    if (userId) {
      console.log(`verify-email-native: Using userId from request: ${userId}`)
    }

    // Verify the email using StackAuth's REST API
    const response = await fetch('https://api.stack-auth.com/api/v1/contact-channels/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-stack-access-type': 'server',
        'x-stack-project-id': process.env.STACK_PROJECT_ID!,
        'x-stack-secret-server-key': process.env.STACK_SECRET_SERVER_KEY!,
      },
      body: JSON.stringify({
        code: code
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { code: errorData.message || 'Invalid verification code' },
        request
      )
    }

    const result = await response.json()
    
    if (!result.success) {
      return await ApiErrorResponseBuilder.createValidationErrorResponse(
        { code: 'Invalid verification code' },
        request
      )
    }

    console.log('verify-email-native: StackAuth verification response:', JSON.stringify(result, null, 2))

    // Extract userId from StackAuth response if available
    let verifiedUserId = result.userId || result.user?.id || result.data?.userId || result.data?.user?.id || result.contactChannel?.userId || userId
    
    // If we still don't have userId, try to get it from the verified email in the response
    if (!verifiedUserId) {
      const verifiedEmail = result.email || result.data?.email || result.user?.primaryEmail || result.contactChannel?.value
      if (verifiedEmail) {
        try {
          console.log(`verify-email-native: Looking up user by verified email: ${verifiedEmail}`)
          const [userByEmail] = await secureDb.db
            .select({ id: schema.users.id })
            .from(schema.users)
            .where(eq(schema.users.email, verifiedEmail))
            .limit(1)
          
          if (userByEmail?.id) {
            verifiedUserId = userByEmail.id
            console.log(`verify-email-native: Found user ${verifiedUserId} by email`)
          }
        } catch (emailLookupError) {
          console.error('verify-email-native: Failed to lookup user by email:', emailLookupError)
        }
      }
    }
    
    // If still no userId, try to get it from StackAuth by querying all users with verified emails
    // This is a fallback when the verification response doesn't include userId
    if (!verifiedUserId) {
      try {
        console.log('verify-email-native: Attempting to find user by querying StackAuth for recently verified emails...')
        const stackApp = getStackServerApp()
        
        // Get all users from our database and check which one has unverified email
        // Then verify with StackAuth if that user's email is now verified
        const unverifiedUsers = await secureDb.db
          .select({ id: schema.users.id, email: schema.users.email })
          .from(schema.users)
          .where(eq(schema.users.emailVerified, false))
          .limit(50) // Limit to avoid too many queries
        
        console.log(`verify-email-native: Found ${unverifiedUsers.length} unverified users, checking StackAuth...`)
        
        for (const user of unverifiedUsers) {
          try {
            const stackUser = await stackApp.getUser(user.id)
            if (stackUser?.primaryEmailVerified) {
              verifiedUserId = user.id
              console.log(`verify-email-native: Found verified user ${verifiedUserId} (${user.email}) from StackAuth`)
              break
            }
          } catch (userCheckError) {
            // Skip users that don't exist in StackAuth
            continue
          }
        }
      } catch (queryError) {
        console.error('verify-email-native: Failed to query users:', queryError)
      }
    }
    
    // Update our database to mark email as verified
    if (verifiedUserId) {
      try {
        console.log(`verify-email-native: Updating email_verified for user ${verifiedUserId}`)
        
        // Use secureDb for consistency with the rest of the codebase
        const [updatedUser] = await secureDb.db
          .update(schema.users)
          .set({ 
            emailVerified: true,
            updatedAt: new Date()
          })
          .where(eq(schema.users.id, verifiedUserId))
          .returning({ id: schema.users.id, emailVerified: schema.users.emailVerified })
        
        if (updatedUser) {
          console.log(`verify-email-native: Email verification update query executed for user ${verifiedUserId}, emailVerified: ${updatedUser.emailVerified}`)
          
          // Verify the update worked
          const [verifyCheck] = await secureDb.db
            .select({ emailVerified: schema.users.emailVerified, email: schema.users.email })
            .from(schema.users)
            .where(eq(schema.users.id, verifiedUserId))
            .limit(1)
          
          if (verifyCheck && verifyCheck.emailVerified === true) {
            console.log(`verify-email-native: CONFIRMED email_verified is true for user ${verifiedUserId} (${verifyCheck.email})`)
          } else {
            console.error(`verify-email-native: CRITICAL - email_verified is still false for user ${verifiedUserId} after update!`)
            console.error(`verify-email-native: Current state:`, verifyCheck)
          }
        } else {
          console.error(`verify-email-native: CRITICAL - No user was updated! User ${verifiedUserId} may not exist in database.`)
        }
      } catch (error) {
        console.error('verify-email-native: Failed to update email verification status:', error)
        console.error('verify-email-native: Error details:', {
          code: (error as any)?.code,
          message: (error as any)?.message,
          detail: (error as any)?.detail
        })
        // Don't fail the verification if DB update fails, but log it
      }
    } else {
      console.warn('verify-email-native: No userId available to update email verification status. StackAuth response:', result)
      console.warn('verify-email-native: This verification will rely on the webhook to update the database.')
      console.warn('verify-email-native: Please ensure StackAuth webhook is configured to send user.verified events.')
    }
    
    // Final sync: If we updated the database, verify it's in sync with StackAuth
    if (verifiedUserId) {
      try {
        console.log(`verify-email-native: Performing final sync check for user ${verifiedUserId}...`)
        const stackApp = getStackServerApp()
        const stackUser = await stackApp.getUser(verifiedUserId)
        
        if (stackUser?.primaryEmailVerified) {
          // Double-check our database is updated
          const [finalCheck] = await secureDb.db
            .select({ emailVerified: schema.users.emailVerified })
            .from(schema.users)
            .where(eq(schema.users.id, verifiedUserId))
            .limit(1)
          
          if (!finalCheck || !finalCheck.emailVerified) {
            console.warn(`verify-email-native: Database out of sync! StackAuth says verified but DB says not verified. Updating...`)
            await secureDb.db
              .update(schema.users)
              .set({ 
                emailVerified: true,
                updatedAt: new Date()
              })
              .where(eq(schema.users.id, verifiedUserId))
            console.log(`verify-email-native: Database synced with StackAuth for user ${verifiedUserId}`)
          } else {
            console.log(`verify-email-native: Database confirmed in sync with StackAuth for user ${verifiedUserId}`)
          }
        } else {
          console.warn(`verify-email-native: WARNING - StackAuth says email is NOT verified for user ${verifiedUserId}`)
        }
      } catch (syncError) {
        console.error('verify-email-native: Failed to perform final sync check:', syncError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Email verified successfully",
      userId: verifiedUserId || userId,
      databaseUpdated: !!verifiedUserId
    })

  } catch (error: any) {
    console.error("Email verification error:", error)
    return await ApiErrorResponseBuilder.createErrorResponse(
      error,
      request,
      { operation: "verify_email" }
    )
  }
}
