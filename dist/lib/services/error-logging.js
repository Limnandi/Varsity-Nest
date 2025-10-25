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
exports.ErrorLoggingService = exports.ErrorCategory = exports.ErrorSeverity = void 0;
var config_1 = require("@/lib/logging/config");
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["AUTHENTICATION"] = "authentication";
    ErrorCategory["DATABASE"] = "database";
    ErrorCategory["PAYMENT"] = "payment";
    ErrorCategory["FILE_UPLOAD"] = "file_upload";
    ErrorCategory["API"] = "api";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["SECURITY"] = "security";
    ErrorCategory["BUSINESS_LOGIC"] = "business_logic";
    ErrorCategory["EXTERNAL_SERVICE"] = "external_service";
    ErrorCategory["UNKNOWN"] = "unknown";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
var ErrorLoggingService = /** @class */ (function () {
    function ErrorLoggingService() {
    }
    /**
     * Log an error with comprehensive context and monitoring
     */
    ErrorLoggingService.logError = function (error_1) {
        return __awaiter(this, arguments, void 0, function (error, context, severity, category) {
            var errorId, errorMessage, stack, structuredError;
            if (context === void 0) { context = {}; }
            if (severity === void 0) { severity = ErrorSeverity.MEDIUM; }
            if (category === void 0) { category = ErrorCategory.UNKNOWN; }
            return __generator(this, function (_a) {
                try {
                    errorId = this.generateErrorId();
                    errorMessage = typeof error === 'string' ? error : error.message;
                    stack = typeof error === 'string' ? undefined : error.stack;
                    structuredError = {
                        id: errorId,
                        message: errorMessage,
                        stack: stack,
                        severity: severity,
                        category: category,
                        context: __assign(__assign({}, context), { component: context.component || 'unknown' }),
                        timestamp: new Date(),
                        resolved: false,
                        tags: this.generateTags(severity, category, context)
                    };
                    // Log to Sentry with enhanced context
                    (0, config_1.captureException)(typeof error === 'string' ? new Error(error) : error, {
                        errorId: errorId,
                        severity: severity,
                        category: category,
                        component: context.component || 'unknown',
                        context: __assign(__assign({}, context), { timestamp: structuredError.timestamp.toISOString() }),
                        level: this.mapSeverityToSentryLevel(severity)
                    });
                    // Track error frequency for alerting
                    this.trackErrorFrequency(errorMessage, severity);
                    // Log to console in development without importing server-only env on client
                    if (process.env.NODE_ENV === 'development') {
                        console.error("\uD83D\uDEA8 [".concat(severity.toUpperCase(), "] ").concat(category, ":"), {
                            errorId: errorId,
                            message: errorMessage,
                            context: context,
                            stack: stack
                        });
                    }
                    return [2 /*return*/, errorId];
                }
                catch (loggingError) {
                    // Fallback logging if our logging system fails
                    console.error('Failed to log error:', loggingError);
                    console.error('Original error:', error);
                    return [2 /*return*/, 'logging-failed'];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Log API errors with request context
     */
    ErrorLoggingService.logApiError = function (error_1, request_1) {
        return __awaiter(this, arguments, void 0, function (error, request, context) {
            var url, userAgent, ipAddress;
            var _a, _b;
            if (context === void 0) { context = {}; }
            return __generator(this, function (_c) {
                url = new URL(request.url);
                userAgent = request.headers.get('user-agent') || 'unknown';
                ipAddress = ((_b = (_a = request.headers.get('x-forwarded-for')) === null || _a === void 0 ? void 0 : _a.split(',')[0]) === null || _b === void 0 ? void 0 : _b.trim()) ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
                return [2 /*return*/, this.logError(error, __assign(__assign({}, context), { url: url.pathname, method: request.method, userAgent: userAgent, ipAddress: ipAddress, component: 'api' }), ErrorSeverity.MEDIUM, ErrorCategory.API)];
            });
        });
    };
    /**
     * Log database errors with query context
     */
    ErrorLoggingService.logDatabaseError = function (error_1, query_1) {
        return __awaiter(this, arguments, void 0, function (error, query, params, context) {
            if (params === void 0) { params = []; }
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.logError(error, __assign(__assign({}, context), { component: 'database', metadata: {
                            query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
                            paramCount: params.length,
                            params: params.slice(0, 5) // Only log first 5 params for security
                        } }), ErrorSeverity.HIGH, ErrorCategory.DATABASE)];
            });
        });
    };
    /**
     * Log authentication errors with user context
     */
    ErrorLoggingService.logAuthError = function (error_1, userId_1, action_1) {
        return __awaiter(this, arguments, void 0, function (error, userId, action, context) {
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.logError(error, __assign(__assign({}, context), { userId: userId, action: action, component: 'authentication' }), ErrorSeverity.MEDIUM, ErrorCategory.AUTHENTICATION)];
            });
        });
    };
    /**
     * Log payment errors with transaction context
     */
    ErrorLoggingService.logPaymentError = function (error_1, transactionId_1, amount_1) {
        return __awaiter(this, arguments, void 0, function (error, transactionId, amount, context) {
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.logError(error, __assign(__assign({}, context), { component: 'payment', metadata: {
                            transactionId: transactionId,
                            amount: amount
                        } }), ErrorSeverity.HIGH, ErrorCategory.PAYMENT)];
            });
        });
    };
    /**
     * Log file upload errors with file context
     */
    ErrorLoggingService.logFileUploadError = function (error_1, fileName_1, fileSize_1) {
        return __awaiter(this, arguments, void 0, function (error, fileName, fileSize, context) {
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.logError(error, __assign(__assign({}, context), { component: 'file_upload', metadata: {
                            fileName: fileName,
                            fileSize: fileSize
                        } }), ErrorSeverity.MEDIUM, ErrorCategory.FILE_UPLOAD)];
            });
        });
    };
    /**
     * Log security violations with threat context
     */
    ErrorLoggingService.logSecurityViolation = function (error_1, threatType_1) {
        return __awaiter(this, arguments, void 0, function (error, threatType, context) {
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.logError(error, __assign(__assign({}, context), { component: 'security', metadata: {
                            threatType: threatType
                        } }), ErrorSeverity.HIGH, ErrorCategory.SECURITY)];
            });
        });
    };
    /**
     * Create a user-friendly error message
     */
    ErrorLoggingService.createUserFriendlyMessage = function (error, category, _context) {
        var _a;
        if (_context === void 0) { _context = {}; }
        var errorMessage = typeof error === 'string' ? error : error.message;
        // Don't expose internal errors to users
        if (errorMessage.includes('ECONNREFUSED') ||
            errorMessage.includes('ENOTFOUND') ||
            errorMessage.includes('database') ||
            errorMessage.includes('connection')) {
            return 'A temporary service issue occurred. Please try again in a few moments.';
        }
        // Map common errors to user-friendly messages
        var userFriendlyMessages = {
            'Invalid email or password': 'The email or password you entered is incorrect.',
            'User not found': 'No account found with this email address.',
            'Email already exists': 'An account with this email already exists.',
            'Invalid token': 'Your session has expired. Please log in again.',
            'File too large': 'The file you uploaded is too large. Please choose a smaller file.',
            'Invalid file type': 'The file type is not supported. Please choose a different file.',
            'Payment failed': 'Your payment could not be processed. Please try again or use a different payment method.',
            'Network error': 'Please check your internet connection and try again.',
            'Server error': 'Something went wrong on our end. Please try again later.'
        };
        // Check for exact matches first
        if (userFriendlyMessages[errorMessage]) {
            return userFriendlyMessages[errorMessage];
        }
        // Check for partial matches
        for (var _i = 0, _b = Object.entries(userFriendlyMessages); _i < _b.length; _i++) {
            var _c = _b[_i], key = _c[0], message = _c[1];
            if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
                return message;
            }
        }
        // Default messages based on category
        var categoryMessages = (_a = {},
            _a[ErrorCategory.AUTHENTICATION] = 'There was an issue with your login. Please try again.',
            _a[ErrorCategory.DATABASE] = 'A temporary service issue occurred. Please try again.',
            _a[ErrorCategory.PAYMENT] = 'There was an issue processing your payment. Please try again.',
            _a[ErrorCategory.FILE_UPLOAD] = 'There was an issue uploading your file. Please try again.',
            _a[ErrorCategory.API] = 'A temporary service issue occurred. Please try again.',
            _a[ErrorCategory.VALIDATION] = 'Please check your input and try again.',
            _a[ErrorCategory.NETWORK] = 'Please check your internet connection and try again.',
            _a[ErrorCategory.SECURITY] = 'A security issue was detected. Please try again.',
            _a[ErrorCategory.BUSINESS_LOGIC] = 'There was an issue processing your request. Please try again.',
            _a[ErrorCategory.EXTERNAL_SERVICE] = 'A third-party service is temporarily unavailable. Please try again.',
            _a[ErrorCategory.UNKNOWN] = 'An unexpected error occurred. Please try again.',
            _a);
        return categoryMessages[category] || 'An unexpected error occurred. Please try again.';
    };
    /**
     * Track error frequency for alerting
     */
    ErrorLoggingService.trackErrorFrequency = function (errorMessage, severity) {
        var key = "".concat(errorMessage, ":").concat(severity);
        var count = this.errorCounts.get(key) || 0;
        this.errorCounts.set(key, count + 1);
        // Check if we've exceeded the threshold
        var threshold = this.errorThresholds.get(severity) || 10;
        if (count + 1 >= threshold) {
            try {
                (0, config_1.captureException)(new Error("Error frequency threshold exceeded: ".concat(errorMessage)), {
                    frequency: count + 1,
                    threshold: threshold,
                    severity: severity
                });
            }
            catch (e) {
                // ignore
            }
        }
    };
    /**
     * Generate error ID
     */
    ErrorLoggingService.generateErrorId = function () {
        return "err_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 8));
    };
    /**
     * Generate tags for error categorization
     */
    ErrorLoggingService.generateTags = function (severity, category, context) {
        var tags = [severity, category];
        if (context.component)
            tags.push(context.component);
        if (context.userId)
            tags.push('user-specific');
        if (context.ipAddress)
            tags.push('ip-tracked');
        if (context.method)
            tags.push("method-".concat(context.method.toLowerCase()));
        return tags;
    };
    /**
     * Map severity to Sentry level
     */
    ErrorLoggingService.mapSeverityToSentryLevel = function (severity) {
        switch (severity) {
            case ErrorSeverity.LOW: return 'info';
            case ErrorSeverity.MEDIUM: return 'warning';
            case ErrorSeverity.HIGH: return 'error';
            case ErrorSeverity.CRITICAL: return 'fatal';
            default: return 'error';
        }
    };
    /**
     * Get error statistics
     */
    ErrorLoggingService.getErrorStats = function () {
        var _a, _b;
        var errorsBySeverity = (_a = {},
            _a[ErrorSeverity.LOW] = 0,
            _a[ErrorSeverity.MEDIUM] = 0,
            _a[ErrorSeverity.HIGH] = 0,
            _a[ErrorSeverity.CRITICAL] = 0,
            _a);
        var errorsByCategory = (_b = {},
            _b[ErrorCategory.AUTHENTICATION] = 0,
            _b[ErrorCategory.DATABASE] = 0,
            _b[ErrorCategory.PAYMENT] = 0,
            _b[ErrorCategory.FILE_UPLOAD] = 0,
            _b[ErrorCategory.API] = 0,
            _b[ErrorCategory.VALIDATION] = 0,
            _b[ErrorCategory.NETWORK] = 0,
            _b[ErrorCategory.SECURITY] = 0,
            _b[ErrorCategory.BUSINESS_LOGIC] = 0,
            _b[ErrorCategory.EXTERNAL_SERVICE] = 0,
            _b[ErrorCategory.UNKNOWN] = 0,
            _b);
        var topErrors = [];
        // This would be implemented with actual database queries in production
        // For now, return mock data
        return {
            totalErrors: 0,
            errorsBySeverity: errorsBySeverity,
            errorsByCategory: errorsByCategory,
            topErrors: topErrors
        };
    };
    ErrorLoggingService.errorCounts = new Map();
    ErrorLoggingService.errorThresholds = new Map([
        [ErrorSeverity.LOW, 100],
        [ErrorSeverity.MEDIUM, 50],
        [ErrorSeverity.HIGH, 10],
        [ErrorSeverity.CRITICAL, 1]
    ]);
    return ErrorLoggingService;
}());
exports.ErrorLoggingService = ErrorLoggingService;
