import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromStackAuth, invalidateAllUserSessions } from "@/lib/auth-server"
import { query } from "@/lib/database"
import { ApiMiddleware } from "@/lib/api-middleware"
import { ApiErrorResponseBuilder } from "@/lib/api-error-response"
import { getStackServerApp } from "@/lib/stack"

export const DELETE = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      const user = await getCurrentUserFromStackAuth()

      if (!user) {
        return await ApiErrorResponseBuilder.createAuthErrorResponse(
          "Authentication required",
          request,
          { component: 'delete_account' }
        )
      }

      if (user.role !== 'student') {
        return await ApiErrorResponseBuilder.createAuthorizationErrorResponse(
          "Only students can delete their accounts through this endpoint",
          request,
          { component: 'delete_account' }
        )
      }

      console.log(`[DELETE ACCOUNT] Starting account deletion for user: ${user.id}`)

      // Get student ID first
      const studentResult = await query`
        SELECT id FROM students WHERE user_id = ${user.id}
      `

      if (studentResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Student record not found" },
          { status: 404 }
        )
      }

      const studentId = studentResult.rows[0].id

      // Step 1: Invalidate all user sessions first
      try {
        await invalidateAllUserSessions(user.id)
        console.log(`[DELETE ACCOUNT] Invalidated all sessions for user: ${user.id}`)
      } catch (sessionError) {
        console.error(`[DELETE ACCOUNT] Error invalidating sessions:`, sessionError)
      }

      // Step 2: Delete database records
      // CASCADE DELETE should handle related data, but we'll be explicit for audit trail
      try {
        // Delete student record (CASCADE will handle related data)
        await query`DELETE FROM students WHERE id = ${studentId}`
        console.log(`[DELETE ACCOUNT] Deleted student record and all related data: ${studentId}`)

        // Delete user record (CASCADE will handle any remaining data)
        await query`DELETE FROM users WHERE id = ${user.id}`
        console.log(`[DELETE ACCOUNT] Deleted user record from database: ${user.id}`)
      } catch (dbError) {
        console.error(`[DELETE ACCOUNT] Database deletion error:`, dbError)
        throw new Error(`Failed to delete user data from database: ${dbError instanceof Error ? dbError.message : String(dbError)}`)
      }

      // Step 3: Delete from StackAuth (last, after database cleanup)
      try {
        const stackApp = getStackServerApp()
        const stackUser = await stackApp.getUser(user.id)
        
        if (stackUser) {
          await stackUser.delete()
          console.log(`[DELETE ACCOUNT] Deleted user from StackAuth: ${user.id}`)
        } else {
          console.log(`[DELETE ACCOUNT] User not found in StackAuth (may have been already deleted): ${user.id}`)
        }
      } catch (stackError) {
        console.error(`[DELETE ACCOUNT] Error deleting from StackAuth:`, stackError)
        console.warn(`[DELETE ACCOUNT] Database cleanup completed but StackAuth deletion failed. Manual cleanup may be required for user: ${user.id}`)
      }

      console.log(`[DELETE ACCOUNT] Account deletion completed successfully for user: ${user.id}`)

      return ApiMiddleware.createResponse(
        { success: true },
        "Account deleted successfully"
      )
    } catch (error) {
      console.error("[DELETE ACCOUNT] Error:", error)
      return await ApiErrorResponseBuilder.createErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        request,
        { component: 'delete_account' }
      )
    }
  },
  {
    rateLimit: false, // Disable rate limiting for delete account endpoint
    cors: true,
    requestSizeCheck: false
  }
)

