import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { validateRequest, sanitizeInput } from "./validation-schemas"

// Validation middleware factory
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest) => {
    try {
      let data: unknown

      // For GET requests, validate query parameters instead of body
      if (request.method === 'GET') {
        const searchParams = new URL(request.url).searchParams
        data = Object.fromEntries(searchParams.entries())
        
        // Convert string values to appropriate types for validation
        for (const [key, value] of Object.entries(data as Record<string, string>)) {
          // Try to convert to number if it looks like a number
          if (value && !isNaN(Number(value)) && value.trim() !== '') {
            (data as any)[key] = Number(value)
          }
          // Convert boolean strings
          else if (value === 'true') {
            (data as any)[key] = true
          } else if (value === 'false') {
            (data as any)[key] = false
          }
        }
      } else {
        // Parse data based on content type for POST/PUT/PATCH/DELETE
        const contentType = request.headers.get('content-type') || ''
        
        if (contentType.includes('application/json')) {
          data = await request.json()
        } else if (contentType.includes('multipart/form-data')) {
          // For form data, we'll handle it in the route
          return null // Let the route handle it
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData()
          data = Object.fromEntries(formData.entries())
        } else {
          return NextResponse.json(
            { error: 'Unsupported content type' }, 
            { status: 400 }
          )
        }
      }

      // Validate the data
      const validation = validateRequest(schema, data)
      
      if (!validation.success) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validation.errors 
          }, 
          { status: 400 }
        )
      }

      // Sanitize string inputs
      const sanitizedData = sanitizeObject(validation.data)
      
      return { data: sanitizedData }
    } catch (error) {
      console.error('Validation middleware error:', error)
      return NextResponse.json(
        { error: 'Invalid request data' }, 
        { status: 400 }
      )
    }
  }
}

// Recursively sanitize object properties
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}

// Rate limiting middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function createRateLimitMiddleware(options: {
  windowMs: number
  max: number
  keyGenerator?: (req: NextRequest) => string
}) {
  return (request: NextRequest) => {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'
    const key = options.keyGenerator ? options.keyGenerator(request) : ip
    
    const now = Date.now()
    
    // Clean up old entries
    for (const [k, v] of Array.from(rateLimitMap.entries())) {
      if (v.resetTime < now) {
        rateLimitMap.delete(k)
      }
    }
    
    const current = rateLimitMap.get(key)
    
    if (!current) {
      rateLimitMap.set(key, { count: 1, resetTime: now + options.windowMs })
      return null
    }
    
    if (current.resetTime < now) {
      rateLimitMap.set(key, { count: 1, resetTime: now + options.windowMs })
      return null
    }
    
    if (current.count >= options.max) {
      return NextResponse.json(
        { error: 'Too many requests' }, 
        { status: 429 }
      )
    }
    
    current.count++
    return null
  }
}

// Payload size middleware
export function createPayloadSizeMiddleware(maxSize: number) {
  return (request: NextRequest) => {
    const contentLength = request.headers.get('content-length')
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        { error: 'Payload too large' }, 
        { status: 413 }
      )
    }
    
    return null
  }
}

// XSS protection middleware
export function createXSSProtectionMiddleware() {
  return (request: NextRequest) => {
    // Check for common XSS patterns in headers
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ]
    
    for (const pattern of xssPatterns) {
      if (pattern.test(userAgent) || pattern.test(referer)) {
        return NextResponse.json(
          { error: 'Suspicious request detected' }, 
          { status: 400 }
        )
      }
    }
    
    return null
  }
}

// Combined security middleware
export function createSecurityMiddleware(options: {
  validation?: z.ZodSchema<any>
  rateLimit?: { windowMs: number; max: number }
  maxPayloadSize?: number
  enableXSSProtection?: boolean
}) {
  return async (request: NextRequest) => {
    // XSS Protection
    if (options.enableXSSProtection) {
      const xssCheck = createXSSProtectionMiddleware()(request)
      if (xssCheck) return xssCheck
    }
    
    // Payload size check
    if (options.maxPayloadSize) {
      const sizeCheck = createPayloadSizeMiddleware(options.maxPayloadSize)(request)
      if (sizeCheck) return sizeCheck
    }
    
    // Rate limiting
    if (options.rateLimit) {
      const rateLimitCheck = createRateLimitMiddleware(options.rateLimit)(request)
      if (rateLimitCheck) return rateLimitCheck
    }
    
    // Validation
    if (options.validation) {
      const validationCheck = await createValidationMiddleware(options.validation)(request)
      if (validationCheck) return validationCheck
    }
    
    return null
  }
}

// Helper to extract validated data from request
export function getValidatedData<T>(request: NextRequest): T | null {
  // This would be set by the validation middleware
  return (request as any).validatedData || null
}
