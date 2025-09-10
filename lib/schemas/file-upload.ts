import { z } from "zod"

// File upload validation schema
export const FileUploadSchema = z.object({
  file: z.instanceof(File, { message: "Invalid file object" }),
  maxSize: z.number().positive("Max size must be positive"),
  allowedTypes: z.array(z.string(), "Allowed types must be an array"),
  allowedExtensions: z.array(z.string(), "Allowed extensions must be an array"),
  folder: z.string().min(1, "Folder is required"),
  userId: z.string().uuid("Invalid user ID"),
  purpose: z.enum(['accommodation', 'document', 'profile', 'accreditation'], "Invalid upload purpose"),
})

// File validation result schema
export const FileValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  fileInfo: z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    extension: z.string(),
    mimeType: z.string(),
    actualType: z.string().optional(),
    isImage: z.boolean(),
    isDocument: z.boolean(),
    dimensions: z.object({
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
  }),
  securityChecks: z.object({
    isSuspicious: z.boolean(),
    riskScore: z.number().min(0).max(100),
    threats: z.array(z.string()),
    isExecutable: z.boolean(),
    hasMaliciousContent: z.boolean(),
  }),
})

// File upload configuration schema
export const FileUploadConfigSchema = z.object({
  maxFileSize: z.number().positive("Max file size must be positive"),
  maxFiles: z.number().positive("Max files must be positive"),
  allowedMimeTypes: z.array(z.string(), "Allowed MIME types must be an array"),
  allowedExtensions: z.array(z.string(), "Allowed extensions must be an array"),
  scanForViruses: z.boolean().default(true),
  validateContent: z.boolean().default(true),
  generateThumbnails: z.boolean().default(false),
  compressImages: z.boolean().default(true),
  folder: z.string().min(1, "Folder is required"),
})

// File upload audit log schema
export const FileUploadAuditSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fileName: z.string(),
  fileSize: z.number(),
  fileType: z.string(),
  purpose: z.enum(['accommodation', 'document', 'profile', 'accreditation']),
  status: z.enum(['uploaded', 'rejected', 'quarantined', 'deleted']),
  reason: z.string().optional(),
  securityChecks: z.object({
    riskScore: z.number(),
    threats: z.array(z.string()),
    isSuspicious: z.boolean(),
  }),
  cloudinaryId: z.string().optional(),
  ipAddress: z.string(),
  userAgent: z.string(),
  createdAt: z.date(),
})

// File quarantine schema
export const FileQuarantineSchema = z.object({
  id: z.string().uuid(),
  originalFileName: z.string(),
  quarantinedFileName: z.string(),
  reason: z.string(),
  riskScore: z.number(),
  threats: z.array(z.string()),
  userId: z.string().uuid(),
  uploadedAt: z.date(),
  expiresAt: z.date(),
  status: z.enum(['quarantined', 'released', 'deleted']),
})

export type FileUpload = z.infer<typeof FileUploadSchema>
export type FileValidationResult = z.infer<typeof FileValidationResultSchema>
export type FileUploadConfig = z.infer<typeof FileUploadConfigSchema>
export type FileUploadAudit = z.infer<typeof FileUploadAuditSchema>
export type FileQuarantine = z.infer<typeof FileQuarantineSchema>

// File upload constants
export const FILE_UPLOAD_LIMITS = {
  IMAGE: {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  },
  DOCUMENT: {
    maxSize: 25 * 1024 * 1024, // 25MB
    maxFiles: 5,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
  },
  PROFILE: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  ACCREDITATION: {
    maxSize: 25 * 1024 * 1024, // 25MB
    maxFiles: 2,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
  },
} as const

// Dangerous file extensions that should be blocked
export const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh', '.ps1',
  '.dll', '.sys', '.drv', '.ocx', '.cpl', '.msi', '.msp', '.mst',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.iso', '.img'
] as const

// Suspicious file patterns
export const SUSPICIOUS_PATTERNS = [
  /eval\s*\(/i,
  /base64_decode/i,
  /document\.write/i,
  /innerHTML/i,
  /<script/i,
  /javascript:/i,
  /vbscript:/i,
  /onload=/i,
  /onerror=/i,
  /onclick=/i,
] as const
