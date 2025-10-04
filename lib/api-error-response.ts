import { NextResponse } from 'next/server'
import { ErrorLoggingService, ErrorCategory } from './services/error-logging'

export interface ApiErrorResponse {
  success: false
  error: string
  errorId: string
  message: string
  code: string
  details?: any
  timestamp: string
}

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
  timestamp: string
}

export class ApiError extends Error {
  public statusCode: number
  public code: string
  public details?: any
  public errorId?: string

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export class ApiErrorResponseBuilder {
  /**
   * Create a standardized error response
   */
  static async createErrorResponse(
    error: Error | ApiError | string,
    request: Request,
    context: Record<string, any> = {}
  ): Promise<NextResponse<ApiErrorResponse>> {
    let apiError: ApiError
    let statusCode = 500
    let code = 'INTERNAL_ERROR'

    if (error instanceof ApiError) {
      apiError = error
      statusCode = error.statusCode
      code = error.code
    } else if (error instanceof Error) {
      apiError = new ApiError(error.message, 500, 'INTERNAL_ERROR')
    } else {
      apiError = new ApiError(String(error), 500, 'INTERNAL_ERROR')
    }

    // Log the error
    const errorId = await ErrorLoggingService.logApiError(
      apiError,
      request,
      context
    )

    // Create user-friendly message
    const userMessage = ErrorLoggingService.createUserFriendlyMessage(
      apiError,
      this.mapStatusCodeToCategory(statusCode),
      {
        url: request.url,
        method: request.method,
        ...context
      }
    )

    const response: ApiErrorResponse = {
      success: false,
      error: apiError.message,
      errorId,
      message: userMessage,
      code,
      details: apiError.details,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response, { status: statusCode })
  }

  /**
   * Create a standardized success response
   */
  static createSuccessResponse<T>(
    data: T,
    message?: string
  ): NextResponse<ApiSuccessResponse<T>> {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)
  }

  /**
   * Create validation error response
   */
  static async createValidationErrorResponse(
    validationErrors: any,
    request: Request,
    context: Record<string, any> = {}
  ): Promise<NextResponse<ApiErrorResponse>> {
    const error = new ApiError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      validationErrors
    )

    return this.createErrorResponse(error, request, context)
  }

  /**
   * Create authentication error response
   */
  static async createAuthErrorResponse(
    message: string = 'Authentication required',
    request: Request,
    context: Record<string, any> = {}
  ): Promise<NextResponse<ApiErrorResponse>> {
    const error = new ApiError(message, 401, 'AUTHENTICATION_REQUIRED')

    return this.createErrorResponse(error, request, context)
  }

  /**
   * Create authorization error response
   */
  static async createAuthorizationErrorResponse(
    message: string = 'Insufficient permissions',
    request: Request,
    context: Record<string, any> = {}
  ): Promise<NextResponse<ApiErrorResponse>> {
    const error = new ApiError(message, 403, 'AUTHORIZATION_DENIED')

    return this.createErrorResponse(error, request, context)
  }

  /**
   * Create not found error response
   */
  static async createNotFoundErrorResponse(
    resource: string = 'Resource',
    request: Request,
    context: Record<string, any> = {}
  ): Promise<NextResponse<ApiErrorResponse>> {
    const error = new ApiError(
      `${resource} not found`,
      404,
      'RESOURCE_NOT_FOUND'
    )

    return this.createErrorResponse(error, request, context)
  }

  /**
   * Create rate limit error response
   */
  static async createRateLimitErrorResponse(
    request: Request,
    context: Record<string, any> = {}
  ): Promise<NextResponse<ApiErrorResponse>> {
    const error = new ApiError(
      'Too many requests',
      429,
      'RATE_LIMIT_EXCEEDED'
    )

    return this.createErrorResponse(error, request, context)
  }

  /**
   * Create database error response
   */
  static async createDatabaseErrorResponse(
    error: Error,
    request: Request,
    context: Record<string, any> = {}
  ): Promise<NextResponse<ApiErrorResponse>> {
    const apiError = new ApiError(
      'Database operation failed',
      500,
      'DATABASE_ERROR',
      { originalError: error.message }
    )

    return this.createErrorResponse(apiError, request, context)
  }

  /**
   * Create external service error response
   */
  static async createExternalServiceErrorResponse(
    service: string,
    error: Error,
    request: Request,
    context: Record<string, any> = {}
  ): Promise<NextResponse<ApiErrorResponse>> {
    const apiError = new ApiError(
      `${service} service is temporarily unavailable`,
      503,
      'EXTERNAL_SERVICE_ERROR',
      { service, originalError: error.message }
    )

    return this.createErrorResponse(apiError, request, context)
  }

  /**
   * Map status code to error category
   */
  private static mapStatusCodeToCategory(statusCode: number): ErrorCategory {
    if (statusCode >= 400 && statusCode < 500) {
      if (statusCode === 401 || statusCode === 403) {
        return ErrorCategory.AUTHENTICATION
      }
      if (statusCode === 422) {
        return ErrorCategory.VALIDATION
      }
      return ErrorCategory.API
    }
    
    if (statusCode >= 500) {
      return ErrorCategory.DATABASE
    }
    
    return ErrorCategory.UNKNOWN
  }
}

// Predefined error codes
export const ErrorCodes = {
  // Authentication & Authorization
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  AUTHORIZATION_DENIED: 'AUTHORIZATION_DENIED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_NOT_VERIFIED: 'ACCOUNT_NOT_VERIFIED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',

  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_SERVICE_ERROR: 'PAYMENT_SERVICE_ERROR',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
  FILE_SERVICE_ERROR: 'FILE_SERVICE_ERROR',

  // File Upload
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  FILE_PROCESSING_ERROR: 'FILE_PROCESSING_ERROR',

  // Payment
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_DECLINED: 'PAYMENT_DECLINED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  PAYMENT_PROCESSING_ERROR: 'PAYMENT_PROCESSING_ERROR',

  // Security
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  CSRF_TOKEN_INVALID: 'CSRF_TOKEN_INVALID',

  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const
