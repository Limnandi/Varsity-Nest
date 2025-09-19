"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { ErrorLoggingService, ErrorSeverity, ErrorCategory } from '@/lib/services/error-logging'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  component?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string | null
  retryCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { component = 'unknown', onError } = this.props

    // Log the error
    const errorId = await ErrorLoggingService.logError(
      error,
      {
        component,
        metadata: {
          componentStack: errorInfo.componentStack,
          retryCount: this.state.retryCount
        }
      },
      ErrorSeverity.HIGH,
      ErrorCategory.UNKNOWN
    )

    this.setState({ errorId })

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const { fallback, showDetails = false } = this.props
      const { error, errorId, retryCount } = this.state

      if (fallback) {
        return fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              Oops! Something went wrong
            </h1>
            
            <p className="text-neutral-300 mb-6">
              We encountered an unexpected error. Don&apos;t worry, our team has been notified.
            </p>

            {errorId && (
              <p className="text-sm text-neutral-500 mb-6">
                Error ID: {errorId}
              </p>
            )}

            {showDetails && error && (
              <details className="text-left mb-6 p-4 bg-black/20 rounded-lg">
                <summary className="cursor-pointer text-sm text-neutral-400 mb-2">
                  Technical Details
                </summary>
                <pre className="text-xs text-red-300 whitespace-pre-wrap">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            )}

            <div className="space-y-3">
              {retryCount < this.maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again ({this.maxRetries - retryCount} attempts left)
                </button>
              )}

              <button
                onClick={this.handleReload}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-neutral-500">
                If this problem persists, please contact support with the Error ID above.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for functional components
export function useErrorHandler() {
  const handleError = async (error: Error, context?: Record<string, any>) => {
    await ErrorLoggingService.logError(
      error,
      {
        component: 'functional_component',
        metadata: context
      },
      ErrorSeverity.MEDIUM,
      ErrorCategory.UNKNOWN
    )
  }

  return { handleError }
}
