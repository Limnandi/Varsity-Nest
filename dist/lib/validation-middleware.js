"use strict";
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
exports.createValidationMiddleware = createValidationMiddleware;
exports.createRateLimitMiddleware = createRateLimitMiddleware;
exports.createPayloadSizeMiddleware = createPayloadSizeMiddleware;
exports.createXSSProtectionMiddleware = createXSSProtectionMiddleware;
exports.createSecurityMiddleware = createSecurityMiddleware;
exports.getValidatedData = getValidatedData;
var server_1 = require("next/server");
var validation_schemas_1 = require("./validation-schemas");
// Validation middleware factory
function createValidationMiddleware(schema) {
    var _this = this;
    return function (request) { return __awaiter(_this, void 0, void 0, function () {
        var data, searchParams, _i, _a, _b, key, value, contentType, formData, validation, sanitizedData, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 8, , 9]);
                    data = void 0;
                    if (!(request.method === 'GET')) return [3 /*break*/, 1];
                    searchParams = new URL(request.url).searchParams;
                    data = Object.fromEntries(searchParams.entries());
                    // Convert string values to appropriate types for validation
                    for (_i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
                        _b = _a[_i], key = _b[0], value = _b[1];
                        // Try to convert to number if it looks like a number
                        if (value && !isNaN(Number(value)) && value.trim() !== '') {
                            data[key] = Number(value);
                        }
                        // Convert boolean strings
                        else if (value === 'true') {
                            data[key] = true;
                        }
                        else if (value === 'false') {
                            data[key] = false;
                        }
                    }
                    return [3 /*break*/, 7];
                case 1:
                    contentType = request.headers.get('content-type') || '';
                    if (!contentType.includes('application/json')) return [3 /*break*/, 3];
                    return [4 /*yield*/, request.json()];
                case 2:
                    data = _c.sent();
                    return [3 /*break*/, 7];
                case 3:
                    if (!contentType.includes('multipart/form-data')) return [3 /*break*/, 4];
                    // For form data, we'll handle it in the route
                    return [2 /*return*/, null]; // Let the route handle it
                case 4:
                    if (!contentType.includes('application/x-www-form-urlencoded')) return [3 /*break*/, 6];
                    return [4 /*yield*/, request.formData()];
                case 5:
                    formData = _c.sent();
                    data = Object.fromEntries(formData.entries());
                    return [3 /*break*/, 7];
                case 6: return [2 /*return*/, server_1.NextResponse.json({ error: 'Unsupported content type' }, { status: 400 })];
                case 7:
                    validation = (0, validation_schemas_1.validateRequest)(schema, data);
                    if (!validation.success) {
                        return [2 /*return*/, server_1.NextResponse.json({
                                error: 'Validation failed',
                                details: validation.errors
                            }, { status: 400 })];
                    }
                    sanitizedData = sanitizeObject(validation.data);
                    return [2 /*return*/, { data: sanitizedData }];
                case 8:
                    error_1 = _c.sent();
                    console.error('Validation middleware error:', error_1);
                    return [2 /*return*/, server_1.NextResponse.json({ error: 'Invalid request data' }, { status: 400 })];
                case 9: return [2 /*return*/];
            }
        });
    }); };
}
// Recursively sanitize object properties
function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return (0, validation_schemas_1.sanitizeInput)(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(function (item) { return sanitizeObject(item); });
    }
    if (obj && typeof obj === 'object') {
        var sanitized = {};
        for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }
    return obj;
}
// Rate limiting middleware
var rateLimitMap = new Map();
function createRateLimitMiddleware(options) {
    return function (request) {
        var _a;
        var forwarded = request.headers.get('x-forwarded-for');
        var realIp = request.headers.get('x-real-ip');
        var ip = ((_a = forwarded === null || forwarded === void 0 ? void 0 : forwarded.split(',')[0]) === null || _a === void 0 ? void 0 : _a.trim()) || realIp || 'unknown';
        var key = options.keyGenerator ? options.keyGenerator(request) : ip;
        var now = Date.now();
        // Clean up old entries
        for (var _i = 0, _b = Array.from(rateLimitMap.entries()); _i < _b.length; _i++) {
            var _c = _b[_i], k = _c[0], v = _c[1];
            if (v.resetTime < now) {
                rateLimitMap.delete(k);
            }
        }
        var current = rateLimitMap.get(key);
        if (!current) {
            rateLimitMap.set(key, { count: 1, resetTime: now + options.windowMs });
            return null;
        }
        if (current.resetTime < now) {
            rateLimitMap.set(key, { count: 1, resetTime: now + options.windowMs });
            return null;
        }
        if (current.count >= options.max) {
            return server_1.NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }
        current.count++;
        return null;
    };
}
// Payload size middleware
function createPayloadSizeMiddleware(maxSize) {
    return function (request) {
        var contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > maxSize) {
            return server_1.NextResponse.json({ error: 'Payload too large' }, { status: 413 });
        }
        return null;
    };
}
// XSS protection middleware
function createXSSProtectionMiddleware() {
    return function (request) {
        // Check for common XSS patterns in headers
        var userAgent = request.headers.get('user-agent') || '';
        var referer = request.headers.get('referer') || '';
        var xssPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i
        ];
        for (var _i = 0, xssPatterns_1 = xssPatterns; _i < xssPatterns_1.length; _i++) {
            var pattern = xssPatterns_1[_i];
            if (pattern.test(userAgent) || pattern.test(referer)) {
                return server_1.NextResponse.json({ error: 'Suspicious request detected' }, { status: 400 });
            }
        }
        return null;
    };
}
// Combined security middleware
function createSecurityMiddleware(options) {
    var _this = this;
    return function (request) { return __awaiter(_this, void 0, void 0, function () {
        var xssCheck, sizeCheck, rateLimitCheck, validationCheck;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // XSS Protection
                    if (options.enableXSSProtection) {
                        xssCheck = createXSSProtectionMiddleware()(request);
                        if (xssCheck)
                            return [2 /*return*/, xssCheck];
                    }
                    // Payload size check
                    if (options.maxPayloadSize) {
                        sizeCheck = createPayloadSizeMiddleware(options.maxPayloadSize)(request);
                        if (sizeCheck)
                            return [2 /*return*/, sizeCheck];
                    }
                    // Rate limiting
                    if (options.rateLimit) {
                        rateLimitCheck = createRateLimitMiddleware(options.rateLimit)(request);
                        if (rateLimitCheck)
                            return [2 /*return*/, rateLimitCheck];
                    }
                    if (!options.validation) return [3 /*break*/, 2];
                    return [4 /*yield*/, createValidationMiddleware(options.validation)(request)];
                case 1:
                    validationCheck = _a.sent();
                    if (validationCheck)
                        return [2 /*return*/, validationCheck];
                    _a.label = 2;
                case 2: return [2 /*return*/, null];
            }
        });
    }); };
}
// Helper to extract validated data from request
function getValidatedData(request) {
    // This would be set by the validation middleware
    return request.validatedData || null;
}
