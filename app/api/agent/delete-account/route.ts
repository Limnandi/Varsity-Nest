import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromStackAuth, invalidateAllUserSessions } from "@/lib/auth-server"
import { query } from "@/lib/database"
import { ApiMiddleware } from "@/lib/api-middleware"
import { ApiErrorResponseBuilder } from "@/lib/api-error-response"
import { getStackServerApp } from "@/lib/stack"
import { deleteImages } from "@/lib/cloudinary"

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

      if (user.role !== 'agent') {
        return await ApiErrorResponseBuilder.createAuthorizationErrorResponse(
          "Only agents can delete their accounts through this endpoint",
          request,
          { component: 'delete_account' }
        )
      }

      console.log(`[DELETE ACCOUNT] Starting account deletion for agent user: ${user.id}`)

      // Get agent ID first
      const agentResult = await query`
        SELECT id FROM agents WHERE user_id = ${user.id} LIMIT 1
      `

      if (agentResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Agent record not found" },
          { status: 404 }
        )
      }

      const agentId = agentResult.rows[0].id

      // Step 1: Get all accommodations for this agent to delete their images from Cloudinary
      const accommodationsResult = await query`
        SELECT id, images, card_image_url 
        FROM accommodations 
        WHERE agent_id = ${agentId}
      `

      console.log(`[DELETE ACCOUNT] Found ${accommodationsResult.rows.length} accommodations to delete`)

      // Step 2: Delete all accommodation images from Cloudinary
      const allImagesToDelete: string[] = []
      for (const accommodation of accommodationsResult.rows) {
        const images = Array.isArray(accommodation.images) ? accommodation.images : []
        const cardImage = accommodation.card_image_url
        
        // Add all property images
        allImagesToDelete.push(...images)
        
        // Add card image if it exists and isn't already in the images array
        if (cardImage && !images.includes(cardImage)) {
          allImagesToDelete.push(cardImage)
        }
      }

      if (allImagesToDelete.length > 0) {
        console.log(`[DELETE ACCOUNT] Deleting ${allImagesToDelete.length} images from Cloudinary`)
        const deleteResult = await deleteImages(allImagesToDelete)
        if (!deleteResult.success) {
          console.warn(`[DELETE ACCOUNT] Failed to delete some images from Cloudinary:`, deleteResult.error)
        } else {
          console.log(`[DELETE ACCOUNT] Successfully deleted images from Cloudinary`)
        }
      }

      // Step 3: Delete all accommodations (CASCADE will handle related data)
      if (accommodationsResult.rows.length > 0) {
        await query`DELETE FROM accommodations WHERE agent_id = ${agentId}`
        console.log(`[DELETE ACCOUNT] Deleted ${accommodationsResult.rows.length} accommodations from database`)
      }

      // Step 4: Invalidate all user sessions first
      try {
        await invalidateAllUserSessions(user.id)
        console.log(`[DELETE ACCOUNT] Invalidated all sessions for user: ${user.id}`)
      } catch (sessionError) {
        console.error(`[DELETE ACCOUNT] Error invalidating sessions:`, sessionError)
      }

      // Step 5: Delete agent record (CASCADE will handle related data)
      try {
        await query`DELETE FROM agents WHERE id = ${agentId}`
        console.log(`[DELETE ACCOUNT] Deleted agent record and all related data: ${agentId}`)
      } catch (dbError) {
        console.error(`[DELETE ACCOUNT] Error deleting agent record:`, dbError)
        throw new Error(`Failed to delete agent data from database: ${dbError instanceof Error ? dbError.message : String(dbError)}`)
      }

      // Step 6: Delete user record (CASCADE will handle any remaining data)
      try {
        await query`DELETE FROM users WHERE id = ${user.id}`
        console.log(`[DELETE ACCOUNT] Deleted user record from database: ${user.id}`)
      } catch (dbError) {
        console.error(`[DELETE ACCOUNT] Database deletion error:`, dbError)
        throw new Error(`Failed to delete user data from database: ${dbError instanceof Error ? dbError.message : String(dbError)}`)
      }

      // Step 7: Delete from StackAuth (last, after database cleanup)
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

      console.log(`[DELETE ACCOUNT] Account deletion completed successfully for agent user: ${user.id}`)

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

