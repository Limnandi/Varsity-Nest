"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityMiddleware = exports.defaultSecurityConfig = void 0;
var server_1 = require("next/server");
var env_1 = require("@/lib/env");
var config_1 = require("@/lib/logging/config");
exports.defaultSecurityConfig = {
    cors: {
        origin: env_1.env.NODE_ENV === 'production'
            ? env_1.env.ALLOWED_ORIGINS
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
};
var SecurityMiddleware = /** @class */ (function () {
    function SecurityMiddleware() {
    }
    /**
     * Apply CORS headers
     */
    SecurityMiddleware.applyCORS = function (response, config) {
        if (config === void 0) { config = exports.defaultSecurityConfig; }
        var origin = response.headers.get('origin') || '';
        if (config.cors.origin.includes('*') || config.cors.origin.includes(origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin);
        }
        response.headers.set('Access-Control-Allow-Methods', config.cors.methods.join(', '));
        response.headers.set('Access-Control-Allow-Headers', config.cors.allowedHeaders.join(', '));
        response.headers.set('Access-Control-Allow-Credentials', config.cors.credentials.toString());
        response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
        return response;
    };
    /**
     * Apply security headers
     */
    SecurityMiddleware.applySecurityHeaders = function (response, config) {
        if (config === void 0) { config = exports.defaultSecurityConfig; }
        var headers = config.headers;
        // CSP: allow report-only toggle and optional report-uri
        var reportOnly = process.env.CSP_REPORT_ONLY === 'true';
        var reportUri = process.env.CSP_REPORT_URI;
        var cspValue = reportUri && !headers.csp.includes('report-uri')
            ? "".concat(headers.csp, " report-uri ").concat(reportUri, ";")
            : headers.csp;
        if (reportOnly) {
            response.headers.set('Content-Security-Policy-Report-Only', cspValue);
        }
        else {
            response.headers.set('Content-Security-Policy', cspValue);
        }
        // HSTS: enable only on HTTPS in production
        var appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
        var enableHsts = env_1.env.NODE_ENV === 'production' && appUrl.startsWith('https://');
        if (enableHsts) {
            response.headers.set('Strict-Transport-Security', headers.hsts);
        }
        response.headers.set('X-Frame-Options', headers.xFrameOptions);
        response.headers.set('X-Content-Type-Options', headers.xContentTypeOptions);
        response.headers.set('Referrer-Policy', headers.referrerPolicy);
        response.headers.set('Permissions-Policy', headers.permissionsPolicy);
        response.headers.set('X-XSS-Protection', '1; mode=block');
        response.headers.set('X-DNS-Prefetch-Control', 'off');
        response.headers.set('X-Download-Options', 'noopen');
        response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
        return response;
    };
    /**
     * Check rate limiting
     */
    SecurityMiddleware.checkRateLimit = function (request, config) {
        if (config === void 0) { config = exports.defaultSecurityConfig; }
        var clientId = this.getClientId(request);
        var now = Date.now();
        var windowMs = config.rateLimit.windowMs;
        var max = config.rateLimit.max;
        var clientData = this.requestCounts.get(clientId);
        if (!clientData || now > clientData.resetTime) {
            // Reset or initialize
            this.requestCounts.set(clientId, {
                count: 1,
                resetTime: now + windowMs
            });
            return null;
        }
        if (clientData.count >= max) {
            (0, config_1.captureMessage)('API rate limit exceeded', { level: 'warning', component: 'security_middleware', clientId: clientId, route: request.nextUrl.pathname, method: request.method, retryAfter: Math.ceil((clientData.resetTime - now) / 1000) });
            return server_1.NextResponse.json({
                success: false,
                error: 'Rate limit exceeded',
                message: 'Too many requests. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
                timestamp: new Date().toISOString()
            }, { status: 429 });
        }
        // Increment count
        clientData.count++;
        return null;
    };
    /**
     * Check request size
     */
    SecurityMiddleware.checkRequestSize = function (request, config) {
        if (config === void 0) { config = exports.defaultSecurityConfig; }
        var contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > config.requestSize.maxSize) {
            (0, config_1.captureMessage)('Request too large', { level: 'warning', component: 'security_middleware', route: request.nextUrl.pathname, method: request.method, contentLength: Number(contentLength), maxSize: config.requestSize.maxSize });
            return server_1.NextResponse.json({
                success: false,
                error: 'Request too large',
                message: "Request size exceeds maximum allowed size of ".concat(config.requestSize.maxSize, " bytes"),
                code: 'REQUEST_TOO_LARGE',
                maxSize: config.requestSize.maxSize,
                timestamp: new Date().toISOString()
            }, { status: 413 });
        }
        return null;
    };
    /**
     * Apply timeout to request
     */
    SecurityMiddleware.withTimeout = function (promise, timeoutMs) {
        if (timeoutMs === void 0) { timeoutMs = exports.defaultSecurityConfig.timeout.apiTimeout; }
        return Promise.race([
            promise,
            new Promise(function (_, reject) {
                return setTimeout(function () { return reject(new Error('Request timeout')); }, timeoutMs);
            })
        ]);
    };
    /**
     * Get client identifier for rate limiting
     */
    SecurityMiddleware.getClientId = function (request) {
        // Try to get real IP from various headers
        var forwarded = request.headers.get('x-forwarded-for');
        var realIp = request.headers.get('x-real-ip');
        var cfConnectingIp = request.headers.get('cf-connecting-ip');
        var ip = (forwarded === null || forwarded === void 0 ? void 0 : forwarded.split(',')[0]) || realIp || cfConnectingIp || 'unknown';
        var userAgent = request.headers.get('user-agent') || 'unknown';
        // Create a hash-like identifier
        return Buffer.from("".concat(ip, "-").concat(userAgent)).toString('base64').slice(0, 16);
    };
    /**
     * Clean up old rate limit entries
     */
    SecurityMiddleware.cleanupRateLimit = function () {
        var now = Date.now();
        var entries = Array.from(this.requestCounts.entries());
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var _a = entries_1[_i], key = _a[0], data = _a[1];
            if (now > data.resetTime) {
                this.requestCounts.delete(key);
            }
        }
    };
    SecurityMiddleware.requestCounts = new Map();
    return SecurityMiddleware;
}());
exports.SecurityMiddleware = SecurityMiddleware;
// Clean up rate limit data every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(function () {
        SecurityMiddleware.cleanupRateLimit();
    }, 5 * 60 * 1000);
}
