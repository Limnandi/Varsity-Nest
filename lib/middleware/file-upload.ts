import { NextRequest } from "next/server"
import { FileUploadConfig, FILE_UPLOAD_LIMITS } from "@/lib/schemas/file-upload"
import { FileSecurityService } from "@/lib/services/file-security"
import { FileValidationService } from "@/lib/services/file-validation"
import { captureException } from '@/lib/logging/config'

export interface FileUploadMiddlewareOptions {
  purpose: 'accommodation' | 'document' | 'profile' | 'accreditation'
  maxFiles?: number
  customConfig?: Partial<FileUploadConfig>
}

export class FileUploadMiddleware {
  /**
   * Process file uploads with comprehensive security validation
   */
  static async processFileUploads(
    request: NextRequest,
    options: FileUploadMiddlewareOptions
  ): Promise<{
    files: File[]
    errors: string[]
    warnings: string[]
    quarantinedFiles: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []
    const quarantinedFiles: string[] = []
    const validFiles: File[] = []

    try {
      const formData = await request.formData()
      
      // Get files based on purpose
      let files: File[] = []
      if (options.purpose === 'accommodation') {
        files = formData.getAll('images') as File[]
      } else if (options.purpose === 'document' || options.purpose === 'accreditation') {
        files = formData.getAll('documents') as File[]
      } else if (options.purpose === 'profile') {
        files = formData.getAll('profileImage') as File[]
      }
      
      // Filter out empty files
      files = files.filter(file => file && file.size > 0)
      
      if (files.length === 0) {
        return { files: [], errors: ['No files provided'], warnings: [], quarantinedFiles: [] }
      }

      // Get upload configuration
      const config = this.getUploadConfig(options)

      // Validate file count
      if (files.length > config.maxFiles) {
        errors.push(`Maximum ${config.maxFiles} files allowed, received ${files.length}`)
        return { files: [], errors, warnings, quarantinedFiles: [] }
      }

      // Get client information
      const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                       request.headers.get('x-real-ip') || 
                       'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'
      const userId = 'unknown' // This should be extracted from session

      // Process each file
      for (const file of files) {
        try {
          // Files are already filtered for size > 0, but double-check
          if (!file || file.size === 0) {
            errors.push(`Empty or invalid file: ${file.name}`)
            continue
          }

          // Security validation
          const securityResult = await FileSecurityService.validateFileSecurity(
            file,
            config,
            userId,
            ipAddress,
            userAgent
          )

          if (!securityResult.isValid) {
            errors.push(...securityResult.errors.map(error => `${file.name}: ${error}`))
            continue
          }

          // Add warnings
          warnings.push(...securityResult.warnings.map(warning => `${file.name}: ${warning}`))

          // Check if file should be quarantined
          if (securityResult.shouldQuarantine) {
            const quarantinedName = await FileSecurityService.quarantineFile(
              file,
              userId,
              securityResult.threats.join(', '),
              securityResult.riskScore,
              securityResult.threats
            )
            quarantinedFiles.push(quarantinedName)
            errors.push(`${file.name}: File quarantined due to security concerns`)
            continue
          }

          // File passed all security checks
          validFiles.push(file)
        } catch (fileError) {
          captureException(fileError instanceof Error ? fileError : new Error(String(fileError)), { component: 'file-upload-middleware', fileName: file?.name, fileSize: file?.size })
          errors.push(`${file.name}: File processing failed`)
        }
      }

      return {
        files: validFiles,
        errors,
        warnings,
        quarantinedFiles
      }
    } catch (error: unknown) {
      captureException(error instanceof Error ? error : new Error(String(error)), { component: 'file-upload-middleware' })
      return {
        files: [],
        errors: ['File upload processing failed'],
        warnings: [],
        quarantinedFiles: []
      }
    }
  }

