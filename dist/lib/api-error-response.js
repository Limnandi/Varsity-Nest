"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.ErrorCodes = exports.ApiErrorResponseBuilder = exports.ApiError = void 0;
var server_1 = require("next/server");
var error_logging_1 = require("./services/error-logging");
var ApiError = /** @class */ (function (_super) {
    __extends(ApiError, _super);
    function ApiError(message, statusCode, code, details) {
        if (statusCode === void 0) { statusCode = 500; }
        if (code === void 0) { code = 'INTERNAL_ERROR'; }
        var _this = _super.call(this, message) || this;
        _this.name = 'ApiError';
        _this.statusCode = statusCode;
        _this.code = code;
        _this.details = details;
        return _this;
    }
    return ApiError;
}(Error));
exports.ApiError = ApiError;
var ApiErrorResponseBuilder = /** @class */ (function () {
    function ApiErrorResponseBuilder() {
    }
    /**
     * Create a standardized error response
     */
    ApiErrorResponseBuilder.createErrorResponse = function (error_1, request_1) {
        return __awaiter(this, arguments, void 0, function (error, request, context) {
            var apiError, statusCode, code, errorId, userMessage, response;
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        statusCode = 500;
                        code = 'INTERNAL_ERROR';
                        if (error instanceof ApiError) {
                            apiError = error;
                            statusCode = error.statusCode;
                            code = error.code;
                        }
                        else if (error instanceof Error) {
                            apiError = new ApiError(error.message, 500, 'INTERNAL_ERROR');
                        }
                        else {
                            apiError = new ApiError(String(error), 500, 'INTERNAL_ERROR');
                        }
                        return [4 /*yield*/, error_logging_1.ErrorLoggingService.logApiError(apiError, request, context)
                            // Create user-friendly message
                        ];
                    case 1:
                        errorId = _a.sent();
                        userMessage = error_logging_1.ErrorLoggingService.createUserFriendlyMessage(apiError, this.mapStatusCodeToCategory(statusCode), __assign({ url: request.url, method: request.method }, context));
                        response = {
                            success: false,
                            error: apiError.message,
                            errorId: errorId,
                            message: userMessage,
                            code: code,
                            details: apiError.details,
                            timestamp: new Date().toISOString()
                        };
                        return [2 /*return*/, server_1.NextResponse.json(response, { status: statusCode })];
                }
            });
        });
    };
    /**
     * Create a standardized success response
     */
    ApiErrorResponseBuilder.createSuccessResponse = function (data, message) {
        var response = {
            success: true,
            data: data,
            message: message,
            timestamp: new Date().toISOString()
        };
        return server_1.NextResponse.json(response);
    };
    /**
     * Create validation error response
     */
    ApiErrorResponseBuilder.createValidationErrorResponse = function (validationErrors_1, request_1) {
        return __awaiter(this, arguments, void 0, function (validationErrors, request, context) {
            var error;
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                error = new ApiError('Validation failed', 400, 'VALIDATION_ERROR', validationErrors);
                return [2 /*return*/, this.createErrorResponse(error, request, context)];
            });
        });
    };
    /**
     * Create authentication error response
     */
    ApiErrorResponseBuilder.createAuthErrorResponse = function () {
        return __awaiter(this, arguments, void 0, function (message, request, context) {
            var error;
            if (message === void 0) { message = 'Authentication required'; }
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                error = new ApiError(message, 401, 'AUTHENTICATION_REQUIRED');
                return [2 /*return*/, this.createErrorResponse(error, request, context)];
            });
        });
    };
    /**
     * Create authorization error response
     */
    ApiErrorResponseBuilder.createAuthorizationErrorResponse = function () {
        return __awaiter(this, arguments, void 0, function (message, request, context) {
            var error;
            if (message === void 0) { message = 'Insufficient permissions'; }
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                error = new ApiError(message, 403, 'AUTHORIZATION_DENIED');
                return [2 /*return*/, this.createErrorResponse(error, request, context)];
            });
        });
    };
    /**
     * Create not found error response
     */
    ApiErrorResponseBuilder.createNotFoundErrorResponse = function () {
        return __awaiter(this, arguments, void 0, function (resource, request, context) {
            var error;
            if (resource === void 0) { resource = 'Resource'; }
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                error = new ApiError("".concat(resource, " not found"), 404, 'RESOURCE_NOT_FOUND');
                return [2 /*return*/, this.createErrorResponse(error, request, context)];
            });
        });
    };
    /**
     * Create rate limit error response
     */
    ApiErrorResponseBuilder.createRateLimitErrorResponse = function (request_1) {
        return __awaiter(this, arguments, void 0, function (request, context) {
            var error;
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                error = new ApiError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
                return [2 /*return*/, this.createErrorResponse(error, request, context)];
            });
        });
    };
    /**
     * Create database error response
     */
    ApiErrorResponseBuilder.createDatabaseErrorResponse = function (error_1, request_1) {
        return __awaiter(this, arguments, void 0, function (error, request, context) {
            var apiError;
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                apiError = new ApiError('Database operation failed', 500, 'DATABASE_ERROR', { originalError: error.message });
                return [2 /*return*/, this.createErrorResponse(apiError, request, context)];
            });
        });
    };
    /**
     * Create external service error response
     */
    ApiErrorResponseBuilder.createExternalServiceErrorResponse = function (service_1, error_1, request_1) {
        return __awaiter(this, arguments, void 0, function (service, error, request, context) {
            var apiError;
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                apiError = new ApiError("".concat(service, " service is temporarily unavailable"), 503, 'EXTERNAL_SERVICE_ERROR', { service: service, originalError: error.message });
                return [2 /*return*/, this.createErrorResponse(apiError, request, context)];
            });
        });
    };
    /**
     * Map status code to error category
     */
    ApiErrorResponseBuilder.mapStatusCodeToCategory = function (statusCode) {
        if (statusCode >= 400 && statusCode < 500) {
            if (statusCode === 401 || statusCode === 403) {
                return error_logging_1.ErrorCategory.AUTHENTICATION;
            }
            if (statusCode === 422) {
                return error_logging_1.ErrorCategory.VALIDATION;
            }
            return error_logging_1.ErrorCategory.API;
        }
        if (statusCode >= 500) {
            return error_logging_1.ErrorCategory.DATABASE;
        }
        return error_logging_1.ErrorCategory.UNKNOWN;
    };
    return ApiErrorResponseBuilder;
}());
exports.ApiErrorResponseBuilder = ApiErrorResponseBuilder;
// Predefined error codes
exports.ErrorCodes = {
    // Authentication & Authorization
    AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    AUTHORIZATION_DENIED: 'AUTHORIZATION_DENIED',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    ACCOUNT_NOT_VERIFIED: 'ACCOUNT_NOT_VERIFIED',
    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    INVALID_FORMAT: 'INVALID_FORMAT',
    // Resources
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
    RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
    // Rate Limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    // Database
    DATABASE_ERROR: 'DATABASE_ERROR',
    CONNECTION_ERROR: 'CONNECTION_ERROR',
    QUERY_ERROR: 'QUERY_ERROR',
    TRANSACTION_ERROR: 'TRANSACTION_ERROR',
    // External Services
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    PAYMENT_SERVICE_ERROR: 'PAYMENT_SERVICE_ERROR',
    EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
    FILE_SERVICE_ERROR: 'FILE_SERVICE_ERROR',
    // File Upload
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
    FILE_PROCESSING_ERROR: 'FILE_PROCESSING_ERROR',
    // Payment
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    PAYMENT_DECLINED: 'PAYMENT_DECLINED',
    INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
    PAYMENT_PROCESSING_ERROR: 'PAYMENT_PROCESSING_ERROR',
    // Security
    SECURITY_VIOLATION: 'SECURITY_VIOLATION',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    CSRF_TOKEN_INVALID: 'CSRF_TOKEN_INVALID',
    // General
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    TIMEOUT: 'TIMEOUT',
    NETWORK_ERROR: 'NETWORK_ERROR'
};
