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

export async function uploadImageFromBase64(
  base64Data: string,
  options: {
    folder?: string
    public_id?: string
    transformation?: any
    userId?: string
    purpose?: 'accommodation' | 'document' | 'profile' | 'accreditation'
  } = {}
): Promise<{
  success: boolean
  result?: any
  error?: string
  warnings?: string[]
}> {
  try {
    const {
      folder = "varsity-nest",
      public_id,
      transformation,
      userId = "unknown",
      purpose = "profile"
    } = options

    // Upload base64 data to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64Data}`,
      {
        folder,
        public_id,
        resource_type: "image",
        use_filename: false,
        unique_filename: true,
        overwrite: true,
        transformation: transformation || {
          width: 400,
          height: 400,
          crop: "fill",
          gravity: "face",
          quality: "auto",
          format: "auto"
        },
        tags: [`user:${userId}`, `purpose:${purpose}`, 'profile-image'],
        context: {
          uploaded_by: userId,
          upload_purpose: purpose,
          source: "base64"
        }
      }
    )

    return {
      success: true,
      result: uploadResult,
      warnings: []
    }
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-base64-upload', userId: options.userId })
    return {
      success: false,
      error: "Failed to upload image from base64 data"
    }
  }
}

/**
 * Extract public_id from a Cloudinary URL
 * Handles both full URLs and public_ids
 */
export function extractPublicIdFromUrl(urlOrPublicId: string): string {
  if (!urlOrPublicId) {
    return ""
  }

  if (!urlOrPublicId.includes('res.cloudinary.com')) {
    return urlOrPublicId
  }

  try {
    const url = new URL(urlOrPublicId)
    const pathParts = url.pathname.split('/').filter(part => part)
    
    const uploadIndex = pathParts.findIndex(part => part === 'upload')
    if (uploadIndex === -1) {
      return urlOrPublicId
    }

    const publicIdParts = pathParts.slice(uploadIndex + 1)
    
    if (publicIdParts.length === 0) {
      return urlOrPublicId
    }

    let publicId = publicIdParts.join('/')
    
    const lastPart = publicIdParts[publicIdParts.length - 1]
    if (lastPart && lastPart.includes('.')) {
      publicId = publicId.substring(0, publicId.lastIndexOf('.'))
    }

    return publicId
  } catch (error) {
    return urlOrPublicId
  }
}

/**
 * Delete a single image from Cloudinary using Admin API
 * Automatically removes all derived versions and clears CDN cache
 * Uses default resource_type (image) and type (upload)
 */
export async function deleteImage(publicId: string): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    const extractedPublicId = extractPublicIdFromUrl(publicId)
    
    const result = await cloudinary.api.delete_resources(
      [extractedPublicId],
      {
        invalidate: true
      }
    )
    
    return {
      success: true,
      result
    }
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-delete', publicId })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete image"
    }
  }
}

/**
 * Delete multiple images from Cloudinary using Admin API
 * Automatically removes all derived versions and clears CDN cache
 * Handles batch deletion for up to 100 images per call (Cloudinary limit)
 * Uses default resource_type (image) and type (upload)
 */
export async function deleteImages(publicIds: string[]): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    if (!publicIds || publicIds.length === 0) {
      return {
        success: true,
        result: { deleted: {} }
      }
    }

    const extractedPublicIds = publicIds.map(id => extractPublicIdFromUrl(id)).filter(id => id && id.length > 0)
    
    if (extractedPublicIds.length === 0) {
      return {
        success: true,
        result: { deleted: {} }
      }
    }

    const BATCH_SIZE = 100
    const batches: string[][] = []
    
    for (let i = 0; i < extractedPublicIds.length; i += BATCH_SIZE) {
      batches.push(extractedPublicIds.slice(i, i + BATCH_SIZE))
    }

    const results: any[] = []
    for (const batch of batches) {
      try {
        const result = await cloudinary.api.delete_resources(batch, {
          invalidate: true
        })
        results.push(result)
      } catch (batchError) {
        console.error('Error deleting batch:', batchError)
        captureException(batchError instanceof Error ? batchError : new Error(String(batchError)), { 
          component: 'cloudinary-delete-batch', 
          batchSize: batch.length 
        })
      }
    }

    const combinedResult = {
      deleted: {} as Record<string, string>,
      not_found: [] as string[]
    }

    for (const result of results) {
      if (result.deleted) {
        Object.assign(combinedResult.deleted, result.deleted)
      }
      if (result.not_found) {
        combinedResult.not_found.push(...result.not_found)
      }
    }
    
    return {
      success: true,
      result: combinedResult
    }
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-delete-multiple', publicIds })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete images"
    }
  }
}

