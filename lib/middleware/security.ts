import { NextResponse, type NextRequest } from 'next/server';
import { redis } from '@/lib/redis';
import { log } from '@/lib/logging/logger';
import { SecurityUtils } from '../security/security-utils';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

export async function securityMiddleware(request: NextRequest) {
  const rateLimitKey = SecurityUtils.getRateLimitKey(request);
  const path = request.nextUrl.pathname;

  try {
    // Rate limiting
    const requests = await redis.incr(rateLimitKey);
    
    if (requests === 1) {
      await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW / 1000);
    }

    if (requests > MAX_REQUESTS) {
      log.warn('Rate limit exceeded', { path, requests });
      return new NextResponse('Too Many Requests', { status: 429 });
    }

    // Security headers
    const response = NextResponse.next();
    const responseHeaders = response.headers;

    // CORS headers
    responseHeaders.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Apply security headers
    const securityHeaders = SecurityUtils.getSecurityHeaders();
    Object.entries(securityHeaders).forEach(([header, value]) => {
      responseHeaders.set(header, value);
    });

    return response;
  } catch (error) {
    log.error('Security middleware error', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
