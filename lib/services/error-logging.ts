import { Sentry } from "@/lib/sentry"

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  DATABASE = 'database',
  PAYMENT = 'payment',
  FILE_UPLOAD = 'file_upload',
  API = 'api',
  VALIDATION = 'validation',
  NETWORK = 'network',
  SECURITY = 'security',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  userId?: string
  sessionId?: string
  requestId?: string
  userAgent?: string
  ipAddress?: string
  url?: string
  method?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
}

export interface StructuredError {
  id: string
  message: string
  stack?: string
  severity: ErrorSeverity
  category: ErrorCategory
  context: ErrorContext
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
  tags: string[]
}

export class ErrorLoggingService {
  private static errorCounts = new Map<string, number>()
  private static errorThresholds = new Map<ErrorSeverity, number>([
    [ErrorSeverity.LOW, 100],
    [ErrorSeverity.MEDIUM, 50],
    [ErrorSeverity.HIGH, 10],
    [ErrorSeverity.CRITICAL, 1]
  ])

  /**
   * Log an error with comprehensive context and monitoring
   */
  static async logError(
    error: Error | string,
    context: ErrorContext = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN
  ): Promise<string> {
    try {
      const errorId = this.generateErrorId()
      const errorMessage = typeof error === 'string' ? error : error.message
      const stack = typeof error === 'string' ? undefined : error.stack

      const structuredError: StructuredError = {
        id: errorId,
        message: errorMessage,
        stack,
        severity,
        category,
        context: {
          ...context,
          component: context.component || 'unknown'
        },
        timestamp: new Date(),
        resolved: false,
        tags: this.generateTags(severity, category, context)
      }

      // Log to Sentry with enhanced context
      Sentry.captureException(error, {
        tags: {
          errorId,
          severity,
          category,
          component: context.component || 'unknown',
          ...structuredError.tags.reduce((acc, tag) => ({ ...acc, [tag]: true }), {})
        },
        extra: {
          ...context,
          errorId,
          severity,
          category,
          timestamp: structuredError.timestamp.toISOString()
        },
        level: this.mapSeverityToSentryLevel(severity)
      })

      // Track error frequency for alerting
      this.trackErrorFrequency(errorMessage, severity)

      // Log to console in development
      if ((await import('@/lib/env')).env.NODE_ENV === 'development') {
        console.error(`🚨 [${severity.toUpperCase()}] ${category}:`, {
          errorId,
          message: errorMessage,
          context,
          stack
        })
      }

      return errorId
    } catch (loggingError) {
      // Fallback logging if our logging system fails
      console.error('Failed to log error:', loggingError)
      console.error('Original error:', error)
      return 'logging-failed'
    }
  }

  /**
   * Log API errors with request context
   */
  static async logApiError(
    error: Error | string,
    request: Request,
    context: Partial<ErrorContext> = {}
  ): Promise<string> {
    const url = new URL(request.url)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    return this.logError(error, {
      ...context,
      url: url.pathname,
      method: request.method,
      userAgent,
      ipAddress,
      component: 'api'
    }, ErrorSeverity.MEDIUM, ErrorCategory.API)
  }

  /**
   * Log database errors with query context
   */
  static async logDatabaseError(
    error: Error | string,
    query: string,
    params: any[] = [],
    context: Partial<ErrorContext> = {}
  ): Promise<string> {
    return this.logError(error, {
      ...context,
      component: 'database',
      metadata: {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        paramCount: params.length,
        params: params.slice(0, 5) // Only log first 5 params for security
      }
    }, ErrorSeverity.HIGH, ErrorCategory.DATABASE)
  }

  /**
   * Log authentication errors with user context
   */
  static async logAuthError(
    error: Error | string,
    userId?: string,
    action?: string,
    context: Partial<ErrorContext> = {}
  ): Promise<string> {
    return this.logError(error, {
      ...context,
      userId,
      action,
      component: 'authentication'
    }, ErrorSeverity.MEDIUM, ErrorCategory.AUTHENTICATION)
  }

  /**
   * Log payment errors with transaction context
   */
  static async logPaymentError(
    error: Error | string,
    transactionId?: string,
    amount?: number,
    context: Partial<ErrorContext> = {}
  ): Promise<string> {
    return this.logError(error, {
      ...context,
      component: 'payment',
      metadata: {
        transactionId,
        amount
      }
    }, ErrorSeverity.HIGH, ErrorCategory.PAYMENT)
  }

  /**
   * Log file upload errors with file context
   */
  static async logFileUploadError(
    error: Error | string,
    fileName?: string,
    fileSize?: number,
    context: Partial<ErrorContext> = {}
  ): Promise<string> {
    return this.logError(error, {
      ...context,
      component: 'file_upload',
      metadata: {
        fileName,
        fileSize
      }
    }, ErrorSeverity.MEDIUM, ErrorCategory.FILE_UPLOAD)
  }

  /**
   * Log security violations with threat context
   */
  static async logSecurityViolation(
    error: Error | string,
    threatType: string,
    context: Partial<ErrorContext> = {}
  ): Promise<string> {
    return this.logError(error, {
      ...context,
      component: 'security',
      metadata: {
        threatType
      }
    }, ErrorSeverity.HIGH, ErrorCategory.SECURITY)
  }

