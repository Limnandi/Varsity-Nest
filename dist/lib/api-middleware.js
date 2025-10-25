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
exports.ApiMiddleware = void 0;
exports.withApiMiddleware = withApiMiddleware;
exports.createApiHandler = createApiHandler;
var server_1 = require("next/server");
var security_config_1 = require("./security-config");
var api_versioning_1 = require("./api-versioning");
var api_error_response_1 = require("./api-error-response");
var validation_middleware_1 = require("./validation-middleware");
var redis_1 = require("@/lib/redis");
var config_1 = require("@/lib/logging/config");
var ApiMiddleware = /** @class */ (function () {
    function ApiMiddleware() {
    }
    /**
     * Apply comprehensive API middleware
     */
    ApiMiddleware.apply = function (request_1) {
        return __awaiter(this, arguments, void 0, function (request, options) {
            var config, response, sizeCheck, rateLimitConfig, rateLimitCheck, version, validation, rateLimitConfig, securityMiddleware, securityCheck, error_1;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = __assign(__assign({}, security_config_1.defaultSecurityConfig), options.security);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 6]);
                        // 1. Handle CORS preflight
                        if (request.method === 'OPTIONS' && options.cors !== false) {
                            response = new server_1.NextResponse(null, { status: 200 });
                            return [2 /*return*/, security_config_1.SecurityMiddleware.applyCORS(response, config)];
                        }
                        // 2. Check request size
                        if (options.requestSizeCheck !== false) {
                            sizeCheck = security_config_1.SecurityMiddleware.checkRequestSize(request, config);
                            if (sizeCheck)
                                return [2 /*return*/, sizeCheck];
                        }
                        // 3. Apply rate limiting
                        if (options.rateLimit !== false) {
                            rateLimitConfig = typeof options.rateLimit === 'object'
                                ? __assign(__assign({}, config), { rateLimit: __assign(__assign({}, config.rateLimit), options.rateLimit) }) : config;
                            rateLimitCheck = security_config_1.SecurityMiddleware.checkRateLimit(request, rateLimitConfig);
                            if (rateLimitCheck)
                                return [2 /*return*/, rateLimitCheck];
                        }
                        // 4. Handle API versioning
                        if (options.versioning !== false) {
                            version = api_versioning_1.ApiVersioning.extractVersion(request);
                            validation = api_versioning_1.ApiVersioning.validateVersion(version);
                            if (!validation.valid)
                                return [2 /*return*/, validation.error];
                        }
                        if (!options.validation) return [3 /*break*/, 3];
                        rateLimitConfig = typeof options.rateLimit === 'object'
                            ? options.rateLimit
                            : options.rateLimit !== false ? config.rateLimit : undefined;
                        securityMiddleware = (0, validation_middleware_1.createSecurityMiddleware)({
                            validation: options.validation,
                            rateLimit: rateLimitConfig,
                            maxPayloadSize: options.requestSizeCheck !== false ? config.requestSize.maxSize : undefined,
                            enableXSSProtection: true
                        });
                        return [4 /*yield*/, securityMiddleware(request)];
                    case 2:
                        securityCheck = _a.sent();
                        if (securityCheck && 'status' in securityCheck)
                            return [2 /*return*/, securityCheck];
                        _a.label = 3;
                    case 3: return [2 /*return*/, null]; // All checks passed
                    case 4:
                        error_1 = _a.sent();
                        return [4 /*yield*/, api_error_response_1.ApiErrorResponseBuilder.createErrorResponse(error_1 instanceof Error ? error_1 : new Error(String(error_1)), request, { component: 'api_middleware' })];
                    case 5: return [2 /*return*/, _a.sent()];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Wrap API handler with middleware
     */
    ApiMiddleware.withMiddleware = function (handler, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __awaiter(_this, void 0, void 0, function () {
                var request, startedAt, url, routeKey, middlewareResponse, timeout, response, finishedAt, durationMs, securityConfig, securedResponse, finalResponse_1, error_2, errorResponse, securityConfig, finalError;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            request = args[0];
                            startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
                            url = new URL(request.url);
                            routeKey = "".concat(request.method, ":").concat(url.pathname);
                            return [4 /*yield*/, this.apply(request, options)];
                        case 1:
                            middlewareResponse = _a.sent();
                            if (middlewareResponse)
                                return [2 /*return*/, middlewareResponse];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 6]);
                            timeout = options.timeout || security_config_1.defaultSecurityConfig.timeout.apiTimeout;
                            return [4 /*yield*/, security_config_1.SecurityMiddleware.withTimeout(handler.apply(void 0, args), timeout)
                                // Timing
                            ];
                        case 3:
                            response = _a.sent();
                            finishedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
                            durationMs = Math.round(finishedAt - startedAt);
                            response.headers.set('Server-Timing', "total;dur=".concat(durationMs));
                            response.headers.set('X-Response-Time', "".concat(durationMs, "ms"));
                            securityConfig = options.security ? __assign(__assign({}, security_config_1.defaultSecurityConfig), options.security) : security_config_1.defaultSecurityConfig;
                            securedResponse = security_config_1.SecurityMiddleware.applySecurityHeaders(response, securityConfig);
                            // Apply CORS if enabled
                            if (options.cors !== false) {
                                finalResponse_1 = security_config_1.SecurityMiddleware.applyCORS(securedResponse, securityConfig);
                                (function () { return __awaiter(_this, void 0, void 0, function () {
                                    var status_1, minuteBucket, e_1;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                _a.trys.push([0, 6, , 7]);
                                                status_1 = finalResponse_1.status;
                                                minuteBucket = new Date().toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM
                                                ;
                                                return [4 /*yield*/, redis_1.redis.incr("metrics:req:count")];
                                            case 1:
                                                _a.sent();
                                                return [4 /*yield*/, redis_1.redis.incr("metrics:req:route:".concat(routeKey))];
                                            case 2:
                                                _a.sent();
                                                return [4 /*yield*/, redis_1.redis.incr("metrics:req:status:".concat(status_1))];
                                            case 3:
                                                _a.sent();
                                                return [4 /*yield*/, redis_1.redis.incr("metrics:req:minute:".concat(minuteBucket))];
                                            case 4:
                                                _a.sent();
                                                return [4 /*yield*/, redis_1.redis.setex("metrics:req:last:".concat(routeKey), 300, String(Date.now()))];
                                            case 5:
                                                _a.sent();
                                                return [3 /*break*/, 7];
                                            case 6:
                                                e_1 = _a.sent();
                                                return [3 /*break*/, 7];
                                            case 7: return [2 /*return*/];
                                        }
                                    });
                                }); })();
                                // Log slow handlers
                                if (durationMs > 1000) {
                                    (0, config_1.captureMessage)('Slow API handler detected', { level: 'warning', component: 'api_middleware', routeKey: routeKey, durationMs: durationMs });
                                }
                                return [2 /*return*/, finalResponse_1];
                            }
                            return [2 /*return*/, securedResponse];
                        case 4:
                            error_2 = _a.sent();
                            return [4 /*yield*/, api_error_response_1.ApiErrorResponseBuilder.createErrorResponse(error_2 instanceof Error ? error_2 : new Error(String(error_2)), request, { component: 'api_handler' })
                                // Apply security headers to error response
                            ];
                        case 5:
                            errorResponse = _a.sent();
                            securityConfig = options.security ? __assign(__assign({}, security_config_1.defaultSecurityConfig), options.security) : security_config_1.defaultSecurityConfig;
                            finalError = security_config_1.SecurityMiddleware.applySecurityHeaders(errorResponse, securityConfig);
                            (function () { return __awaiter(_this, void 0, void 0, function () {
                                var url_1, routeKey_1, _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _b.trys.push([0, 3, , 4]);
                                            url_1 = new URL(request.url);
                                            routeKey_1 = "".concat(request.method, ":").concat(url_1.pathname);
                                            return [4 /*yield*/, redis_1.redis.incr("metrics:req:errors")];
                                        case 1:
                                            _b.sent();
                                            return [4 /*yield*/, redis_1.redis.incr("metrics:req:errors:".concat(routeKey_1))];
                                        case 2:
                                            _b.sent();
                                            return [3 /*break*/, 4];
                                        case 3:
                                            _a = _b.sent();
                                            return [3 /*break*/, 4];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); })();
                            return [2 /*return*/, finalError];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
    };
    /**
     * Create standardized API response
     */
    ApiMiddleware.createResponse = function (data, message, status) {
        if (status === void 0) { status = 200; }
        var response = api_error_response_1.ApiErrorResponseBuilder.createSuccessResponse(data, message);
        return new server_1.NextResponse(response.body, {
            status: status,
            headers: response.headers
        });
    };
    /**
     * Create error response with proper formatting
     */
    ApiMiddleware.createErrorResponse = function (error_3, request_1) {
        return __awaiter(this, arguments, void 0, function (error, request, _status, context) {
            if (_status === void 0) { _status = 500; }
            if (context === void 0) { context = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, api_error_response_1.ApiErrorResponseBuilder.createErrorResponse(error instanceof Error ? error : new Error(String(error)), request, context)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Handle OPTIONS requests for CORS
     */
    ApiMiddleware.handleCORS = function (_request, config) {
        if (config === void 0) { config = security_config_1.defaultSecurityConfig; }
        var response = new server_1.NextResponse(null, { status: 200 });
        return security_config_1.SecurityMiddleware.applyCORS(response, config);
    };
    return ApiMiddleware;
}());
exports.ApiMiddleware = ApiMiddleware;
/**
 * Decorator for API routes with comprehensive middleware
 */
function withApiMiddleware(options) {
    if (options === void 0) { options = {}; }
    return function (_target, _propertyKey, descriptor) {
        if (descriptor.value) {
            var originalMethod = descriptor.value;
            descriptor.value = ApiMiddleware.withMiddleware(originalMethod, options);
        }
        return descriptor;
    };
}
/**
 * Higher-order function for API route handlers
 */
function createApiHandler(options) {
    if (options === void 0) { options = {}; }
    return function (handler) {
        return ApiMiddleware.withMiddleware(handler, options);
    };
}
