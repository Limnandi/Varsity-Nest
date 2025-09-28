import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { setSentryContext, captureException } from '@/lib/logging/config';
import { performanceMonitor } from '../monitoring/performance';
import { BaseError } from '../errors/CustomErrors';
import { log } from '../logging/logger';

export async function apiMiddleware(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<Response>
) {
  const requestId = crypto.randomUUID();
  const startTime = globalThis.performance.now();

  try {
    // Set request context for logging/Sentry
    setSentryContext({ requestId, path: request.nextUrl.pathname, method: request.method });

    // Start performance metric for this request
    const endMetric = performanceMonitor.startMetric(`api_${request.method}_${request.nextUrl.pathname}`);

    // Execute the handler
    const response = await handler(request);

    // End performance metric
    endMetric();

    // Record response time
    const endTime = globalThis.performance.now();
    const duration = endTime - startTime;

    // Log successful request
    log.info('API request completed', {
      requestId,
      path: request.nextUrl.pathname,
      method: request.method,
      duration,
      status: response.status
    });

    return response;

  } catch (error) {
    const endTime = globalThis.performance.now();
    const duration = endTime - startTime;

    if (error instanceof BaseError) {
      // Handle known application errors
      log.warn('API request failed with known error', {
        requestId,
        path: request.nextUrl.pathname,
        method: request.method,
        duration,
        errorCode: error.code,
        errorMessage: error.message
      });

      return NextResponse.json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString()
        }
      }, { status: error.statusCode });
    }

    // Handle unknown errors
    log.error('API request failed with unknown error', error instanceof Error ? error : new Error('Unknown error'), {
      requestId,
      path: request.nextUrl.pathname,
      method: request.method,
      duration
    });

    // Capture in Sentry with additional context
    captureException(error instanceof Error ? error : new Error('Unknown error'), { requestId, path: request.nextUrl.pathname, method: request.method, duration });

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        statusCode: 500
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
