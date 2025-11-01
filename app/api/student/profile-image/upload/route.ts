import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import { eq } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { getCurrentUserFromRequest } from "@/lib/auth-server"
import { cloudinary, deleteImage } from "@/lib/cloudinary"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    if (user.role !== "student") {
      return NextResponse.json({ error: "Student access required" }, { status: 403 })
    }

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

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileName = (formData.get('fileName') as string) || 'profile.jpg'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const folder = `profile-images/students/${user.id}`
    const publicId = existingCloudinaryId || `${folder}/profile_${user.id}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          overwrite: true,
          invalidate: true,
          transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }, { quality: 'auto' }, { fetch_format: 'auto' }],
          tags: [`user:${user.id}`, 'profile-image'],
          context: { uploaded_by: user.id, original_filename: fileName },
        },
        (error, result) => {
          if (error) return reject(error)
          resolve(result)
        }
      ).end(buffer)
    })

    await secureDb.db
      .update(schema.users)
      .set({
        profileImageUrl: uploadResult.secure_url,
        // @ts-ignore snake_case
        profileImageCloudinaryId: uploadResult.public_id,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id))

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
      }
    })
  } catch (error) {
    console.error('Profile image upload error:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}


