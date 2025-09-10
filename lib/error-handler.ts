import { ErrorLoggingService, ErrorSeverity, ErrorCategory } from './services/error-logging'

export class GlobalErrorHandler {
  private static isInitialized = false

  /**
   * Initialize global error handling
   */
  static initialize() {
    if (this.isInitialized) return

    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
      window.addEventListener('error', this.handleGlobalError)
    }

    // Handle Node.js unhandled rejections
    if (typeof process !== 'undefined') {
      process.on('unhandledRejection', this.handleNodeUnhandledRejection)
      process.on('uncaughtException', this.handleUncaughtException)
    }

    this.isInitialized = true
  }

  /**
   * Handle unhandled promise rejections in browser
   */
  private static handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault()
    
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    
    ErrorLoggingService.logError(
      error,
      {
        component: 'unhandled_promise_rejection',
        metadata: {
          type: 'unhandled_promise_rejection',
          reason: event.reason
        }
      },
      ErrorSeverity.HIGH,
      ErrorCategory.UNKNOWN
    )

    // Show user-friendly error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Unhandled Promise Rejection:', event.reason)
    }
  }

  /**
   * Handle global errors in browser
   */
  private static handleGlobalError = (event: ErrorEvent) => {
    const error = new Error(event.message)
    error.stack = event.error?.stack

    ErrorLoggingService.logError(
      error,
      {
        component: 'global_error',
        metadata: {
          type: 'global_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      },
      ErrorSeverity.HIGH,
      ErrorCategory.UNKNOWN
    )

    // Show user-friendly error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global Error:', event.error)
    }
  }

  /**
   * Handle unhandled promise rejections in Node.js
   */
  private static handleNodeUnhandledRejection = (reason: any, promise: Promise<any>) => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    
    ErrorLoggingService.logError(
      error,
      {
        component: 'node_unhandled_rejection',
        metadata: {
          type: 'node_unhandled_rejection',
          promise: promise.toString()
        }
      },
      ErrorSeverity.CRITICAL,
      ErrorCategory.UNKNOWN
    )

    console.error('Unhandled Promise Rejection:', reason)
  }

  /**
   * Handle uncaught exceptions in Node.js
   */
  private static handleUncaughtException = (error: Error) => {
    ErrorLoggingService.logError(
      error,
      {
        component: 'node_uncaught_exception',
        metadata: {
          type: 'node_uncaught_exception'
        }
      },
      ErrorSeverity.CRITICAL,
      ErrorCategory.UNKNOWN
    )

    console.error('Uncaught Exception:', error)
    
    // Exit process after logging
    process.exit(1)
  }

  /**
   * Create a safe async wrapper for functions
   */
  static async safeAsync<T>(
    fn: () => Promise<T>,
    context: Record<string, any> = {},
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await fn()
    } catch (error) {
      await ErrorLoggingService.logError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'safe_async_wrapper',
          metadata: context
        },
        ErrorSeverity.MEDIUM,
        ErrorCategory.UNKNOWN
      )

      return fallback
    }
  }

  /**
   * Create a safe sync wrapper for functions
   */
  static safeSync<T>(
    fn: () => T,
    context: Record<string, any> = {},
    fallback?: T
  ): T | undefined {
    try {
      return fn()
    } catch (error) {
      // Log error asynchronously without blocking
      ErrorLoggingService.logError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'safe_sync_wrapper',
          metadata: context
        },
        ErrorSeverity.MEDIUM,
        ErrorCategory.UNKNOWN
      ).catch(() => {
        // Fallback logging if async logging fails
        console.error('Error in safe sync wrapper:', error)
      })

      return fallback
    }
  }

  /**
   * Wrap API route handlers with error handling
   */
  static withApiErrorHandling<T extends any[], R>(
    handler: (...args: T) => Promise<R>
  ) {
    return async (...args: T): Promise<R> => {
      try {
        return await handler(...args)
      } catch (error) {
        const request = args[0] as Request
        
        await ErrorLoggingService.logApiError(
          error instanceof Error ? error : new Error(String(error)),
          request
        )

        // Re-throw to let Next.js handle the response
        throw error
      }
    }
  }

  /**
   * Create a retry wrapper with exponential backoff
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    context: Record<string, any> = {}
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt === maxRetries) {
          await ErrorLoggingService.logError(
            lastError,
            {
              component: 'retry_wrapper',
              metadata: {
                ...context,
                maxRetries,
                finalAttempt: true
              }
            },
            ErrorSeverity.HIGH,
            ErrorCategory.UNKNOWN
          )
          throw lastError
        }

        // Log retry attempt
        await ErrorLoggingService.logError(
          lastError,
          {
            component: 'retry_wrapper',
            metadata: {
              ...context,
              attempt,
              maxRetries,
              willRetry: true
            }
          },
          ErrorSeverity.LOW,
          ErrorCategory.UNKNOWN
        )

        // Wait before retry with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  /**
   * Cleanup error handlers
   */
  static cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
      window.removeEventListener('error', this.handleGlobalError)
    }

    if (typeof process !== 'undefined') {
      process.removeListener('unhandledRejection', this.handleNodeUnhandledRejection)
      process.removeListener('uncaughtException', this.handleUncaughtException)
    }

    this.isInitialized = false
  }
}

// Note: GlobalErrorHandler is initialized in app/layout.tsx to avoid duplicate initialization
