import { z } from "zod"

// Base validation schemas
export const emailSchema = z.string().email("Invalid email format").max(255, "Email too long")
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long")
export const nameSchema = z.string().min(1, "Name required").max(100, "Name too long").regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters")
export const phoneSchema = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format").max(20, "Phone number too long")

// Accommodation validation schemas
export const accommodationCreateSchema = z.object({
  name: z.string().min(1, "Name required").max(200, "Name too long").regex(/^[a-zA-Z0-9\s\-'.,&()]+$/, "Name contains invalid characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  address: z.string().min(5, "Address required").max(500, "Address too long"),
  price: z.number().positive("Price must be positive").max(999999, "Price too high"),
  amenities: z.array(z.string().max(100, "Amenity name too long")).max(20, "Too many amenities"),
  // Allow card image + exactly 10 gallery images (total up to 11)
  images: z.array(z.string().url("Invalid image URL")).max(11, "Too many images"),
  area: z.string().min(1, "Area required").max(100, "Area name too long"),
  distance: z.number().min(0, "Distance cannot be negative").max(1000, "Distance too high").optional(),
  featured: z.boolean().optional(),
  available_rooms: z.number().int().min(0, "Available rooms cannot be negative").max(1000, "Too many rooms"),
  total_rooms: z.number().int().min(1, "Total rooms must be at least 1").max(1000, "Too many rooms"),
  is_verified: z.boolean().optional(),
  is_open: z.boolean().optional(),
  accreditation_status: z.enum(['accredited', 'non-accredited', 'provisionally-accredited']).optional(),
  has_single_rooms: z.boolean(),
  has_sharing_rooms: z.boolean(),
  single_room_price: z.number().positive("Single room price must be positive").max(999999, "Price too high").optional(),
  sharing_room_price: z.number().positive("Sharing room price must be positive").max(999999, "Price too high").optional(),
  single_rooms_total: z.number().int().min(0, "Single rooms total cannot be negative").max(1000, "Too many rooms").optional(),
  single_rooms_available: z.number().int().min(0, "Single rooms available cannot be negative").max(1000, "Too many rooms").optional(),
  sharing_rooms_total: z.number().int().min(0, "Sharing rooms total cannot be negative").max(1000, "Too many rooms").optional(),
  sharing_rooms_available: z.number().int().min(0, "Sharing rooms available cannot be negative").max(1000, "Too many rooms").optional(),
}).refine((data) => {
  // At least one room type must be selected
  if (!data.has_single_rooms && !data.has_sharing_rooms) {
    return false
  }
  return true
}, {
  message: "At least one room type (Single or Sharing) must be selected",
  path: ["has_single_rooms"]
}).refine((data) => {
  // If single rooms are selected, price and counts are required
  if (data.has_single_rooms) {
    if (!data.single_room_price || data.single_room_price <= 0) return false
    if (data.single_rooms_total === undefined || data.single_rooms_total <= 0) return false
    if (data.single_rooms_available === undefined || data.single_rooms_available < 0) return false
    if (data.single_rooms_available > data.single_rooms_total) return false
  }
  return true
}, {
  message: "Single room price, total, and available count are required when single rooms are selected",
  path: ["single_room_price"]
}).refine((data) => {
  // If sharing rooms are selected, price and counts are required
  if (data.has_sharing_rooms) {
    if (!data.sharing_room_price || data.sharing_room_price <= 0) return false
    if (data.sharing_rooms_total === undefined || data.sharing_rooms_total <= 0) return false
    if (data.sharing_rooms_available === undefined || data.sharing_rooms_available < 0) return false
    if (data.sharing_rooms_available > data.sharing_rooms_total) return false
  }
  return true
}, {
  message: "Sharing room price, total, and available count are required when sharing rooms are selected",
  path: ["sharing_room_price"]
}).refine((data) => {
  // Room type totals must match overall total
  const singleTotal = data.has_single_rooms ? (data.single_rooms_total || 0) : 0
  const sharingTotal = data.has_sharing_rooms ? (data.sharing_rooms_total || 0) : 0
  return singleTotal + sharingTotal === data.total_rooms
}, {
  message: "The sum of single rooms and sharing rooms must equal the total rooms",
  path: ["total_rooms"]
}).refine((data) => {
  // Room type available must match overall available
  const singleAvailable = data.has_single_rooms ? (data.single_rooms_available || 0) : 0
  const sharingAvailable = data.has_sharing_rooms ? (data.sharing_rooms_available || 0) : 0
  return singleAvailable + sharingAvailable === data.available_rooms
}, {
  message: "The sum of available single rooms and sharing rooms must equal the total available rooms",
  path: ["available_rooms"]
})

export const accommodationUpdateSchema = accommodationCreateSchema.partial()

// User registration schemas
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.enum(['student', 'provider', 'admin']).optional(),
  phone: phoneSchema.optional()
})