  /**
   * Process uploads from an already-parsed FormData to avoid consuming the request body twice
   */
  static async processFormData(
    formData: FormData,
    request: NextRequest,
    options: FileUploadMiddlewareOptions
  ): Promise<{
    files: File[]
    errors: string[]
    warnings: string[]
    quarantinedFiles: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []
    const quarantinedFiles: string[] = []
    const validFiles: File[] = []

    try {
      // Get files based on purpose
      let files: File[] = []
      if (options.purpose === 'accommodation') {
        files = formData.getAll('images') as File[]
      } else if (options.purpose === 'document' || options.purpose === 'accreditation') {
        files = formData.getAll('documents') as File[]
      } else if (options.purpose === 'profile') {
        files = formData.getAll('profileImage') as File[]
      }

      // Filter out empty files
      files = files.filter(file => file && file.size > 0)

      if (files.length === 0) {
        return { files: [], errors: ['No files provided'], warnings: [], quarantinedFiles: [] }
      }

      const config = this.getUploadConfig(options)

      if (files.length > config.maxFiles) {
        errors.push(`Maximum ${config.maxFiles} files allowed, received ${files.length}`)
        return { files: [], errors, warnings, quarantinedFiles: [] }
      }

      const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                       request.headers.get('x-real-ip') || 
                       'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'
      const userId = 'unknown'

      for (const file of files) {
        try {
          if (!file || file.size === 0) {
            errors.push(`Empty or invalid file: ${file.name}`)
            continue
          }

          const securityResult = await FileSecurityService.validateFileSecurity(
            file,
            config,
            userId,
            ipAddress,
            userAgent
          )

          if (!securityResult.isValid) {
            errors.push(...securityResult.errors.map(error => `${file.name}: ${error}`))
            continue
          }

          warnings.push(...securityResult.warnings.map(warning => `${file.name}: ${warning}`))

          if (securityResult.shouldQuarantine) {
            const quarantinedName = await FileSecurityService.quarantineFile(
              file,
              userId,
              securityResult.threats.join(', '),
              securityResult.riskScore,
              securityResult.threats
            )
            quarantinedFiles.push(quarantinedName)
            errors.push(`${file.name}: File quarantined due to security concerns`)
            continue
          }

          validFiles.push(file)
        } catch (fileError) {
          captureException(fileError instanceof Error ? fileError : new Error(String(fileError)), { component: 'file-upload-middleware', fileName: (file as any)?.name, fileSize: (file as any)?.size })
          errors.push(`${(file as any)?.name || 'unknown'}: File processing failed`)
        }
      }

      return {
        files: validFiles,
        errors,
        warnings,
        quarantinedFiles
      }
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { component: 'file-upload-middleware' })
      return {
        files: [],
        errors: ['File upload processing failed'],
        warnings: [],
        quarantinedFiles: []
      }
    }
  }

  /**
   * Get upload configuration based on purpose
   */
  private static getUploadConfig(options: FileUploadMiddlewareOptions): FileUploadConfig {
    const baseConfig = FILE_UPLOAD_LIMITS[options.purpose.toUpperCase() as keyof typeof FILE_UPLOAD_LIMITS]
    
    return {
      maxFileSize: baseConfig.maxSize,
      maxFiles: options.maxFiles || baseConfig.maxFiles,
      allowedMimeTypes: [...baseConfig.allowedTypes],
      allowedExtensions: [...baseConfig.allowedExtensions],
      scanForViruses: true,
      validateContent: true,
      generateThumbnails: options.purpose === 'accommodation',
      compressImages: true,
      folder: `varsity-nest/${options.purpose}`,
      ...options.customConfig
    }
  }

  /**
   * Validate single file with security checks
   */
  static async validateSingleFile(
    file: File,
    purpose: 'accommodation' | 'document' | 'profile' | 'accreditation',
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
    shouldQuarantine: boolean
    riskScore: number
  }> {
    try {
      const config = this.getUploadConfig({ purpose })
      
      const securityResult = await FileSecurityService.validateFileSecurity(
        file,
        config,
        userId,
        ipAddress,
        userAgent
      )

      return {
        isValid: securityResult.isValid,
        errors: securityResult.errors,
        warnings: securityResult.warnings,
        shouldQuarantine: securityResult.shouldQuarantine,
        riskScore: securityResult.riskScore
      }
    } catch (error) {
      captureException(error as Error, {
        tags: { component: 'file-upload-middleware' },
        extra: { fileName: file.name, purpose, userId }
      })
      
      return {
        isValid: false,
        errors: ['File validation failed'],
        warnings: [],
        shouldQuarantine: true,
        riskScore: 100
      }
    }
  }

  /**
   * Sanitize filename for safe storage
   */
  static sanitizeFilename(filename: string): string {
    // Remove or replace dangerous characters
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace non-alphanumeric chars except . and -
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
      .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
      .substring(0, 255) // Limit length
  }

  /**
   * Generate secure filename
   */
  static generateSecureFilename(originalName: string, userId: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = FileValidationService.getFileExtension(originalName)
    const sanitizedName = this.sanitizeFilename(originalName.replace(extension, ''))
    
    return `${userId}_${timestamp}_${random}_${sanitizedName}${extension}`
  }

  /**
   * Check if file type is allowed for purpose
   */
  static isFileTypeAllowed(
    file: File,
    purpose: 'accommodation' | 'document' | 'profile' | 'accreditation'
  ): boolean {
    const config = FILE_UPLOAD_LIMITS[purpose.toUpperCase() as keyof typeof FILE_UPLOAD_LIMITS]
    const extension = FileValidationService.getFileExtension(file.name)
    
    return config.allowedTypes.includes(file.type as any) && 
           config.allowedExtensions.includes(extension as any)
  }

  /**
   * Get file upload limits for purpose
   */
  static getFileUploadLimits(purpose: 'accommodation' | 'document' | 'profile' | 'accreditation') {
    return FILE_UPLOAD_LIMITS[purpose.toUpperCase() as keyof typeof FILE_UPLOAD_LIMITS]
  }
}
