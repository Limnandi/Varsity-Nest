import { NextRequest, NextResponse } from 'next/server'
import { SecurityMiddleware, SecurityConfig, defaultSecurityConfig } from './security-config'
import { ApiVersioning } from './api-versioning'
import { ApiErrorResponseBuilder } from './api-error-response'
import { createSecurityMiddleware } from './validation-middleware'
import { redis } from '@/lib/redis'
import { Sentry } from '@/lib/sentry'

export interface ApiMiddlewareOptions {
  security?: Partial<SecurityConfig>
  versioning?: boolean
  rateLimit?: boolean | { windowMs: number; max: number }
  requestSizeCheck?: boolean
  timeout?: number
  validation?: any
  cors?: boolean
  auth?: {
    required: boolean
    roles?: string[]
  }
}

export class ApiMiddleware {
  /**
   * Apply comprehensive API middleware
   */
  static async apply(
    request: NextRequest,
    options: ApiMiddlewareOptions = {}
  ): Promise<NextResponse | null> {
    const config = { ...defaultSecurityConfig, ...options.security }
    
    try {
      // 1. Handle CORS preflight
      if (request.method === 'OPTIONS' && options.cors !== false) {
        const response = new NextResponse(null, { status: 200 })
        return SecurityMiddleware.applyCORS(response, config)
      }

      // 2. Check request size
      if (options.requestSizeCheck !== false) {
        const sizeCheck = SecurityMiddleware.checkRequestSize(request, config)
        if (sizeCheck) return sizeCheck
      }

      // 3. Apply rate limiting
      if (options.rateLimit !== false) {
        // Use custom rate limit config if provided, otherwise use default
        const rateLimitConfig = typeof options.rateLimit === 'object' 
          ? { ...config, rateLimit: { ...config.rateLimit, ...options.rateLimit } }
          : config
        const rateLimitCheck = SecurityMiddleware.checkRateLimit(request, rateLimitConfig)
        if (rateLimitCheck) return rateLimitCheck
      }

      // 4. Handle API versioning
      if (options.versioning !== false) {
        const version = ApiVersioning.extractVersion(request)
        const validation = ApiVersioning.validateVersion(version)
        if (!validation.valid) return validation.error!
      }

      // 5. Apply security validation middleware
      if (options.validation) {
        const rateLimitConfig = typeof options.rateLimit === 'object' 
          ? options.rateLimit 
          : options.rateLimit !== false ? config.rateLimit : undefined
          
        const securityMiddleware = createSecurityMiddleware({
          validation: options.validation,
          rateLimit: rateLimitConfig,
          maxPayloadSize: options.requestSizeCheck !== false ? config.requestSize.maxSize : undefined,
          enableXSSProtection: true
        })
        
        const securityCheck = await securityMiddleware(request)
        if (securityCheck && 'status' in securityCheck) return securityCheck
      }

      return null // All checks passed
    } catch (error) {
      return await ApiErrorResponseBuilder.createErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        request,
        { component: 'api_middleware' }
      )
    }
  }

  /**
   * Wrap API handler with middleware
   */
  static withMiddleware<T extends any[]>(
    handler: (...args: T) => Promise<NextResponse>,
    options: ApiMiddlewareOptions = {}
  ) {
    return async (...args: T): Promise<NextResponse> => {
      const request = args[0] as NextRequest
      const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const url = new URL(request.url)
      const routeKey = `${request.method}:${url.pathname}`
      
      // Apply middleware checks
      const middlewareResponse = await this.apply(request, options)
      if (middlewareResponse) return middlewareResponse

      try {
        // Execute handler with timeout
        const timeout = options.timeout || defaultSecurityConfig.timeout.apiTimeout
        const response = await SecurityMiddleware.withTimeout(handler(...args), timeout)

        // Timing
        const finishedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
        const durationMs = Math.round((finishedAt as number) - (startedAt as number))
        response.headers.set('Server-Timing', `total;dur=${durationMs}`)
        response.headers.set('X-Response-Time', `${durationMs}ms`)

        // Apply security headers
        const securityConfig = options.security ? { ...defaultSecurityConfig, ...options.security } : defaultSecurityConfig
        const securedResponse = SecurityMiddleware.applySecurityHeaders(response, securityConfig)
        
        // Apply CORS if enabled
        if (options.cors !== false) {
          const finalResponse = SecurityMiddleware.applyCORS(securedResponse, securityConfig)

          // Fire-and-forget counters (best-effort) - no blocking
          ;(async () => {
            try {
              const status = finalResponse.status
              const minuteBucket = new Date().toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM
              await redis.incr(`metrics:req:count`)
              await redis.incr(`metrics:req:route:${routeKey}`)
              await redis.incr(`metrics:req:status:${status}`)
              await redis.incr(`metrics:req:minute:${minuteBucket}`)
              await redis.setex(`metrics:req:last:${routeKey}`, 300, String(Date.now()))
            } catch (e) {
              // swallow metrics errors; never block request
            }
          })()

          // Log slow handlers
          if (durationMs > 1000) {
            Sentry.captureMessage('Slow API handler detected', {
              level: 'warning',
              tags: { component: 'api_middleware' },
              extra: { routeKey, durationMs }
            })
          }

          return finalResponse
        }

        return securedResponse
      } catch (error) {
        const errorResponse = await ApiErrorResponseBuilder.createErrorResponse(
          error instanceof Error ? error : new Error(String(error)),
          request,
          { component: 'api_handler' }
        )

        // Apply security headers to error response
        const securityConfig = options.security ? { ...defaultSecurityConfig, ...options.security } : defaultSecurityConfig
        const finalError = SecurityMiddleware.applySecurityHeaders(errorResponse, securityConfig)

        // Increment error counter best-effort
        ;(async () => {
          try {
            const url = new URL(request.url)
            const routeKey = `${request.method}:${url.pathname}`
            await redis.incr(`metrics:req:errors`)
            await redis.incr(`metrics:req:errors:${routeKey}`)
          } catch {}
        })()

        return finalError
      }
    }
  }

  /**
   * Create standardized API response
   */
  static createResponse<T>(
    data: T,
    message?: string,
    status: number = 200
  ): NextResponse {
    const response = ApiErrorResponseBuilder.createSuccessResponse(data, message)
    return new NextResponse(response.body, { 
      status,
      headers: response.headers
    })
  }

  /**
   * Create error response with proper formatting
   */
  static async createErrorResponse(
    error: Error | string,
    request: NextRequest,
    status: number = 500,
    context: Record<string, any> = {}
  ): Promise<NextResponse> {
    return await ApiErrorResponseBuilder.createErrorResponse(
      error instanceof Error ? error : new Error(String(error)),
      request,
      context
    )
  }

  /**
   * Handle OPTIONS requests for CORS
   */
  static handleCORS(request: NextRequest, config: SecurityConfig = defaultSecurityConfig): NextResponse {
    const response = new NextResponse(null, { status: 200 })
    return SecurityMiddleware.applyCORS(response, config)
  }
}

/**
 * Decorator for API routes with comprehensive middleware
 */
export function withApiMiddleware(options: ApiMiddlewareOptions = {}) {
  return function <T extends any[]>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<NextResponse>>
  ) {
    if (descriptor.value) {
      const originalMethod = descriptor.value
      descriptor.value = ApiMiddleware.withMiddleware(originalMethod, options)
    }
    return descriptor
  }
}

/**
 * Higher-order function for API route handlers
 */
export function createApiHandler(options: ApiMiddlewareOptions = {}) {
  return <T extends any[]>(
    handler: (...args: T) => Promise<NextResponse>
  ) => {
    return ApiMiddleware.withMiddleware(handler, options)
  }
}
