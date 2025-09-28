import { FileUploadConfig, FileUploadAudit, FileQuarantine } from "@/lib/schemas/file-upload"
import { FileValidationService } from "./file-validation"
import { captureException, captureMessage } from '@/lib/logging/config'
import { secureDb } from "@/lib/database-secure"
import { eq, and, gte, lte } from "drizzle-orm"
import * as schema from "@/lib/schema"

export class FileSecurityService {
  /**
   * Comprehensive file security validation
   */
  static async validateFileSecurity(
    file: File,
    config: FileUploadConfig,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
    riskScore: number
    threats: string[]
    shouldQuarantine: boolean
  }> {
    const errors: string[] = []
    const warnings: string[] = []
    const threats: string[] = []

    try {
      // 1. Basic file validation
      if (!file || file.size === 0) {
        errors.push("Empty or invalid file")
        return { isValid: false, errors, warnings, riskScore: 100, threats: ["Empty file"], shouldQuarantine: false }
      }

      // 2. File size validation
      if (file.size > config.maxFileSize) {
        errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed ${(config.maxFileSize / 1024 / 1024).toFixed(2)}MB`)
      }

      // 3. File type validation
      if (!config.allowedMimeTypes.includes(file.type)) {
        errors.push(`File type ${file.type} is not allowed`)
      }

      // 4. File extension validation
      const extension = FileValidationService.getFileExtension(file.name)
      if (!config.allowedExtensions.includes(extension)) {
        errors.push(`File extension ${extension} is not allowed`)
      }

      // 5. Dangerous extension check
      if (FileValidationService.isDangerousExtension(file.name)) {
        errors.push(`File extension ${extension} is potentially dangerous`)
        threats.push("Dangerous file extension")
      }

      // 6. Content validation
      const contentInfo = await FileValidationService.validateFileContent(file)
      
      // 7. MIME type vs actual content validation
      if (file.type !== contentInfo.actualType) {
        warnings.push(`MIME type mismatch: declared ${file.type}, actual ${contentInfo.actualType}`)
        threats.push("MIME type spoofing")
      }

      // 8. Executable file check
      if (contentInfo.isExecutable) {
        errors.push("File appears to be executable")
        threats.push("Executable file detected")
      }

      // 9. Malicious content check
      if (contentInfo.hasMaliciousContent) {
        errors.push("File contains potentially malicious content")
        threats.push("Malicious content detected")
      }

      // 10. Image-specific validation
      if (contentInfo.isImage && config.allowedMimeTypes.some(type => type.startsWith('image/'))) {
        if (!contentInfo.dimensions) {
          warnings.push("Could not determine image dimensions")
        } else {
          const { width, height } = contentInfo.dimensions
          if (width > 10000 || height > 10000) {
            warnings.push("Image dimensions are unusually large")
            threats.push("Oversized image")
          }
        }
      }

      // 11. Calculate risk score
      const riskScore = FileValidationService.calculateRiskScore(file, contentInfo)

      // 12. Determine if file should be quarantined
      const shouldQuarantine = riskScore > 70 || threats.length > 0 || contentInfo.isExecutable

      // 13. Log security event
      await this.logSecurityEvent(file, userId, ipAddress, userAgent, {
        riskScore,
        threats,
        contentInfo,
        isValid: errors.length === 0,
        shouldQuarantine
      })

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        riskScore,
        threats,
        shouldQuarantine
      }
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { component: 'file-security', fileName: file.name, fileSize: file.size, userId })
      
      errors.push("File validation failed due to internal error")
      return { isValid: false, errors, warnings, riskScore: 100, threats: ["Validation error"], shouldQuarantine: true }
    }
  }

  /**
   * Quarantine suspicious file
   */
  static async quarantineFile(
    file: File,
    userId: string,
    reason: string,
    riskScore: number,
    threats: string[]
  ): Promise<string> {
    try {
      const quarantinedFileName = `quarantine_${Date.now()}_${file.name}`
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      // Store file in quarantine database
      const quarantineData: Omit<FileQuarantine, 'id' | 'uploadedAt'> = {
        originalFileName: file.name,
        quarantinedFileName,
        reason,
        riskScore,
        threats,
        userId,
        expiresAt,
        status: 'quarantined'
      }

      // Insert quarantine record
      await secureDb.db
        .insert(schema.fileQuarantines)
        .values(quarantineData)

      // Log quarantine event
      await this.logSecurityEvent(file, userId, 'unknown', 'unknown', {
        riskScore,
        threats,
        contentInfo: { isExecutable: false, hasMaliciousContent: false },
        isValid: false,
        shouldQuarantine: true,
        action: 'quarantined'
      })

      return quarantinedFileName
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { component: 'file-security', fileName: file.name, userId, reason })
      throw new Error('Failed to quarantine file')
    }
  }

  /**
   * Scan file for viruses (placeholder for actual virus scanning)
   */
  static async scanForViruses(file: File): Promise<{
    isClean: boolean
    threats: string[]
    scanResult: string
  }> {
    try {
      // In a real implementation, you would integrate with a virus scanning service
      // For now, we'll do basic heuristic scanning
      const contentInfo = await FileValidationService.validateFileContent(file)
      
      const threats: string[] = []
      let isClean = true

      if (contentInfo.isExecutable) {
        threats.push("Executable file detected")
        isClean = false
      }

      if (contentInfo.hasMaliciousContent) {
        threats.push("Malicious content detected")
        isClean = false
      }

      if (FileValidationService.isDangerousExtension(file.name)) {
        threats.push("Dangerous file extension")
        isClean = false
      }

      return {
        isClean,
        threats,
        scanResult: isClean ? "Clean" : `Threats detected: ${threats.join(', ')}`
      }
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { component: 'file-security', fileName: file.name, fileSize: file.size })
       
       return {
         isClean: false,
         threats: ["Scan failed"],
         scanResult: "Scan failed due to error"
       }
     }
  }

  /**
   * Log security event
   */
  private static async logSecurityEvent(
    file: File,
    userId: string,
    ipAddress: string,
    userAgent: string,
    securityInfo: {
      riskScore: number
      threats: string[]
      contentInfo: any
      isValid: boolean
      shouldQuarantine: boolean
      action?: string
    }
  ): Promise<void> {
    try {
      const auditData: Omit<FileUploadAudit, 'id' | 'createdAt'> = {
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        purpose: 'accommodation', // This should be passed as parameter
        status: securityInfo.shouldQuarantine ? 'quarantined' : (securityInfo.isValid ? 'uploaded' : 'rejected'),
        reason: securityInfo.threats.join(', ') || (securityInfo.isValid ? 'File uploaded successfully' : 'File validation failed'),
        securityChecks: {
          riskScore: securityInfo.riskScore,
          threats: securityInfo.threats,
          isSuspicious: securityInfo.riskScore > 50
        },
        ipAddress,
        userAgent
      }

      // Insert audit log into database
      await secureDb.db
        .insert(schema.fileUploadAudits)
        .values(auditData)

      // Log to Sentry for high-risk files
      if (securityInfo.riskScore > 70) {
        captureMessage('High-risk file upload attempt', { level: 'warning', component: 'file-security', fileName: file.name, fileSize: file.size, riskScore: securityInfo.riskScore, threats: securityInfo.threats, userId, ipAddress })
      }
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { component: 'file-security', fileName: file.name, userId })
    }
  }

  /**
   * Get file upload statistics for user
   */
  static async getUserFileStats(userId: string, days: number = 30): Promise<{
    totalUploads: number
    successfulUploads: number
    rejectedUploads: number
    quarantinedFiles: number
    totalSize: number
    averageRiskScore: number
  }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Query file upload audits
      const audits = await secureDb.db
        .select()
        .from(schema.fileUploadAudits)
        .where(
          and(
            eq(schema.fileUploadAudits.userId, userId),
            gte(schema.fileUploadAudits.createdAt, startDate)
          )
        )

      const totalUploads = audits.length
      const successfulUploads = audits.filter((a: any) => a.status === 'uploaded').length
      const rejectedUploads = audits.filter((a: any) => a.status === 'rejected').length
      const quarantinedFiles = audits.filter((a: any) => a.status === 'quarantined').length
      const totalSize = audits.reduce((sum: number, a: any) => sum + a.fileSize, 0)
      const averageRiskScore = audits.length > 0 
        ? audits.reduce((sum: number, a: any) => sum + (a.securityChecks as any).riskScore, 0) / audits.length 
        : 0

      return {
        totalUploads,
        successfulUploads,
        rejectedUploads,
        quarantinedFiles,
        totalSize,
        averageRiskScore
      }
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { component: 'file-security', userId, days })
       throw error
     }
  }

  /**
   * Clean up expired quarantined files
   */
  static async cleanupExpiredQuarantinedFiles(): Promise<{
    cleaned: number
    errors: number
  }> {
    try {
      const now = new Date()
      
      // Query expired quarantined files
      const expiredFiles = await secureDb.db
        .select()
        .from(schema.fileQuarantines)
        .where(
          and(
            eq(schema.fileQuarantines.status, 'quarantined'),
            lte(schema.fileQuarantines.expiresAt, now)
          )
        )

      let cleaned = 0
      let errors = 0

      // Delete expired files
      for (const file of expiredFiles) {
        try {
          await secureDb.db
            .update(schema.fileQuarantines)
            .set({ status: 'deleted' })
            .where(eq(schema.fileQuarantines.id, file.id))
          cleaned++
        } catch (error) {
          console.error(`Failed to delete quarantined file ${file.id}:`, error)
          errors++
        }
      }

      return { cleaned, errors }
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { component: 'file-security' })
       throw error
     }
  }
}
