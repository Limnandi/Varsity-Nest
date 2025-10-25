"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUSPICIOUS_PATTERNS = exports.DANGEROUS_EXTENSIONS = exports.FILE_UPLOAD_LIMITS = exports.FileQuarantineSchema = exports.FileUploadAuditSchema = exports.FileUploadConfigSchema = exports.FileValidationResultSchema = exports.FileUploadSchema = void 0;
var zod_1 = require("zod");
// File upload validation schema
exports.FileUploadSchema = zod_1.z.object({
    file: zod_1.z.instanceof(File, { message: "Invalid file object" }),
    maxSize: zod_1.z.number().positive("Max size must be positive"),
    allowedTypes: zod_1.z.array(zod_1.z.string(), "Allowed types must be an array"),
    allowedExtensions: zod_1.z.array(zod_1.z.string(), "Allowed extensions must be an array"),
    folder: zod_1.z.string().min(1, "Folder is required"),
    userId: zod_1.z.string().uuid("Invalid user ID"),
    purpose: zod_1.z.enum(['accommodation', 'document', 'profile', 'accreditation'], "Invalid upload purpose"),
});
// File validation result schema
exports.FileValidationResultSchema = zod_1.z.object({
    isValid: zod_1.z.boolean(),
    errors: zod_1.z.array(zod_1.z.string()),
    warnings: zod_1.z.array(zod_1.z.string()),
    fileInfo: zod_1.z.object({
        name: zod_1.z.string(),
        size: zod_1.z.number(),
        type: zod_1.z.string(),
        extension: zod_1.z.string(),
        mimeType: zod_1.z.string(),
        actualType: zod_1.z.string().optional(),
        isImage: zod_1.z.boolean(),
        isDocument: zod_1.z.boolean(),
        dimensions: zod_1.z.object({
            width: zod_1.z.number().optional(),
            height: zod_1.z.number().optional(),
        }).optional(),
    }),
    securityChecks: zod_1.z.object({
        isSuspicious: zod_1.z.boolean(),
        riskScore: zod_1.z.number().min(0).max(100),
        threats: zod_1.z.array(zod_1.z.string()),
        isExecutable: zod_1.z.boolean(),
        hasMaliciousContent: zod_1.z.boolean(),
    }),
});
// File upload configuration schema
exports.FileUploadConfigSchema = zod_1.z.object({
    maxFileSize: zod_1.z.number().positive("Max file size must be positive"),
    maxFiles: zod_1.z.number().positive("Max files must be positive"),
    allowedMimeTypes: zod_1.z.array(zod_1.z.string(), "Allowed MIME types must be an array"),
    allowedExtensions: zod_1.z.array(zod_1.z.string(), "Allowed extensions must be an array"),
    scanForViruses: zod_1.z.boolean().default(true),
    validateContent: zod_1.z.boolean().default(true),
    generateThumbnails: zod_1.z.boolean().default(false),
    compressImages: zod_1.z.boolean().default(true),
    folder: zod_1.z.string().min(1, "Folder is required"),
});
// File upload audit log schema
exports.FileUploadAuditSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    fileName: zod_1.z.string(),
    fileSize: zod_1.z.number(),
    fileType: zod_1.z.string(),
    purpose: zod_1.z.enum(['accommodation', 'document', 'profile', 'accreditation']),
    status: zod_1.z.enum(['uploaded', 'rejected', 'quarantined', 'deleted']),
    reason: zod_1.z.string().optional(),
    securityChecks: zod_1.z.object({
        riskScore: zod_1.z.number(),
        threats: zod_1.z.array(zod_1.z.string()),
        isSuspicious: zod_1.z.boolean(),
    }),
    cloudinaryId: zod_1.z.string().optional(),
    ipAddress: zod_1.z.string(),
    userAgent: zod_1.z.string(),
    createdAt: zod_1.z.date(),
});
// File quarantine schema
exports.FileQuarantineSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    originalFileName: zod_1.z.string(),
    quarantinedFileName: zod_1.z.string(),
    reason: zod_1.z.string(),
    riskScore: zod_1.z.number(),
    threats: zod_1.z.array(zod_1.z.string()),
    userId: zod_1.z.string().uuid(),
    uploadedAt: zod_1.z.date(),
    expiresAt: zod_1.z.date(),
    status: zod_1.z.enum(['quarantined', 'released', 'deleted']),
});
// File upload constants
exports.FILE_UPLOAD_LIMITS = {
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
};
// Dangerous file extensions that should be blocked
exports.DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh', '.ps1',
    '.dll', '.sys', '.drv', '.ocx', '.cpl', '.msi', '.msp', '.mst',
    '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.iso', '.img'
];
// Suspicious file patterns
exports.SUSPICIOUS_PATTERNS = [
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
];
