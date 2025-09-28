import { NextRequest } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { redis } from '@/lib/redis';

export class SecurityUtils {
  private static readonly CSRF_TOKEN_LENGTH = 32;
  private static readonly CSRF_HEADER = 'X-CSRF-Token';
  private static readonly CSRF_COOKIE = 'csrf-token';
  private static readonly TOKEN_EXPIRY = 3600; // 1 hour

  // Generate CSRF token
  static async generateCsrfToken(sessionId: string): Promise<string> {
    const token = randomBytes(this.CSRF_TOKEN_LENGTH).toString('hex');
    const hash = this.hashToken(token);
    
    // Store in Redis with expiry (upstash signature)
    await redis.set(`csrf:${sessionId}`, hash, { ex: this.TOKEN_EXPIRY });
    
    return token;
  }

  // Validate CSRF token
  static async validateCsrfToken(request: NextRequest): Promise<boolean> {
    const token = request.headers.get(this.CSRF_HEADER);
    const sessionId = request.cookies.get('session-id')?.value;

    if (!token || !sessionId) {
      return false;
    }

    const storedHash = await redis.get(`csrf:${sessionId}`);
    if (!storedHash) {
      return false;
    }

    const hash = this.hashToken(token);
    return hash === storedHash;
  }

  // Hash token for storage
  private static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Sanitize input strings
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove onclick= and similar
      .trim();
  }

  // Validate email
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Rate limiting key generator
  static getRateLimitKey(request: NextRequest): string {
    // NextRequest doesn't expose ip; try headers then fallback to unknown
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const path = request.nextUrl.pathname;
    return `ratelimit:${ip}:${path}`;
  }

  // Content Security Policy generator
  static getCSP(): string {
    const policies = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/'],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'", process.env.NEXT_PUBLIC_API_URL || ''],
      'frame-src': ["'self'", 'https://www.google.com/recaptcha/'],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
    };

    return Object.entries(policies)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');
  }

  // XSS prevention headers
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': this.getCSP(),
      ...(process.env.NODE_ENV === 'production' && {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
      })
    };
  }
}
