"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitSchema = exports.fileUploadSchema = exports.otpVerifySchema = exports.otpRequestSchema = exports.searchSchema = exports.adminDomainSchema = exports.paymentInitiateSchema = exports.providerFormDataSchema = exports.providerRegistrationSchema = exports.userRegistrationSchema = exports.accommodationUpdateSchema = exports.accommodationCreateSchema = exports.phoneSchema = exports.nameSchema = exports.passwordSchema = exports.emailSchema = void 0;
exports.sanitizeInput = sanitizeInput;
exports.validateRequest = validateRequest;
exports.escapeHtml = escapeHtml;
exports.sanitizeForSql = sanitizeForSql;
var zod_1 = require("zod");
// Base validation schemas
exports.emailSchema = zod_1.z.string().email("Invalid email format").max(255, "Email too long");
exports.passwordSchema = zod_1.z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long");
exports.nameSchema = zod_1.z.string().min(1, "Name required").max(100, "Name too long").regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters");
exports.phoneSchema = zod_1.z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format").max(20, "Phone number too long");
// Accommodation validation schemas
exports.accommodationCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name required").max(200, "Name too long").regex(/^[a-zA-Z0-9\s\-'.,&()]+$/, "Name contains invalid characters"),
    description: zod_1.z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
    address: zod_1.z.string().min(5, "Address required").max(500, "Address too long"),
    price: zod_1.z.number().positive("Price must be positive").max(999999, "Price too high"),
    amenities: zod_1.z.array(zod_1.z.string().max(100, "Amenity name too long")).max(20, "Too many amenities"),
    images: zod_1.z.array(zod_1.z.string().url("Invalid image URL")).max(10, "Too many images"),
    area: zod_1.z.string().max(100, "Area name too long").optional(),
    distance: zod_1.z.number().min(0, "Distance cannot be negative").max(1000, "Distance too high").optional(),
    featured: zod_1.z.boolean().optional(),
    available_rooms: zod_1.z.number().int().min(0, "Available rooms cannot be negative").max(1000, "Too many rooms"),
    total_rooms: zod_1.z.number().int().min(1, "Total rooms must be at least 1").max(1000, "Too many rooms"),
    is_verified: zod_1.z.boolean().optional(),
    is_open: zod_1.z.boolean().optional(),
    accreditation_status: zod_1.z.enum(['accredited', 'non-accredited', 'provisionally-accredited']).optional()
});
exports.accommodationUpdateSchema = exports.accommodationCreateSchema.partial();
// User registration schemas
exports.userRegistrationSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
    firstName: exports.nameSchema,
    lastName: exports.nameSchema,
    role: zod_1.z.enum(['student', 'provider', 'admin']).optional(),
    phone: exports.phoneSchema.optional()
});
// Provider registration schemas
exports.providerRegistrationSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
    firstName: exports.nameSchema,
    lastName: exports.nameSchema,
    companyName: zod_1.z.string().min(1, "Company name required").max(200, "Company name too long"),
    phone: exports.phoneSchema,
    address: zod_1.z.string().min(5, "Address required").max(500, "Address too long"),
    description: zod_1.z.string().min(10, "Description required").max(1000, "Description too long"),
    website: zod_1.z.string().url("Invalid website URL").optional(),
    documents: zod_1.z.array(zod_1.z.string().url("Invalid document URL")).max(5, "Too many documents").optional()
});
// Provider form data schema (for StackAuth users without password)
exports.providerFormDataSchema = zod_1.z.object({
    email: exports.emailSchema,
    firstName: exports.nameSchema,
    lastName: exports.nameSchema,
    companyName: zod_1.z.string().min(1, "Company name required").max(200, "Company name too long"),
    phone: zod_1.z.string().optional().or(zod_1.z.literal('')), // Allow empty string or valid phone
    address: zod_1.z.string().optional(), // Make optional since form doesn't collect it
    description: zod_1.z.string().optional(), // Make optional since form doesn't collect it
    website: zod_1.z.string().optional().or(zod_1.z.literal('')), // Allow empty string
    documents: zod_1.z.array(zod_1.z.string().url("Invalid document URL")).max(5, "Too many documents").optional()
});
// Payment schemas
exports.paymentInitiateSchema = zod_1.z.object({
    amount: zod_1.z.number().positive("Amount must be positive").max(999999, "Amount too high"),
    providerId: zod_1.z.string().uuid("Invalid provider ID"),
    wantsFeatured: zod_1.z.boolean().optional(),
    customData: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional()
});
// Admin schemas
exports.adminDomainSchema = zod_1.z.object({
    domain: zod_1.z.string().min(1, "Domain required").max(100, "Domain too long").regex(/^@?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
    university: zod_1.z.string().min(1, "University required").max(200, "University name too long"),
    isActive: zod_1.z.boolean().optional()
});
// Search and filter schemas
exports.searchSchema = zod_1.z.object({
    query: zod_1.z.string().max(100, "Search query too long").optional(),
    minPrice: zod_1.z.number().min(0, "Min price cannot be negative").optional(),
    maxPrice: zod_1.z.number().min(0, "Max price cannot be negative").optional(),
    area: zod_1.z.string().max(100, "Area name too long").optional(),
    amenities: zod_1.z.array(zod_1.z.string().max(100, "Amenity name too long")).max(10, "Too many amenities").optional(),
    status: zod_1.z.enum(['accredited', 'non-accredited', 'provisionally-accredited']).optional(),
    featured: zod_1.z.boolean().optional(),
    page: zod_1.z.number().int().min(1, "Page must be at least 1").max(1000, "Page too high").optional(),
    limit: zod_1.z.number().int().min(1, "Limit must be at least 1").max(100, "Limit too high").optional(),
    offset: zod_1.z.number().int().min(0, "Offset cannot be negative").optional(),
    providerId: zod_1.z.string().uuid("Invalid provider ID").optional()
});
// OTP schemas
exports.otpRequestSchema = zod_1.z.object({
    email: exports.emailSchema,
    type: zod_1.z.enum(['registration', 'password_reset', 'verification']).optional()
});
exports.otpVerifySchema = zod_1.z.object({
    email: exports.emailSchema,
    otp: zod_1.z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must contain only digits")
});
// File upload schemas
exports.fileUploadSchema = zod_1.z.object({
    file: zod_1.z.instanceof(File).refine(function (file) { return file.size <= 10 * 1024 * 1024; }, "File too large (max 10MB)"),
    type: zod_1.z.enum(['image', 'document']),
    category: zod_1.z.string().max(50, "Category name too long")
});
// Input sanitization function
function sanitizeInput(input) {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/['"]/g, '') // Remove quotes that could break SQL
        .replace(/[;]/g, '') // Remove semicolons
        .replace(/--/g, '') // Remove SQL comments
        .replace(/\/\*.*?\*\//g, '') // Remove block comments
        .substring(0, 1000); // Limit length
}
// Validation middleware helper
function validateRequest(schema, data) {
    try {
        var validatedData = schema.parse(data);
        return { success: true, data: validatedData };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                errors: error.issues.map(function (err) { return "".concat(err.path.join('.'), ": ").concat(err.message); })
            };
        }
        return { success: false, errors: ['Validation failed'] };
    }
}
// Rate limiting schemas
exports.rateLimitSchema = zod_1.z.object({
    windowMs: zod_1.z.number().int().min(1000, "Window too small").max(3600000, "Window too large"),
    max: zod_1.z.number().int().min(1, "Max requests must be at least 1").max(10000, "Max requests too high"),
    keyGenerator: zod_1.z.function().optional()
});
// XSS protection function
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
// SQL injection protection
function sanitizeForSql(input) {
    return input
        .replace(/['";]/g, '') // Remove quotes and semicolons
        .replace(/--/g, '') // Remove SQL comments
        .replace(/\/\*.*?\*\//g, '') // Remove block comments
        .replace(/(union|select|insert|update|delete|drop|create|alter|truncate)/gi, '') // Remove SQL keywords
        .trim();
}
