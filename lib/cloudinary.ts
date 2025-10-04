import { v2 as cloudinary } from "cloudinary"
import { env } from "@/lib/env"
import { FileValidationService } from "@/lib/services/file-validation"
import { FileSecurityService } from "@/lib/services/file-security"
import { FileUploadMiddleware } from "@/lib/middleware/file-upload"
import { captureException } from '@/lib/logging/config'

// Design pattern: Facade
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export interface SecureUploadOptions {
  folder?: string
  userId?: string
  purpose?: 'accommodation' | 'document' | 'profile' | 'accreditation'
  generateThumbnails?: boolean
  compressImages?: boolean
  maxWidth?: number
  maxHeight?: number
  quality?: string
}

export async function uploadImageSecurely(
  file: File, 
  options: SecureUploadOptions = {}
): Promise<{
  success: boolean
  result?: any
  error?: string
  warnings?: string[]
}> {
  try {
    const {
      folder = "varsity-nest",
      userId = "unknown",
      purpose = "accommodation",
      generateThumbnails = true,
      compressImages = true,
      maxWidth = 1200,
      maxHeight = 800,
      quality = "auto"
    } = options

    // 1. Security validation
    const securityResult = await FileSecurityService.validateFileSecurity(
      file,
      {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 1,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
        scanForViruses: true,
        validateContent: true,
        generateThumbnails,
        compressImages,
        folder
      },
      userId,
      'unknown', // IP address should be passed
      'unknown'  // User agent should be passed
    )

    if (!securityResult.isValid) {
      return {
        success: false,
        error: `Security validation failed: ${securityResult.errors.join(', ')}`,
        warnings: securityResult.warnings
      }
    }

    if (securityResult.shouldQuarantine) {
      await FileSecurityService.quarantineFile(
        file,
        userId,
        securityResult.threats.join(', '),
        securityResult.riskScore,
        securityResult.threats
      )
      return {
        success: false,
        error: "File quarantined due to security concerns",
        warnings: securityResult.warnings
      }
    }

    // 2. Content validation
    const contentInfo = await FileValidationService.validateFileContent(file)
    if (!contentInfo.isImage) {
      return {
        success: false,
        error: "File is not a valid image",
        warnings: securityResult.warnings
      }
    }

    // 3. Generate secure filename
    const secureFilename = FileUploadMiddleware.generateSecureFilename(file.name, userId)

    // 4. Upload to Cloudinary with security measures
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadResult = await new Promise((resolve, reject) => {
      const transformations = []
      
      if (compressImages) {
        transformations.push({ width: maxWidth, height: maxHeight, crop: "limit" })
        transformations.push({ quality })
        transformations.push({ fetch_format: "auto" })
      }

      cloudinary.uploader
        .upload_stream(
          {
            folder,
            public_id: secureFilename,
            resource_type: "image",
            use_filename: false,
            unique_filename: false,
            overwrite: false,
            transformation: transformations,
            // Security tags
            tags: [`user:${userId}`, `purpose:${purpose}`, 'secure-upload'],
            // Access control
            access_mode: "authenticated",
            // Metadata
            context: {
              original_filename: file.name,
              uploaded_by: userId,
              upload_purpose: purpose,
              security_validated: "true"
            }
          },
          (error, result) => {
            if (error) {
              captureException(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-upload', fileName: file.name, userId, purpose })
              reject(error)
            } else {
              resolve(result)
            }
          },
        )
        .end(buffer)
    })

    return {
      success: true,
      result: uploadResult,
      warnings: securityResult.warnings
    }
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-upload', fileName: file.name, userId: options.userId })
    return {
      success: false,
      error: "Upload failed due to internal error"
    }
  }
}

export async function uploadDocumentSecurely(
  file: File,
  options: SecureUploadOptions = {}
): Promise<{
  success: boolean
  result?: any
  error?: string
  warnings?: string[]
}> {
  try {
    const {
      folder = "varsity-nest/documents",
      userId = "unknown",
      purpose = "document"
    } = options

    // 1. Security validation
    const securityResult = await FileSecurityService.validateFileSecurity(
      file,
      {
        maxFileSize: 25 * 1024 * 1024, // 25MB
        maxFiles: 1,
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
        scanForViruses: true,
        validateContent: true,
        generateThumbnails: false,
        compressImages: false,
        folder
      },
      userId,
      'unknown',
      'unknown'
    )

    if (!securityResult.isValid) {
      return {
        success: false,
        error: `Security validation failed: ${securityResult.errors.join(', ')}`,
        warnings: securityResult.warnings
      }
    }

    if (securityResult.shouldQuarantine) {
      await FileSecurityService.quarantineFile(
        file,
        userId,
        securityResult.threats.join(', '),
        securityResult.riskScore,
        securityResult.threats
      )
      return {
        success: false,
        error: "File quarantined due to security concerns",
        warnings: securityResult.warnings
      }
    }

    // 2. Generate secure filename
    const secureFilename = FileUploadMiddleware.generateSecureFilename(file.name, userId)

    // 3. Upload to Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            public_id: secureFilename,
            resource_type: "raw",
            use_filename: false,
            unique_filename: false,
            overwrite: false,
            // Security tags
            tags: [`user:${userId}`, `purpose:${purpose}`, 'secure-document'],
            // Access control
            access_mode: "authenticated",
            // Metadata
            context: {
              original_filename: file.name,
              uploaded_by: userId,
              upload_purpose: purpose,
              security_validated: "true"
            }
          },
          (error, result) => {
            if (error) {
              captureException(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-upload', fileName: file.name, userId, purpose })
              reject(error)
            } else {
              resolve(result)
            }
          },
        )
        .end(buffer)
    })

    return {
      success: true,
      result: uploadResult,
      warnings: securityResult.warnings
    }
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-upload', fileName: file.name, userId: options.userId })
    return {
      success: false,
      error: "Document upload failed due to internal error"
    }
  }
}

// Legacy functions for backward compatibility (now use secure versions)
export async function uploadImage(file: File, folder = "varsity-nest") {
  console.warn("Using legacy uploadImage function. Consider using uploadImageSecurely for enhanced security.")
  const result = await uploadImageSecurely(file, { folder })
  if (!result.success) {
    throw new Error(result.error || "Failed to upload image")
  }
  return result.result
}

export async function uploadDocument(file: File, folder = "varsity-nest/documents") {
  console.warn("Using legacy uploadDocument function. Consider using uploadDocumentSecurely for enhanced security.")
  const result = await uploadDocumentSecurely(file, { folder })
  if (!result.success) {
    throw new Error(result.error || "Failed to upload document")
  }
  return result.result
}

export async function deleteImage(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-delete', publicId })
    throw new Error("Failed to delete image")
  }
}

export async function deleteDocument(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "raw" })
    return result
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-delete', publicId })
    throw new Error("Failed to delete document")
  }
}