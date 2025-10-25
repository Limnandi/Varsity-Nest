import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromStackAuth } from "@/lib/auth-server"
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

      // Delete all related data (foreign keys with ON DELETE CASCADE should handle most of this)
      // But we'll explicitly delete some for logging purposes
      
      // Delete student-specific data
      await query`DELETE FROM student_profile_audit WHERE student_id = ${studentId}`
      console.log(`[DELETE ACCOUNT] Deleted profile audit records for student: ${studentId}`)

      await query`DELETE FROM student_preferences WHERE student_id = ${studentId}`
      console.log(`[DELETE ACCOUNT] Deleted student preferences for student: ${studentId}`)

      await query`DELETE FROM review_helpfulness WHERE student_id = ${studentId}`
      console.log(`[DELETE ACCOUNT] Deleted review helpfulness records for student: ${studentId}`)

      await query`DELETE FROM review_reports WHERE reporter_id = ${studentId}`
      console.log(`[DELETE ACCOUNT] Deleted review reports for student: ${studentId}`)

      await query`DELETE FROM reply_reports WHERE reporter_id = ${studentId}`
      console.log(`[DELETE ACCOUNT] Deleted reply reports for student: ${studentId}`)

      await query`DELETE FROM review_replies WHERE student_id = ${studentId}`
      console.log(`[DELETE ACCOUNT] Deleted review replies for student: ${studentId}`)

      await query`DELETE FROM reviews WHERE student_id = ${studentId}`
      console.log(`[DELETE ACCOUNT] Deleted reviews for student: ${studentId}`)

      await query`DELETE FROM bookings WHERE student_id = ${studentId}`
      console.log(`[DELETE ACCOUNT] Deleted bookings for student: ${studentId}`)

      await query`DELETE FROM student_wishlist WHERE student_id = ${studentId}`
      console.log(`[DELETE ACCOUNT] Deleted wishlist items for student: ${studentId}`)

      // Delete student record
      await query`DELETE FROM students WHERE id = ${studentId}`
      console.log(`[DELETE ACCOUNT] Deleted student record: ${studentId}`)

      // Delete from StackAuth first (this will invalidate the session)
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
        // Continue to database deletion even if StackAuth fails
      }

      // Then delete from our database
      await query`DELETE FROM users WHERE id = ${user.id}`
      console.log(`[DELETE ACCOUNT] Deleted user account from database: ${user.id}`)

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
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 5 // Very restrictive - only 5 attempts per 15 minutes
    },
    cors: true,
    requestSizeCheck: false
  }
)

