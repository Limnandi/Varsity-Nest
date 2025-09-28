import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { ValidationError } from '../errors/CustomErrors';
import { log } from '../logging/logger';
import { SecurityUtils } from '../security/security-utils';

type ValidationSchemas = {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
};

export function validateRequest(schemas: ValidationSchemas) {
  return async (
    request: NextRequest,
    handler: (request: NextRequest) => Promise<Response>
  ) => {
    try {
      const { body, query, params } = schemas;

      // Validate query parameters
      if (query) {
        const queryParams = Object.fromEntries(request.nextUrl.searchParams);
        try {
          query.parse(queryParams);
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new ValidationError('Invalid query parameters', error.errors);
          }
        }
      }

      // Validate body for POST/PUT/PATCH requests
      if (body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const requestBody = await request.json();
          
          // Sanitize string inputs
          const sanitizedBody = sanitizeObjectStrings(requestBody);
          
          body.parse(sanitizedBody);

          // Create a new request with the sanitized body
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(sanitizedBody),
          });

          return handler(newRequest as NextRequest);
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new ValidationError('Invalid request body', error.errors);
          }
          throw error;
        }
      }

      // Validate URL parameters
      if (params) {
        const urlParams = extractUrlParams(request.nextUrl.pathname);
        try {
          params.parse(urlParams);
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new ValidationError('Invalid URL parameters', error.errors);
          }
        }
      }

      return handler(request);

    } catch (error) {
      log.warn('Request validation failed', {
        path: request.nextUrl.pathname,
        method: request.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof ValidationError) {
        return NextResponse.json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            statusCode: error.statusCode
          }
        }, { status: error.statusCode });
      }

      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          statusCode: 400
        }
      }, { status: 400 });
    }
  };
}

// Helper functions
function sanitizeObjectStrings(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectStrings);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = SecurityUtils.sanitizeInput(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObjectStrings(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function extractUrlParams(pathname: string): Record<string, string> {
  const params: Record<string, string> = {};
  const pathParts = pathname.split('/');
  
  pathParts.forEach((part, index) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const paramName = part.slice(1, -1);
      params[paramName] = pathParts[index];
    }
  });

  return params;
}