/**
 * Delete a single document from Cloudinary using Admin API
 * Automatically removes all derived versions and clears CDN cache
 * Uses resource_type 'raw' for documents
 */
export async function deleteDocument(publicId: string): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    const extractedPublicId = extractPublicIdFromUrl(publicId)
    
    const result = await cloudinary.api.delete_resources(
      [extractedPublicId],
      {
        resource_type: 'raw',
        invalidate: true
      }
    )
    
    return {
      success: true,
      result
    }
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-delete', publicId })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete document"
    }
  }
}

/**
 * Delete images by prefix (useful for deleting all images in a folder)
 * Supports up to 1000 assets when deleting by prefix
 */
export async function deleteImagesByPrefix(prefix: string): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    if (!prefix || prefix.length === 0) {
      return {
        success: false,
        error: "Prefix is required"
      }
    }

    const result = await cloudinary.api.delete_resources_by_prefix(
      prefix,
      {
        invalidate: true
      }
    )
    
    return {
      success: true,
      result
    }
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-delete-by-prefix', prefix })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete images by prefix"
    }
  }
}

/**
 * Delete images by tag (useful for deleting all images with a specific tag)
 * Supports up to 1000 assets when deleting by tag
 */
export async function deleteImagesByTag(tag: string): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    if (!tag || tag.length === 0) {
      return {
        success: false,
        error: "Tag is required"
      }
    }

    const result = await cloudinary.api.delete_resources_by_tag(
      tag,
      {
        invalidate: true
      }
    )
    
    return {
      success: true,
      result
    }
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-delete-by-tag', tag })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete images by tag"
    }
  }
}

/**
 * Replace an image by uploading with the same public_id
 * This overwrites the original and all transformed versions
 */
export async function replaceImage(
  file: File,
  existingPublicId: string,
  options: SecureUploadOptions = {}
): Promise<{
  success: boolean
  result?: any
  error?: string
  warnings?: string[]
}> {
  try {
    const extractedPublicId = extractPublicIdFromUrl(existingPublicId)
    const secureFilename = extractedPublicId || FileUploadMiddleware.generateSecureFilename(file.name, options.userId || "unknown")

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadResult = await new Promise((resolve, reject) => {
      const transformations = []
      
      if (options.compressImages !== false) {
        transformations.push({ 
          width: options.maxWidth || 1200, 
          height: options.maxHeight || 800, 
          crop: "limit" 
        })
        transformations.push({ quality: options.quality || "auto" })
        transformations.push({ fetch_format: "auto" })
      }

      cloudinary.uploader
        .upload_stream(
          {
            folder: options.folder || "varsity-nest",
            public_id: secureFilename,
            resource_type: "image",
            use_filename: false,
            unique_filename: false,
            overwrite: true,
            transformation: transformations,
            invalidate: true,
            tags: [`user:${options.userId || "unknown"}`, `purpose:${options.purpose || "accommodation"}`, 'secure-upload', 'replacement'],
            access_mode: "authenticated",
            context: {
              original_filename: file.name,
              uploaded_by: options.userId || "unknown",
              upload_purpose: options.purpose || "accommodation",
              replaced: "true"
            }
          },
          (error, result) => {
            if (error) {
              captureException(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-replace', fileName: file.name, userId: options.userId })
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
      warnings: []
    }
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-replace', fileName: file.name, userId: options.userId })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to replace image"
    }
  }
}