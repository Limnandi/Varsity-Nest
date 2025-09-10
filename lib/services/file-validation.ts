import { FileValidationResult, DANGEROUS_EXTENSIONS, SUSPICIOUS_PATTERNS } from "@/lib/schemas/file-upload"
import { Sentry } from "@/lib/sentry"

export class FileValidationService {
  /**
   * Validate file content by reading file headers
   */
  static async validateFileContent(file: File): Promise<{
    actualType: string
    isImage: boolean
    isDocument: boolean
    dimensions?: { width: number; height: number }
    isExecutable: boolean
    hasMaliciousContent: boolean
  }> {
    try {
      const buffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(buffer)
      
      // Read file headers to determine actual file type
      const actualType = this.getActualFileType(uint8Array)
      const isImage = this.isImageFile(actualType, uint8Array)
      const isDocument = this.isDocumentFile(actualType)
      const isExecutable = this.isExecutableFile(actualType, uint8Array)
      const hasMaliciousContent = this.hasMaliciousContent(uint8Array)
      
      let dimensions: { width: number; height: number } | undefined
      if (isImage) {
        dimensions = await this.getImageDimensions(uint8Array)
      }
      
      return {
        actualType,
        isImage,
        isDocument,
        dimensions,
        isExecutable,
        hasMaliciousContent
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'file-validation' },
        extra: { fileName: file.name, fileSize: file.size }
      })
      throw new Error('Failed to validate file content')
    }
  }

  /**
   * Get actual file type from file headers
   */
  private static getActualFileType(uint8Array: Uint8Array): string {
    const header = uint8Array.slice(0, 16)
    
    // Check magic numbers for common file types
    if (this.startsWith(header, [0xFF, 0xD8, 0xFF])) return 'image/jpeg'
    if (this.startsWith(header, [0x89, 0x50, 0x4E, 0x47])) return 'image/png'
    if (this.startsWith(header, [0x47, 0x49, 0x46, 0x38])) return 'image/gif'
    if (this.startsWith(header, [0x52, 0x49, 0x46, 0x46])) return 'image/webp'
    if (this.startsWith(header, [0x25, 0x50, 0x44, 0x46])) return 'application/pdf'
    if (this.startsWith(header, [0x4D, 0x5A])) return 'application/x-msdownload' // EXE
    if (this.startsWith(header, [0x50, 0x4B, 0x03, 0x04])) return 'application/zip'
    if (this.startsWith(header, [0x7F, 0x45, 0x4C, 0x46])) return 'application/x-executable' // ELF
    
    return 'application/octet-stream'
  }

  /**
   * Check if file is an image based on type and content
   */
  private static isImageFile(actualType: string, uint8Array: Uint8Array): boolean {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!imageTypes.includes(actualType)) return false
    
    // Additional validation for images
    if (actualType === 'image/jpeg') {
      return this.isValidJPEG(uint8Array)
    }
    if (actualType === 'image/png') {
      return this.isValidPNG(uint8Array)
    }
    if (actualType === 'image/gif') {
      return this.isValidGIF(uint8Array)
    }
    if (actualType === 'image/webp') {
      return this.isValidWebP(uint8Array)
    }
    
    return true
  }

  /**
   * Check if file is a document
   */
  private static isDocumentFile(actualType: string): boolean {
    const documentTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    return documentTypes.includes(actualType)
  }

  /**
   * Check if file is executable
   */
  private static isExecutableFile(actualType: string, uint8Array: Uint8Array): boolean {
    const executableTypes = [
      'application/x-msdownload',
      'application/x-executable',
      'application/x-sharedlib',
      'application/x-elf'
    ]
    
    if (executableTypes.includes(actualType)) return true
    
    // Check for shebang
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array.slice(0, 100))
    return text.startsWith('#!')
  }

  /**
   * Check for malicious content patterns
   */
  private static hasMaliciousContent(uint8Array: Uint8Array): boolean {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array)
    
    return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(text))
  }

  /**
   * Get image dimensions
   */
  private static async getImageDimensions(uint8Array: Uint8Array): Promise<{ width: number; height: number } | undefined> {
    try {
      // For JPEG
      if (this.startsWith(uint8Array.slice(0, 3), [0xFF, 0xD8, 0xFF])) {
        return this.getJPEGDimensions(uint8Array)
      }
      
      // For PNG
      if (this.startsWith(uint8Array.slice(0, 8), [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
        return this.getPNGDimensions(uint8Array)
      }
      
      // For GIF
      if (this.startsWith(uint8Array.slice(0, 6), [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) || 
          this.startsWith(uint8Array.slice(0, 6), [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) {
        return this.getGIFDimensions(uint8Array)
      }
      
      return undefined
    } catch (error) {
      console.warn('Failed to get image dimensions:', error)
      return undefined
    }
  }

  /**
   * Get JPEG dimensions
   */
  private static getJPEGDimensions(uint8Array: Uint8Array): { width: number; height: number } | undefined {
    let i = 2
    while (i < uint8Array.length - 1) {
      if (uint8Array[i] === 0xFF && uint8Array[i + 1] === 0xC0) {
        const height = (uint8Array[i + 5] << 8) | uint8Array[i + 6]
        const width = (uint8Array[i + 7] << 8) | uint8Array[i + 8]
        return { width, height }
      }
      i++
    }
    return undefined
  }

  /**
   * Get PNG dimensions
   */
  private static getPNGDimensions(uint8Array: Uint8Array): { width: number; height: number } | undefined {
    if (uint8Array.length < 24) return undefined
    
    const width = (uint8Array[16] << 24) | (uint8Array[17] << 16) | (uint8Array[18] << 8) | uint8Array[19]
    const height = (uint8Array[20] << 24) | (uint8Array[21] << 16) | (uint8Array[22] << 8) | uint8Array[23]
    
    return { width, height }
  }

  /**
   * Get GIF dimensions
   */
  private static getGIFDimensions(uint8Array: Uint8Array): { width: number; height: number } | undefined {
    if (uint8Array.length < 10) return undefined
    
    const width = uint8Array[6] | (uint8Array[7] << 8)
    const height = uint8Array[8] | (uint8Array[9] << 8)
    
    return { width, height }
  }

  /**
   * Validate JPEG file
   */
  private static isValidJPEG(uint8Array: Uint8Array): boolean {
    if (!this.startsWith(uint8Array.slice(0, 3), [0xFF, 0xD8, 0xFF])) return false
    if (!this.startsWith(uint8Array.slice(-2), [0xFF, 0xD9])) return false
    return true
  }

  /**
   * Validate PNG file
   */
  private static isValidPNG(uint8Array: Uint8Array): boolean {
    const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
    return this.startsWith(uint8Array.slice(0, 8), pngSignature)
  }

  /**
   * Validate GIF file
   */
  private static isValidGIF(uint8Array: Uint8Array): boolean {
    const gif87a = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]
    const gif89a = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]
    return this.startsWith(uint8Array.slice(0, 6), gif87a) || 
           this.startsWith(uint8Array.slice(0, 6), gif89a)
  }

  /**
   * Validate WebP file
   */
  private static isValidWebP(uint8Array: Uint8Array): boolean {
    if (!this.startsWith(uint8Array.slice(0, 4), [0x52, 0x49, 0x46, 0x46])) return false
    if (!this.startsWith(uint8Array.slice(8, 12), [0x57, 0x45, 0x42, 0x50])) return false
    return true
  }

  /**
   * Check if array starts with specific bytes
   */
  private static startsWith(array: Uint8Array, pattern: number[]): boolean {
    if (array.length < pattern.length) return false
    return pattern.every((byte, index) => array[index] === byte)
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.')
    return lastDot === -1 ? '' : filename.toLowerCase().substring(lastDot)
  }

  /**
   * Check if file extension is dangerous
   */
  static isDangerousExtension(filename: string): boolean {
    const extension = this.getFileExtension(filename)
    return DANGEROUS_EXTENSIONS.includes(extension as any)
  }

  /**
   * Calculate file risk score
   */
  static calculateRiskScore(file: File, contentInfo: any): number {
    let riskScore = 0
    
    // Base risk from file type
    if (contentInfo.isExecutable) riskScore += 50
    if (contentInfo.hasMaliciousContent) riskScore += 40
    if (this.isDangerousExtension(file.name)) riskScore += 30
    
    // Risk from file size (unusually large files)
    if (file.size > 50 * 1024 * 1024) riskScore += 20 // > 50MB
    if (file.size > 100 * 1024 * 1024) riskScore += 30 // > 100MB
    
    // Risk from filename patterns
    const suspiciousNames = /\.(exe|bat|cmd|scr|vbs|js|jar|php|asp|jsp)$/i
    if (suspiciousNames.test(file.name)) riskScore += 25
    
    // Risk from MIME type mismatch
    if (file.type !== contentInfo.actualType) riskScore += 15
    
    return Math.min(riskScore, 100)
  }
}
