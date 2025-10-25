"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityUtils = void 0;
var crypto_1 = require("crypto");
var redis_1 = require("@/lib/redis");
var SecurityUtils = /** @class */ (function () {
    function SecurityUtils() {
    }
    // Generate CSRF token
    SecurityUtils.generateCsrfToken = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var token, hash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = (0, crypto_1.randomBytes)(this.CSRF_TOKEN_LENGTH).toString('hex');
                        hash = this.hashToken(token);
                        // Store in Redis with expiry (upstash signature)
                        return [4 /*yield*/, redis_1.redis.set("csrf:".concat(sessionId), hash, { ex: this.TOKEN_EXPIRY })];
                    case 1:
                        // Store in Redis with expiry (upstash signature)
                        _a.sent();
                        return [2 /*return*/, token];
                }
            });
        });
    };
    // Validate CSRF token
    SecurityUtils.validateCsrfToken = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var token, sessionId, storedHash, hash;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        token = request.headers.get(this.CSRF_HEADER);
                        sessionId = (_a = request.cookies.get('session-id')) === null || _a === void 0 ? void 0 : _a.value;
                        if (!token || !sessionId) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, redis_1.redis.get("csrf:".concat(sessionId))];
                    case 1:
                        storedHash = _b.sent();
                        if (!storedHash) {
                            return [2 /*return*/, false];
                        }
                        hash = this.hashToken(token);
                        return [2 /*return*/, hash === storedHash];
                }
            });
        });
    };
    // Hash token for storage
    SecurityUtils.hashToken = function (token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    };
    // Sanitize input strings
    SecurityUtils.sanitizeInput = function (input) {
        return input
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove onclick= and similar
            .trim();
    };
    // Validate email
    SecurityUtils.isValidEmail = function (email) {
        var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };
    // Validate password strength
    SecurityUtils.validatePassword = function (password) {
        var errors = [];
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
            errors: errors
        };
    };
    // Rate limiting key generator
    SecurityUtils.getRateLimitKey = function (request) {
        // NextRequest doesn't expose ip; try headers then fallback to unknown
        var ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        var path = request.nextUrl.pathname;
        return "ratelimit:".concat(ip, ":").concat(path);
    };
    // Content Security Policy generator
    SecurityUtils.getCSP = function () {
        var policies = {
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
            .map(function (_a) {
            var key = _a[0], values = _a[1];
            return "".concat(key, " ").concat(values.join(' '));
        })
            .join('; ');
    };
    // XSS prevention headers
    SecurityUtils.getSecurityHeaders = function () {
        return __assign({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'X-XSS-Protection': '1; mode=block', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', 'Content-Security-Policy': this.getCSP() }, (process.env.NODE_ENV === 'production' && {
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
        }));
    };
    SecurityUtils.CSRF_TOKEN_LENGTH = 32;
    SecurityUtils.CSRF_HEADER = 'X-CSRF-Token';
    SecurityUtils.TOKEN_EXPIRY = 3600; // 1 hour
    return SecurityUtils;
}());
exports.SecurityUtils = SecurityUtils;
