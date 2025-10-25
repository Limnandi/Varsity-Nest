"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.authMiddleware = authMiddleware;
var server_1 = require("next/server");
var security_utils_1 = require("../security/security-utils");
var redis_1 = require("@/lib/redis");
var logger_1 = require("@/lib/logging/logger");
var CustomErrors_1 = require("@/lib/errors/CustomErrors");
var jose = __importStar(require("jose"));
function authMiddleware(request, handler) {
    return __awaiter(this, void 0, void 0, function () {
        var token, secret, payload, isBlacklisted, sessionValid, csrfValid, requestWithUser, error_1, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 9, , 10]);
                    // Skip auth for public routes
                    if (isPublicRoute(request.nextUrl.pathname)) {
                        return [2 /*return*/, handler(request)];
                    }
                    token = (_a = request.headers.get('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
                    if (!token) {
                        throw new CustomErrors_1.AuthenticationError('No authentication token provided');
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, , 8]);
                    secret = new TextEncoder().encode(process.env.JWT_SECRET);
                    return [4 /*yield*/, jose.jwtVerify(token, secret)];
                case 2:
                    payload = (_b.sent()).payload;
                    return [4 /*yield*/, redis_1.redis.get("blacklist:".concat(token))];
                case 3:
                    isBlacklisted = _b.sent();
                    if (isBlacklisted) {
                        throw new CustomErrors_1.AuthenticationError('Token has been invalidated');
                    }
                    return [4 /*yield*/, redis_1.redis.get("session:".concat(payload.sub))];
                case 4:
                    sessionValid = _b.sent();
                    if (!sessionValid) {
                        throw new CustomErrors_1.AuthenticationError('Session has expired');
                    }
                    if (!isMutationMethod(request.method)) return [3 /*break*/, 6];
                    return [4 /*yield*/, security_utils_1.SecurityUtils.validateCsrfToken(request)];
                case 5:
                    csrfValid = _b.sent();
                    if (!csrfValid) {
                        throw new CustomErrors_1.AuthenticationError('Invalid CSRF token');
                    }
                    _b.label = 6;
                case 6:
                    requestWithUser = addUserToRequest(request, payload);
                    // Execute handler
                    return [2 /*return*/, handler(requestWithUser)];
                case 7:
                    error_1 = _b.sent();
                    if (error_1 instanceof jose.errors.JWTExpired) {
                        throw new CustomErrors_1.AuthenticationError('Token has expired');
                    }
                    throw new CustomErrors_1.AuthenticationError('Invalid authentication token');
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_2 = _b.sent();
                    logger_1.log.warn('Authentication failed', {
                        path: request.nextUrl.pathname,
                        method: request.method,
                        error: error_2 instanceof Error ? error_2.message : 'Unknown error'
                    });
                    if (error_2 instanceof CustomErrors_1.AuthenticationError) {
                        return [2 /*return*/, server_1.NextResponse.json({
                                success: false,
                                error: {
                                    code: error_2.code,
                                    message: error_2.message,
                                    statusCode: error_2.statusCode
                                }
                            }, { status: error_2.statusCode })];
                    }
                    return [2 /*return*/, server_1.NextResponse.json({
                            success: false,
                            error: {
                                code: 'AUTHENTICATION_ERROR',
                                message: 'Authentication failed',
                                statusCode: 401
                            }
                        }, { status: 401 })];
                case 10: return [2 /*return*/];
            }
        });
    });
}
// Helper functions
function isPublicRoute(path) {
    var publicRoutes = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/forgot-password',
        '/api/health',
        '/api/public'
    ];
    return publicRoutes.some(function (route) { return path.startsWith(route); });
}
function isMutationMethod(method) {
    return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
}
function addUserToRequest(request, payload) {
    // Create a new headers object with the user information
    var headers = new Headers(request.headers);
    headers.set('X-User-Id', payload.sub);
    headers.set('X-User-Role', payload.role);
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
    });
}