  /**
   * Create a user-friendly error message
   */
  static createUserFriendlyMessage(
    error: Error | string,
    category: ErrorCategory,
    context: ErrorContext = {}
  ): string {
    const errorMessage = typeof error === 'string' ? error : error.message

    // Don't expose internal errors to users
    if (errorMessage.includes('ECONNREFUSED') || 
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('database') ||
        errorMessage.includes('connection')) {
      return 'A temporary service issue occurred. Please try again in a few moments.'
    }

    // Map common errors to user-friendly messages
    const userFriendlyMessages: Record<string, string> = {
      'Invalid email or password': 'The email or password you entered is incorrect.',
      'User not found': 'No account found with this email address.',
      'Email already exists': 'An account with this email already exists.',
      'Invalid token': 'Your session has expired. Please log in again.',
      'File too large': 'The file you uploaded is too large. Please choose a smaller file.',
      'Invalid file type': 'The file type is not supported. Please choose a different file.',
      'Payment failed': 'Your payment could not be processed. Please try again or use a different payment method.',
      'Network error': 'Please check your internet connection and try again.',
      'Server error': 'Something went wrong on our end. Please try again later.'
    }

    // Check for exact matches first
    if (userFriendlyMessages[errorMessage]) {
      return userFriendlyMessages[errorMessage]
    }

    // Check for partial matches
    for (const [key, message] of Object.entries(userFriendlyMessages)) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return message
      }
    }

    // Default messages based on category
    const categoryMessages: Record<ErrorCategory, string> = {
      [ErrorCategory.AUTHENTICATION]: 'There was an issue with your login. Please try again.',
      [ErrorCategory.DATABASE]: 'A temporary service issue occurred. Please try again.',
      [ErrorCategory.PAYMENT]: 'There was an issue processing your payment. Please try again.',
      [ErrorCategory.FILE_UPLOAD]: 'There was an issue uploading your file. Please try again.',
      [ErrorCategory.API]: 'A temporary service issue occurred. Please try again.',
      [ErrorCategory.VALIDATION]: 'Please check your input and try again.',
      [ErrorCategory.NETWORK]: 'Please check your internet connection and try again.',
      [ErrorCategory.SECURITY]: 'A security issue was detected. Please try again.',
      [ErrorCategory.BUSINESS_LOGIC]: 'There was an issue processing your request. Please try again.',
      [ErrorCategory.EXTERNAL_SERVICE]: 'A third-party service is temporarily unavailable. Please try again.',
      [ErrorCategory.UNKNOWN]: 'An unexpected error occurred. Please try again.'
    }

    return categoryMessages[category] || 'An unexpected error occurred. Please try again.'
  }

  /**
   * Track error frequency for alerting
   */
  private static trackErrorFrequency(errorMessage: string, severity: ErrorSeverity): void {
    const key = `${errorMessage}:${severity}`
    const count = this.errorCounts.get(key) || 0
    this.errorCounts.set(key, count + 1)

    // Check if we've exceeded the threshold
    const threshold = this.errorThresholds.get(severity) || 10
    if (count + 1 >= threshold) {
      Sentry.captureMessage(`Error frequency threshold exceeded: ${errorMessage}`, {
        level: 'warning',
        tags: {
          errorMessage,
          severity,
          frequency: count + 1,
          threshold
        }
      })
    }
  }

  /**
   * Generate error ID
   */
  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }

  /**
   * Generate tags for error categorization
   */
  private static generateTags(
    severity: ErrorSeverity,
    category: ErrorCategory,
    context: ErrorContext
  ): string[] {
    const tags: string[] = [severity, category]
    
    if (context.component) tags.push(context.component)
    if (context.userId) tags.push('user-specific')
    if (context.ipAddress) tags.push('ip-tracked')
    if (context.method) tags.push(`method-${context.method.toLowerCase()}`)
    
    return tags
  }

  /**
   * Map severity to Sentry level
   */
  private static mapSeverityToSentryLevel(severity: ErrorSeverity): 'debug' | 'info' | 'warning' | 'error' | 'fatal' {
    switch (severity) {
      case ErrorSeverity.LOW: return 'info'
      case ErrorSeverity.MEDIUM: return 'warning'
      case ErrorSeverity.HIGH: return 'error'
      case ErrorSeverity.CRITICAL: return 'fatal'
      default: return 'error'
    }
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    totalErrors: number
    errorsBySeverity: Record<ErrorSeverity, number>
    errorsByCategory: Record<ErrorCategory, number>
    topErrors: Array<{ message: string; count: number; severity: ErrorSeverity }>
  } {
    const errorsBySeverity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0
    }

    const errorsByCategory: Record<ErrorCategory, number> = {
      [ErrorCategory.AUTHENTICATION]: 0,
      [ErrorCategory.DATABASE]: 0,
      [ErrorCategory.PAYMENT]: 0,
      [ErrorCategory.FILE_UPLOAD]: 0,
      [ErrorCategory.API]: 0,
      [ErrorCategory.VALIDATION]: 0,
      [ErrorCategory.NETWORK]: 0,
      [ErrorCategory.SECURITY]: 0,
      [ErrorCategory.BUSINESS_LOGIC]: 0,
      [ErrorCategory.EXTERNAL_SERVICE]: 0,
      [ErrorCategory.UNKNOWN]: 0
    }

    const topErrors: Array<{ message: string; count: number; severity: ErrorSeverity }> = []

    // This would be implemented with actual database queries in production
    // For now, return mock data
    return {
      totalErrors: 0,
      errorsBySeverity,
      errorsByCategory,
      topErrors
    }
  }
}
