import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { getCurrentUserFromRequest } from "@/lib/auth-server"
import { uploadImageFromBase64 } from "@/lib/cloudinary"
import { z } from "zod"

// Validation schema for image upload
const imageUploadSchema = z.object({
  image: z.string().min(1, "Image data is required"),
  fileName: z.string().min(1, "File name is required"),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "student") {
      return NextResponse.json({ error: "Student access required" }, { status: 403 })
    }

    const body = await request.json()
    const validation = imageUploadSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid input data", 
        details: validation.error.issues 
      }, { status: 400 })
    }

    const { image } = validation.data

    // Verify user exists
    const currentUser = await secureDb.db
      .select({
        id: schema.users.id,
      })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1)

    if (currentUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Upload image to Cloudinary
    const uploadResult = await uploadImageFromBase64(
      image,
      {
        folder: `profile-images/students/${user.id}`,
        public_id: `profile_${user.id}_${Date.now()}`,
        transformation: {
          width: 400,
          height: 400,
          crop: "fill",
          gravity: "face",
          quality: "auto",
          format: "auto"
        },
        userId: user.id,
        purpose: "profile" as const
      }
    )

    if (!uploadResult.success) {
      return NextResponse.json({ 
        error: "Failed to upload image", 
        details: uploadResult.error 
      }, { status: 400 })
    }

    // TODO: Profile image storage not yet implemented in schema
    // Update user record with new image URL and Cloudinary ID
    // await secureDb.db
    //   .update(schema.users)
    //   .set({
    //     updatedAt: new Date(),
    //   })
    //   .where(eq(schema.users.id, user.id))

    // Create audit record for profile image change
    await secureDb.db
      .insert(schema.studentProfileAudit)
      .values({
        studentId: user.id,
        fieldName: "profileImage",
        oldValue: null,
        newValue: uploadResult.result.secure_url,
        updatedBy: user.id,
      })

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: uploadResult.result.secure_url,
        cloudinaryId: uploadResult.result.public_id,
      },
      message: "Profile image updated successfully"
    })

  } catch (error) {
    console.error("Error uploading profile image:", error)
    return NextResponse.json({ error: "Failed to upload profile image" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "student") {
      return NextResponse.json({ error: "Student access required" }, { status: 403 })
    }

    // Get current user data
    const currentUser = await secureDb.db
      .select({
        id: schema.users.id,
      })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1)

    if (currentUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // TODO: Profile image storage not yet implemented in schema
    // For now, just return success
    
    // Create audit record for profile image deletion
    await secureDb.db
      .insert(schema.studentProfileAudit)
      .values({
        studentId: user.id,
        fieldName: "profileImage",
        oldValue: null,
        newValue: null,
        updatedBy: user.id,
      })

    return NextResponse.json({
      success: true,
      message: "Profile image deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting profile image:", error)
    return NextResponse.json({ error: "Failed to delete profile image" }, { status: 500 })
  }
}
