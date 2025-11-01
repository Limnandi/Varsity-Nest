import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { uploadImageFromBase64, deleteImage } from "@/lib/cloudinary"
import { z } from "zod"

// Validation schema for image upload
const imageUploadSchema = z.object({
  image: z.string().min(1, "Image data is required").optional(),
  fileName: z.string().min(1, "File name is required").optional(),
  imageUrl: z.string().url("Valid image URL is required").optional(),
  cloudinaryId: z.string().min(1, "Cloudinary ID is required").optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromStackAuth()
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

    const { image, imageUrl, cloudinaryId } = validation.data

    const currentUser = await secureDb.db
      .select({
        id: schema.users.id,
        profileImageCloudinaryId: schema.users.profileImageCloudinaryId,
      })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1)

    if (currentUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existingCloudinaryId = currentUser[0].profileImageCloudinaryId

    if (existingCloudinaryId) {
      const deleteResult = await deleteImage(existingCloudinaryId)
      if (!deleteResult.success) {
        console.warn('Failed to delete existing profile image from Cloudinary:', deleteResult.error)
      }
    }

    let finalImageUrl: string
    let finalCloudinaryId: string

    const profilePublicId = existingCloudinaryId || `profile-images/students/${user.id}/profile_${user.id}`

    if (imageUrl && cloudinaryId) {
      finalImageUrl = imageUrl
      finalCloudinaryId = cloudinaryId
      
      if (existingCloudinaryId && existingCloudinaryId !== cloudinaryId) {
        const deleteResult = await deleteImage(existingCloudinaryId)
        if (!deleteResult.success) {
          console.warn('Failed to delete old profile image from Cloudinary:', deleteResult.error)
        }
      }
    } else if (image) {
      const uploadResult = await uploadImageFromBase64(
        image,
        {
          folder: `profile-images/students/${user.id}`,
          public_id: profilePublicId,
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

      finalImageUrl = uploadResult.result.secure_url
      finalCloudinaryId = uploadResult.result.public_id
    } else {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 })
    }

    // Update user record with new image URL and Cloudinary ID
    console.log('Updating user record with image URL:', finalImageUrl)
    await secureDb.db
      .update(schema.users)
      .set({
        profileImageUrl: finalImageUrl,
        // @ts-ignore drizzle typing for snake_case
        profileImageCloudinaryId: finalCloudinaryId,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id))
    
    console.log('User record updated successfully')

    // Create audit record for profile image change (optional, skip if student record doesn't exist)
    try {
      await secureDb.db
        .insert(schema.studentProfileAudit)
        .values({
          studentId: user.id,
          fieldName: "profileImage",
          oldValue: null,
          newValue: finalImageUrl,
          updatedBy: user.id,
        })
      console.log('Audit log created successfully')
    } catch (auditError) {
      // Audit logging failed (likely no student record), but image was saved successfully
      console.warn('Failed to create audit log (non-critical):', auditError)
    }

    console.log('Returning success response')
    return NextResponse.json({
      success: true,
      data: {
        imageUrl: finalImageUrl,
        cloudinaryId: finalCloudinaryId,
      },
      message: "Profile image updated successfully"
    })

  } catch (error) {
    console.error("Error uploading profile image:", error)
    return NextResponse.json({ error: "Failed to upload profile image" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUserFromStackAuth()
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
        profileImageCloudinaryId: schema.users.profileImageCloudinaryId,
      })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1)

    if (currentUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existingCloudinaryId = currentUser[0].profileImageCloudinaryId

    if (existingCloudinaryId) {
      const deleteResult = await deleteImage(existingCloudinaryId)
      if (!deleteResult.success) {
        console.warn('Failed to delete profile image from Cloudinary:', deleteResult.error)
      }
    }

    await secureDb.db
      .update(schema.users)
      .set({
        profileImageUrl: null,
        // @ts-ignore snake_case mapping
        profileImageCloudinaryId: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id))

    // Create audit record for profile image deletion (optional)
    try {
      await secureDb.db
        .insert(schema.studentProfileAudit)
        .values({
          studentId: user.id,
          fieldName: "profileImage",
          oldValue: null,
          newValue: null,
          updatedBy: user.id,
        })
    } catch (auditError) {
      // Audit logging failed (non-critical)
      console.warn('Failed to create audit log (non-critical):', auditError)
    }

    return NextResponse.json({
      success: true,
      message: "Profile image deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting profile image:", error)
    return NextResponse.json({ error: "Failed to delete profile image" }, { status: 500 })
  }
}
