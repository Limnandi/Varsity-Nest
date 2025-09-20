import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { Sentry } from '@/lib/sentry'

export interface SecurityConfig {
  cors: {
    origin: string[]
    methods: string[]
    allowedHeaders: string[]
    credentials: boolean
  }
  headers: {
    csp: string
    hsts: string
    xFrameOptions: string
    xContentTypeOptions: string
    referrerPolicy: string
    permissionsPolicy: string
  }
  rateLimit: {
    windowMs: number
    max: number
    skipSuccessfulRequests: boolean
  }
  requestSize: {
    maxSize: number
  }
  timeout: {
    apiTimeout: number
  }
}

export const defaultSecurityConfig: SecurityConfig = {
  cors: {
    origin: env.NODE_ENV === 'production' 
      ? env.ALLOWED_ORIGINS
      : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'X-API-Version',
      'X-Client-Version'
    ],
    credentials: true
  },
  headers: {
    csp: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self' https://www.payfast.co.za https://sandbox.payfast.co.za;",
    hsts: 'max-age=31536000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=()'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    skipSuccessfulRequests: false
  },
  requestSize: {
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  timeout: {
    apiTimeout: 30000 // 30 seconds
  }
}

export class SecurityMiddleware {
  private static requestCounts = new Map<string, { count: number; resetTime: number }>()

  /**
   * Apply CORS headers
   */
  static applyCORS(response: NextResponse, config: SecurityConfig = defaultSecurityConfig): NextResponse {
    const origin = response.headers.get('origin') || ''
    
    if (config.cors.origin.includes('*') || config.cors.origin.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    response.headers.set('Access-Control-Allow-Methods', config.cors.methods.join(', '))
    response.headers.set('Access-Control-Allow-Headers', config.cors.allowedHeaders.join(', '))
    response.headers.set('Access-Control-Allow-Credentials', config.cors.credentials.toString())
    response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
    
    return response
  }

  /**
   * Apply security headers
   */
  static applySecurityHeaders(response: NextResponse, config: SecurityConfig = defaultSecurityConfig): NextResponse {
    const headers = config.headers

    // CSP: allow report-only toggle and optional report-uri
    const reportOnly = process.env.CSP_REPORT_ONLY === 'true'
    const reportUri = process.env.CSP_REPORT_URI
    const cspValue = reportUri && !headers.csp.includes('report-uri')
      ? `${headers.csp} report-uri ${reportUri};`
      : headers.csp

    if (reportOnly) {
      response.headers.set('Content-Security-Policy-Report-Only', cspValue)
    } else {
      response.headers.set('Content-Security-Policy', cspValue)
    }

    // HSTS: enable only on HTTPS in production
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const enableHsts = env.NODE_ENV === 'production' && appUrl.startsWith('https://')
    if (enableHsts) {
      response.headers.set('Strict-Transport-Security', headers.hsts)
    }
    response.headers.set('X-Frame-Options', headers.xFrameOptions)
    response.headers.set('X-Content-Type-Options', headers.xContentTypeOptions)
    response.headers.set('Referrer-Policy', headers.referrerPolicy)
    response.headers.set('Permissions-Policy', headers.permissionsPolicy)
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('X-DNS-Prefetch-Control', 'off')
    response.headers.set('X-Download-Options', 'noopen')
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
    
    return response
  }

  /**
   * Check rate limiting
   */
  static checkRateLimit(
    request: NextRequest, 
    config: SecurityConfig = defaultSecurityConfig
  ): NextResponse | null {
    const clientId = this.getClientId(request)
    const now = Date.now()
    const windowMs = config.rateLimit.windowMs
    const max = config.rateLimit.max

    const clientData = this.requestCounts.get(clientId)
    
    if (!clientData || now > clientData.resetTime) {
      // Reset or initialize
      this.requestCounts.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      })
      return null
    }

    if (clientData.count >= max) {
      Sentry.captureMessage('API rate limit exceeded', {
        level: 'warning',
        tags: { component: 'security_middleware' },
        extra: {
          clientId,
          route: request.nextUrl.pathname,
          method: request.method,
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        }
      })
      return NextResponse.json(
        { 
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
          timestamp: new Date().toISOString()
        },
        { status: 429 }
      )
    }

    // Increment count
    clientData.count++
    return null
  }

  /**
   * Check request size
   */
  static checkRequestSize(
    request: NextRequest,
    config: SecurityConfig = defaultSecurityConfig
  ): NextResponse | null {
    const contentLength = request.headers.get('content-length')
    
    if (contentLength && parseInt(contentLength) > config.requestSize.maxSize) {
      Sentry.captureMessage('Request too large', {
        level: 'warning',
        tags: { component: 'security_middleware' },
        extra: {
          route: request.nextUrl.pathname,
          method: request.method,
          contentLength: Number(contentLength),
          maxSize: config.requestSize.maxSize
        }
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Request too large',
          message: `Request size exceeds maximum allowed size of ${config.requestSize.maxSize} bytes`,
          code: 'REQUEST_TOO_LARGE',
          maxSize: config.requestSize.maxSize,
          timestamp: new Date().toISOString()
        },
        { status: 413 }
      )
    }

    return null
  }

  /**
   * Apply timeout to request
   */
  static withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = defaultSecurityConfig.timeout.apiTimeout
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      )
    ])
  }

  /**
   * Get client identifier for rate limiting
   */
  private static getClientId(request: NextRequest): string {
    // Try to get real IP from various headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfConnectingIp = request.headers.get('cf-connecting-ip')
    
    const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Create a hash-like identifier
    return Buffer.from(`${ip}-${userAgent}`).toString('base64').slice(0, 16)
  }

  /**
   * Clean up old rate limit entries
   */
  static cleanupRateLimit(): void {
    const now = Date.now()
    const entries = Array.from(this.requestCounts.entries())
    for (const [key, data] of entries) {
      if (now > data.resetTime) {
        this.requestCounts.delete(key)
      }
    }
  }
}

// Clean up rate limit data every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    SecurityMiddleware.cleanupRateLimit()
  }, 5 * 60 * 1000)
}
