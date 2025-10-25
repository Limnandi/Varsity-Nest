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
exports.apiMiddleware = apiMiddleware;
var server_1 = require("next/server");
var config_1 = require("@/lib/logging/config");
var performance_1 = require("../monitoring/performance");
var CustomErrors_1 = require("../errors/CustomErrors");
var logger_1 = require("../logging/logger");
function apiMiddleware(request, handler) {
    return __awaiter(this, void 0, void 0, function () {
        var requestId, startTime, endMetric, response, endTime, duration, error_1, endTime, duration;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    requestId = crypto.randomUUID();
                    startTime = globalThis.performance.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    // Set request context for logging/Sentry
                    (0, config_1.setSentryContext)({ requestId: requestId, path: request.nextUrl.pathname, method: request.method });
                    endMetric = performance_1.performanceMonitor.startMetric("api_".concat(request.method, "_").concat(request.nextUrl.pathname));
                    return [4 /*yield*/, handler(request)];
                case 2:
                    response = _a.sent();
                    // End performance metric
                    endMetric();
                    endTime = globalThis.performance.now();
                    duration = endTime - startTime;
                    // Log successful request
                    logger_1.log.info('API request completed', {
                        requestId: requestId,
                        path: request.nextUrl.pathname,
                        method: request.method,
                        duration: duration,
                        status: response.status
                    });
                    return [2 /*return*/, response];
                case 3:
                    error_1 = _a.sent();
                    endTime = globalThis.performance.now();
                    duration = endTime - startTime;
                    if (error_1 instanceof CustomErrors_1.BaseError) {
                        // Handle known application errors
                        logger_1.log.warn('API request failed with known error', {
                            requestId: requestId,
                            path: request.nextUrl.pathname,
                            method: request.method,
                            duration: duration,
                            errorCode: error_1.code,
                            errorMessage: error_1.message
                        });
                        return [2 /*return*/, server_1.NextResponse.json({
                                success: false,
                                error: {
                                    code: error_1.code,
                                    message: error_1.message,
                                    statusCode: error_1.statusCode
                                },
                                metadata: {
                                    requestId: requestId,
                                    timestamp: new Date().toISOString()
                                }
                            }, { status: error_1.statusCode })];
                    }
                    // Handle unknown errors
                    logger_1.log.error('API request failed with unknown error', error_1 instanceof Error ? error_1 : new Error('Unknown error'), {
                        requestId: requestId,
                        path: request.nextUrl.pathname,
                        method: request.method,
                        duration: duration
                    });
                    // Capture in Sentry with additional context
                    (0, config_1.captureException)(error_1 instanceof Error ? error_1 : new Error('Unknown error'), { requestId: requestId, path: request.nextUrl.pathname, method: request.method, duration: duration });
                    return [2 /*return*/, server_1.NextResponse.json({
                            success: false,
                            error: {
                                code: 'INTERNAL_SERVER_ERROR',
                                message: 'An unexpected error occurred',
                                statusCode: 500
                            },
                            metadata: {
                                requestId: requestId,
                                timestamp: new Date().toISOString()
                            }
                        }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
