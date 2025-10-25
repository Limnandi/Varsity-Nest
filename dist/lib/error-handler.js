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
exports.GlobalErrorHandler = void 0;
var error_logging_1 = require("./services/error-logging");
var GlobalErrorHandler = /** @class */ (function () {
    function GlobalErrorHandler() {
    }
    /**
     * Initialize global error handling
     */
    GlobalErrorHandler.initialize = function () {
        if (this.isInitialized)
            return;
        // Handle unhandled promise rejections
        if (typeof window !== 'undefined') {
            window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
            window.addEventListener('error', this.handleGlobalError);
        }
        // Handle Node.js unhandled rejections
        if (typeof process !== 'undefined') {
            process.on('unhandledRejection', this.handleNodeUnhandledRejection);
            process.on('uncaughtException', this.handleUncaughtException);
        }
        this.isInitialized = true;
    };
    /**
     * Create a safe async wrapper for functions
     */
    GlobalErrorHandler.safeAsync = function (fn_1) {
        return __awaiter(this, arguments, void 0, function (fn, context, fallback) {
            var error_1;
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 4]);
                        return [4 /*yield*/, fn()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        return [4 /*yield*/, error_logging_1.ErrorLoggingService.logError(error_1 instanceof Error ? error_1 : new Error(String(error_1)), {
                                component: 'safe_async_wrapper',
                                metadata: context
                            }, error_logging_1.ErrorSeverity.MEDIUM, error_logging_1.ErrorCategory.UNKNOWN)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, fallback];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create a safe sync wrapper for functions
     */
    GlobalErrorHandler.safeSync = function (fn, context, fallback) {
        if (context === void 0) { context = {}; }
        try {
            return fn();
        }
        catch (error) {
            // Log error asynchronously without blocking
            error_logging_1.ErrorLoggingService.logError(error instanceof Error ? error : new Error(String(error)), {
                component: 'safe_sync_wrapper',
                metadata: context
            }, error_logging_1.ErrorSeverity.MEDIUM, error_logging_1.ErrorCategory.UNKNOWN).catch(function () {
                // Fallback logging if async logging fails
                console.error('Error in safe sync wrapper:', error);
            });
            return fallback;
        }
    };
    /**
     * Wrap API route handlers with error handling
     */
    GlobalErrorHandler.withApiErrorHandling = function (handler) {
        var _this = this;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __awaiter(_this, void 0, void 0, function () {
                var error_2, request;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 4]);
                            return [4 /*yield*/, handler.apply(void 0, args)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_2 = _a.sent();
                            request = args[0];
                            return [4 /*yield*/, error_logging_1.ErrorLoggingService.logApiError(error_2 instanceof Error ? error_2 : new Error(String(error_2)), request)
                                // Re-throw to let Next.js handle the response
                            ];
                        case 3:
                            _a.sent();
                            // Re-throw to let Next.js handle the response
                            throw error_2;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
    };
    /**
     * Create a retry wrapper with exponential backoff
     */
    GlobalErrorHandler.withRetry = function (fn_1) {
        return __awaiter(this, arguments, void 0, function (fn, maxRetries, baseDelay, context) {
            var lastError, _loop_1, attempt, state_1;
            if (maxRetries === void 0) { maxRetries = 3; }
            if (baseDelay === void 0) { baseDelay = 1000; }
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lastError = null;
                        _loop_1 = function (attempt) {
                            var _b, error_3, delay_1;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 2, , 7]);
                                        _b = {};
                                        return [4 /*yield*/, fn()];
                                    case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                    case 2:
                                        error_3 = _c.sent();
                                        lastError = error_3 instanceof Error ? error_3 : new Error(String(error_3));
                                        if (!(attempt === maxRetries)) return [3 /*break*/, 4];
                                        return [4 /*yield*/, error_logging_1.ErrorLoggingService.logError(lastError, {
                                                component: 'retry_wrapper',
                                                metadata: __assign(__assign({}, context), { maxRetries: maxRetries, finalAttempt: true })
                                            }, error_logging_1.ErrorSeverity.HIGH, error_logging_1.ErrorCategory.UNKNOWN)];
                                    case 3:
                                        _c.sent();
                                        throw lastError;
                                    case 4: 
                                    // Log retry attempt
                                    return [4 /*yield*/, error_logging_1.ErrorLoggingService.logError(lastError, {
                                            component: 'retry_wrapper',
                                            metadata: __assign(__assign({}, context), { attempt: attempt, maxRetries: maxRetries, willRetry: true })
                                        }, error_logging_1.ErrorSeverity.LOW, error_logging_1.ErrorCategory.UNKNOWN)
                                        // Wait before retry with exponential backoff
                                    ];
                                    case 5:
                                        // Log retry attempt
                                        _c.sent();
                                        delay_1 = baseDelay * Math.pow(2, attempt - 1);
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                                    case 6:
                                        _c.sent();
                                        return [3 /*break*/, 7];
                                    case 7: return [2 /*return*/];
                                }
                            });
                        };
                        attempt = 1;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= maxRetries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _a.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4: throw lastError;
                }
            });
        });
    };
    /**
     * Cleanup error handlers
     */
    GlobalErrorHandler.cleanup = function () {
        if (typeof window !== 'undefined') {
            window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
            window.removeEventListener('error', this.handleGlobalError);
        }
        if (typeof process !== 'undefined') {
            process.removeListener('unhandledRejection', this.handleNodeUnhandledRejection);
            process.removeListener('uncaughtException', this.handleUncaughtException);
        }
        this.isInitialized = false;
    };
    GlobalErrorHandler.isInitialized = false;
    /**
     * Handle unhandled promise rejections in browser
     */
    GlobalErrorHandler.handleUnhandledRejection = function (event) {
        event.preventDefault();
        var error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        error_logging_1.ErrorLoggingService.logError(error, {
            component: 'unhandled_promise_rejection',
            metadata: {
                type: 'unhandled_promise_rejection',
                reason: event.reason
            }
        }, error_logging_1.ErrorSeverity.HIGH, error_logging_1.ErrorCategory.UNKNOWN);
        // Show user-friendly error in development
        if ((typeof process !== 'undefined' && process.env.NODE_ENV === 'development')) {
            console.error('Unhandled Promise Rejection:', event.reason);
        }
    };
    /**
     * Handle global errors in browser
     */
    GlobalErrorHandler.handleGlobalError = function (event) {
        var _a;
        var error = new Error(event.message);
        error.stack = (_a = event.error) === null || _a === void 0 ? void 0 : _a.stack;
        error_logging_1.ErrorLoggingService.logError(error, {
            component: 'global_error',
            metadata: {
                type: 'global_error',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            }
        }, error_logging_1.ErrorSeverity.HIGH, error_logging_1.ErrorCategory.UNKNOWN);
        // Show user-friendly error in development
        if ((typeof process !== 'undefined' && process.env.NODE_ENV === 'development')) {
            console.error('Global Error:', event.error);
        }
    };
    /**
     * Handle unhandled promise rejections in Node.js
     */
    GlobalErrorHandler.handleNodeUnhandledRejection = function (reason, promise) {
        var error = reason instanceof Error ? reason : new Error(String(reason));
        error_logging_1.ErrorLoggingService.logError(error, {
            component: 'node_unhandled_rejection',
            metadata: {
                type: 'node_unhandled_rejection',
                promise: promise.toString()
            }
        }, error_logging_1.ErrorSeverity.CRITICAL, error_logging_1.ErrorCategory.UNKNOWN);
        console.error('Unhandled Promise Rejection:', reason);
    };
    /**
     * Handle uncaught exceptions in Node.js
     */
    GlobalErrorHandler.handleUncaughtException = function (error) {
        error_logging_1.ErrorLoggingService.logError(error, {
            component: 'node_uncaught_exception',
            metadata: {
                type: 'node_uncaught_exception'
            }
        }, error_logging_1.ErrorSeverity.CRITICAL, error_logging_1.ErrorCategory.UNKNOWN);
        console.error('Uncaught Exception:', error);
        // Exit process after logging
        process.exit(1);
    };
    return GlobalErrorHandler;
}());
exports.GlobalErrorHandler = GlobalErrorHandler;
// Note: GlobalErrorHandler is initialized in app/layout.tsx to avoid duplicate initialization
