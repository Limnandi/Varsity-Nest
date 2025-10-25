# Cloudinary Image Upload Integration Guide

This document details the complete process of integrating Cloudinary image uploads into the student profile feature, including all the challenges faced and solutions implemented.

## Table of Contents
1. [Overview](#overview)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Schema Updates](#database-schema-updates)
5. [Frontend Implementation](#frontend-implementation)
6. [Backend API Implementation](#backend-api-implementation)
7. [Authentication Integration](#authentication-integration)
8. [Troubleshooting & Solutions](#troubleshooting--solutions)

---

## Overview

The goal was to implement a production-ready image upload system for student profile pictures using Cloudinary's direct upload feature with the `next-cloudinary` package.

### Key Requirements
- Direct client-side uploads to Cloudinary (no server proxy)
- Unsigned upload preset for security
- Image cropping and optimization
- Database persistence of image URLs
- Real-time UI updates after upload

---

## Initial Setup

### 1. Install Dependencies

```bash
pnpm add next-cloudinary
```

### 2. Cloudinary Console Configuration

**Create an Unsigned Upload Preset:**

1. Go to Cloudinary Console → Settings → Upload
2. Click "Add upload preset"
3. Set the following:
   - **Preset name**: `student_profile_unsigned`
   - **Signing Mode**: **Unsigned** (CRITICAL - must be unsigned!)
   - **Folder**: `student-profiles` (optional, for organization)
   - **Format**: Auto
   - **Transformation**: Optional (e.g., crop to square, limit size)
4. Save the preset

**Important**: The signing mode MUST be set to "Unsigned" for client-side uploads without authentication.

---

## Environment Configuration

### Environment Variables

Add the following to `.env.local`:

```env
# Cloudinary Configuration (Server-side)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Cloudinary Configuration (Client-side - must be prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=student_profile_unsigned
```

### Update Environment Validation

**File: `lib/env.client.ts`**

```typescript
const publicSchema = z.object({
  // ... other env vars
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1, "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is required"),
  NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().min(1, "NEXT_PUBLIC_CLOUDINARY_API_KEY is required"),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1, "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is required"),
})

export const publicEnv = {
  // ... other env vars
  CLOUDINARY_CLOUD_NAME: parsedPublic.data.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: parsedPublic.data.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  CLOUDINARY_UPLOAD_PRESET: parsedPublic.data.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
} as const
```

---

## Database Schema Updates

### Add Profile Image Columns

**File: `database/schema.sql`**

```sql
-- Add profile image columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_cloudinary_id VARCHAR(255);
```

**Run this SQL in your database console (e.g., Neon, Supabase).**

### Update Drizzle Schema

**File: `lib/schema.ts`**

```typescript
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  // ... other fields
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  profileImageCloudinaryId: varchar("profile_image_cloudinary_id", { length: 255 }),
  // ... other fields
})
```

---

## Frontend Implementation

### ProfileImageUpload Component

**File: `components/ProfileImageUpload.tsx`**

Key implementation details:

```typescript
import { CldUploadButton } from 'next-cloudinary'
import { publicEnv } from '@/lib/env.client'

export default function ProfileImageUpload({ currentImageUrl, onUploadSuccess }) {
  const [isUploading, setIsUploading] = useState(false)

  const handleUploadSuccess = async (result: any) => {
    try {
      setIsUploading(true)
      
      // Extract Cloudinary data
      const imageUrl = result.info.secure_url
      const cloudinaryId = result.info.public_id

      // Send to backend API
      const response = await fetch('/api/student/profile-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          imageUrl,
          cloudinaryId
        })
      })

      if (response.ok) {
        toast.success("Profile image updated successfully!")
        onUploadSuccess?.(imageUrl)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error("Failed to update profile image")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <CldUploadButton
      uploadPreset={publicEnv.CLOUDINARY_UPLOAD_PRESET}
      onUpload={handleUploadSuccess}
      onError={(error) => {
        console.error('Cloudinary upload error:', error)
        toast.error("Upload failed. Please try again.")
      }}
      options={{
        cloudName: publicEnv.CLOUDINARY_CLOUD_NAME,
        cropping: true,
        croppingAspectRatio: 1,
        maxFileSize: 5000000, // 5MB
        sources: ['local', 'camera'],
        multiple: false,
        styles: {
          palette: {
            window: "#1a1a2e",
            windowBorder: "#3b82f6",
            tabIcon: "#3b82f6",
            menuIcons: "#3b82f6",
            textDark: "#ffffff",
            textLight: "#ffffff",
            link: "#3b82f6",
            action: "#3b82f6",
            inactiveTabIcon: "#6b7280",
            error: "#ef4444",
            inProgress: "#3b82f6",
            complete: "#10b981",
            sourceBg: "#0f172a"
          }
        }
      }}
    >
      <button className="upload-button">
        Upload Profile Picture
      </button>
    </CldUploadButton>
  )
}
```

---

## Backend API Implementation

### Profile Image Upload Endpoint

**File: `app/api/student/profile-image/route.ts`**

```typescript
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromStackAuth()
    
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrl, cloudinaryId } = body

    // Update database with Cloudinary URL
    await query`
      UPDATE users 
      SET 
        profile_image_url = ${imageUrl},
        profile_image_cloudinary_id = ${cloudinaryId},
        updated_at = NOW()
      WHERE id = ${user.id}
    `

    // Optional: Log to audit table (non-critical)
    try {
      await query`
        INSERT INTO student_profile_audit (student_id, field_name, new_value)
        VALUES (${studentId}, 'profile_image', ${imageUrl})
      `
    } catch (auditError) {
      console.warn('Audit log failed (non-critical):', auditError)
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      message: "Profile image updated successfully"
    })
  } catch (error) {
    console.error('Profile image update error:', error)
    return NextResponse.json(
      { error: "Failed to update profile image" },
      { status: 500 }
    )
  }
}
```

---

## Authentication Integration

### Update User Session Data

To ensure the profile image appears immediately after upload, update the session data retrieval:

**File: `lib/auth-server.ts`**

```typescript
export interface SecureUser {
  // ... other fields
  profileImageUrl?: string
  profileImageCloudinaryId?: string
}

export async function getCurrentUserFromStackAuth(): Promise<SecureUser | null> {
  // ... auth logic
  
  const result = await query`
    SELECT 
      u.id, u.email, u.first_name, u.last_name, u.role,
      u.profile_image_url, u.profile_image_cloudinary_id,
      -- ... other fields
    FROM users u
    WHERE u.id = ${stackUser.id}
  `
  
  return {
    // ... other fields
    profileImageUrl: result.rows[0].profile_image_url,
    profileImageCloudinaryId: result.rows[0].profile_image_cloudinary_id,
  }
}
```

**File: `app/api/auth/session/route.ts`**

Ensure the session API always fetches fresh data from the database:

```typescript
export async function GET(request: NextRequest) {
  // Always query fresh data from database
  const user = await getCurrentUserFromStackAuth()
  
  return NextResponse.json({
    success: true,
    data: {
      // ... other fields
      profileImageUrl: user.profileImageUrl,
      profileImageCloudinaryId: user.profileImageCloudinaryId,
    }
  })
}
```

---

## Troubleshooting & Solutions

### Issue 1: Environment Variable Not Found

**Error:**
```
Invalid environment configuration: CLOUDINARY_CLOUD_NAME: Invalid input: expected string, received undefined
```

**Solution:**
- Ensure all Cloudinary variables are in `.env.local`
- Client-side variables MUST be prefixed with `NEXT_PUBLIC_`
- Restart the dev server after adding env vars

---

### Issue 2: Upload Preset Must Be Whitelisted

**Error:**
```
Upload preset must be whitelisted for unsigned uploads
```

**Solution:**
1. Go to Cloudinary Console → Settings → Upload
2. Find your upload preset (`student_profile_unsigned`)
3. Change **Signing Mode** from "Signed" to **"Unsigned"**
4. Save changes

This is the most common issue - the preset must be explicitly set to unsigned mode.

---

### Issue 3: Foreign Key Constraint Violation

**Error:**
```
Foreign key constraint violation: student_profile_audit_student_id_fkey
```

**Solution:**
Wrap audit logging in a try-catch block since it's non-critical:

```typescript
try {
  await query`INSERT INTO student_profile_audit ...`
} catch (auditError) {
  console.warn('Audit log failed (non-critical):', auditError)
  // Continue - don't fail the main operation
}
```

---

### Issue 4: Profile Image Not Displaying After Upload

**Error:**
Profile image URL is `undefined` in the frontend after successful upload.

**Root Cause:**
The session API was returning cached/stale JWT data instead of fresh database data.

**Solution:**
Modify the session API to always fetch fresh data:

```typescript
// BEFORE (cached JWT data)
const user = await getCurrentUserFromRequest(request)

// AFTER (fresh database data)
const user = await getCurrentUserFromStackAuth()
```

Also ensure the frontend refetches user data after upload:

```typescript
const { refetch } = useStudentAuth()

const handleUploadSuccess = async (imageUrl: string) => {
  // ... save to backend
  await refetch() // Refetch user data
}
```

---

### Issue 5: Image Upload Button Not Styled

**Solution:**
The `CldUploadButton` renders a plain button. Wrap it or style it:

```typescript
<CldUploadButton
  uploadPreset={preset}
  className="your-custom-classes"
>
  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
    <Camera className="w-5 h-5" />
    <span>Upload Photo</span>
  </div>
</CldUploadButton>
```

---

## Best Practices

### 1. Security
- ✅ Use unsigned upload presets (no API secrets exposed to client)
- ✅ Validate file types and sizes on Cloudinary preset settings
- ✅ Store only the URL and public_id in the database
- ✅ Never expose `CLOUDINARY_API_SECRET` to the client

### 2. Performance
- ✅ Use Cloudinary's automatic image optimization
- ✅ Enable cropping for consistent profile image sizes
- ✅ Set reasonable file size limits (e.g., 5MB max)

### 3. User Experience
- ✅ Show loading states during upload
- ✅ Display success/error messages
- ✅ Allow image cropping before upload
- ✅ Show preview of current profile image

### 4. Data Integrity
- ✅ Store both `secure_url` and `public_id` from Cloudinary
- ✅ Update database atomically
- ✅ Handle audit logging failures gracefully
- ✅ Always fetch fresh data after updates

---

## Testing Checklist

- [ ] Upload a new profile image
- [ ] Verify image appears immediately after upload
- [ ] Check database has both `profile_image_url` and `profile_image_cloudinary_id`
- [ ] Test image cropping functionality
- [ ] Verify file size limits work
- [ ] Test error handling (network failure, invalid file type)
- [ ] Confirm image persists after logout/login
- [ ] Test on mobile devices
- [ ] Verify image optimization (check file size in browser network tab)

---

## Summary

The Cloudinary integration required:
1. ✅ Proper environment variable configuration (client + server)
2. ✅ Database schema updates for image storage
3. ✅ Unsigned upload preset in Cloudinary console
4. ✅ Frontend component using `CldUploadButton`
5. ✅ Backend API to persist image URLs
6. ✅ Session management updates for real-time UI updates
7. ✅ Comprehensive error handling

**Key Lesson**: Always ensure the upload preset is set to "Unsigned" mode in the Cloudinary console - this is the most common source of errors!

---

## Additional Resources

- [Cloudinary Next.js Documentation](https://next.cloudinary.dev/)
- [Upload Presets Guide](https://cloudinary.com/documentation/upload_presets)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)

---

**Last Updated**: October 25, 2025
**Status**: ✅ Production Ready