// Provider registration schemas
export const providerRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  companyName: z.string().min(1, "Company name required").max(200, "Company name too long"),
  phone: phoneSchema,
  address: z.string().min(5, "Address required").max(500, "Address too long"),
  description: z.string().min(10, "Description required").max(1000, "Description too long"),
  website: z.string().url("Invalid website URL").optional(),
  documents: z.array(z.string().url("Invalid document URL")).max(5, "Too many documents").optional()
})

// Provider form data schema (for StackAuth users without password)
export const providerFormDataSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  companyName: z.string().min(1, "Company name required").max(200, "Company name too long"),
  phone: z.string().optional().or(z.literal('')), // Allow empty string or valid phone
  address: z.string().optional(), // Make optional since form doesn't collect it
  description: z.string().optional(), // Make optional since form doesn't collect it
  website: z.string().optional().or(z.literal('')), // Allow empty string
  documents: z.array(z.string().url("Invalid document URL")).max(5, "Too many documents").optional()
})

// Payment schemas
export const paymentInitiateSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(999999, "Amount too high"),
  providerId: z.string().uuid("Invalid provider ID"),
  wantsFeatured: z.boolean().optional(),
  customData: z.record(z.string(), z.any()).optional()
})

// Admin schemas
export const adminDomainSchema = z.object({
  domain: z.string().min(1, "Domain required").max(100, "Domain too long").regex(/^@?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
  university: z.string().min(1, "University required").max(200, "University name too long"),
  isActive: z.boolean().optional()
})

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().max(100, "Search query too long").optional(),
  minPrice: z.number().min(0, "Min price cannot be negative").optional(),
  maxPrice: z.number().min(0, "Max price cannot be negative").optional(),
  area: z.string().max(100, "Area name too long").optional(),
  amenities: z.array(z.string().max(100, "Amenity name too long")).max(10, "Too many amenities").optional(),
  status: z.enum(['accredited', 'non-accredited', 'provisionally-accredited']).optional(),
  featured: z.boolean().optional(),
  page: z.number().int().min(1, "Page must be at least 1").max(1000, "Page too high").optional(),
  limit: z.number().int().min(1, "Limit must be at least 1").max(100, "Limit too high").optional(),
  offset: z.number().int().min(0, "Offset cannot be negative").optional(),
  providerId: z.string().uuid("Invalid provider ID").optional()
})

// OTP schemas
export const otpRequestSchema = z.object({
  email: emailSchema,
  type: z.enum(['registration', 'password_reset', 'verification']).optional()
})

export const otpVerifySchema = z.object({
  email: emailSchema,
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must contain only digits")
})

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File).refine(file => file.size <= 10 * 1024 * 1024, "File too large (max 10MB)"),
  type: z.enum(['image', 'document']),
  category: z.string().max(50, "Category name too long")
})

// Input sanitization function
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes that could break SQL
    .replace(/[;]/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*.*?\*\//g, '') // Remove block comments
    .substring(0, 1000) // Limit length
}

// Validation middleware helper
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}

// Rate limiting schemas
export const rateLimitSchema = z.object({
  windowMs: z.number().int().min(1000, "Window too small").max(3600000, "Window too large"),
  max: z.number().int().min(1, "Max requests must be at least 1").max(10000, "Max requests too high"),
  keyGenerator: z.function().optional()
})

// XSS protection function
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// SQL injection protection
export function sanitizeForSql(input: string): string {
  return input
    .replace(/['";]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*.*?\*\//g, '') // Remove block comments
    .replace(/(union|select|insert|update|delete|drop|create|alter|truncate)/gi, '') // Remove SQL keywords
    .trim()
}
