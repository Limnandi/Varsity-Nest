import { NextResponse, type NextRequest } from 'next/server';
import { SecurityUtils } from '../security/security-utils';
import { redis } from '@/lib/redis';
import { log } from '@/lib/logging/logger';
import { AuthenticationError } from '@/lib/errors/CustomErrors';
import * as jose from 'jose';

export async function authMiddleware(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<Response>
) {
  try {
    // Skip auth for public routes
    if (isPublicRoute(request.nextUrl.pathname)) {
      return handler(request);
    }

    // Validate authentication
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    // Verify JWT
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);
      
      // Check if token is blacklisted (logged out)
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new AuthenticationError('Token has been invalidated');
      }

      // Check user session
      const sessionValid = await redis.get(`session:${payload.sub}`);
      if (!sessionValid) {
        throw new AuthenticationError('Session has expired');
      }

      // Validate CSRF token for mutations
      if (isMutationMethod(request.method)) {
        const csrfValid = await SecurityUtils.validateCsrfToken(request);
        if (!csrfValid) {
          throw new AuthenticationError('Invalid CSRF token');
        }
      }

      // Add user info to request
      const requestWithUser = addUserToRequest(request, payload);
      
      // Execute handler
      return handler(requestWithUser);

    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        throw new AuthenticationError('Token has expired');
      }
      throw new AuthenticationError('Invalid authentication token');
    }

  } catch (error) {
    log.warn('Authentication failed', {
      path: request.nextUrl.pathname,
      method: request.method,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    if (error instanceof AuthenticationError) {
      return NextResponse.json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode
        }
      }, { status: error.statusCode });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication failed',
        statusCode: 401
      }
    }, { status: 401 });
  }
}

// Helper functions
function isPublicRoute(path: string): boolean {
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/health',
    '/api/public'
  ];
  return publicRoutes.some(route => path.startsWith(route));
}

function isMutationMethod(method: string): boolean {
  return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
}

function addUserToRequest(request: NextRequest, payload: jose.JWTPayload): NextRequest {
  // Create a new headers object with the user information
  const headers = new Headers(request.headers);
  headers.set('X-User-Id', payload.sub as string);
  headers.set('X-User-Role', payload.role as string);

  // Create a new request object with the modified headers
  return new Request(request.url, {
    method: request.method,
    headers: headers,
    body: request.body,
    cache: request.cache,
    credentials: request.credentials,
    integrity: request.integrity,
    keepalive: request.keepalive,
    mode: request.mode,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    signal: request.signal,
  }) as NextRequest;
}
