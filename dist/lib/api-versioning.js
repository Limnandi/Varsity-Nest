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
exports.ApiVersioning = exports.LATEST_API_VERSION = exports.DEFAULT_API_VERSION = exports.API_VERSIONS = void 0;
exports.withApiVersioning = withApiVersioning;
var server_1 = require("next/server");
var api_error_response_1 = require("./api-error-response");
exports.API_VERSIONS = {
    'v1': {
        version: 'v1',
        deprecated: false,
        supported: true
    },
    'v2': {
        version: 'v2',
        deprecated: false,
        supported: true
    }
};
exports.DEFAULT_API_VERSION = 'v1';
exports.LATEST_API_VERSION = 'v2';
var ApiVersioning = /** @class */ (function () {
    function ApiVersioning() {
    }
    /**
     * Extract API version from request
     */
    ApiVersioning.extractVersion = function (request) {
        // Check URL path for version
        var pathname = request.nextUrl.pathname;
        var versionMatch = pathname.match(/^\/api\/(v\d+)\//);
        if (versionMatch) {
            return versionMatch[1];
        }
        // Check X-API-Version header
        var headerVersion = request.headers.get('X-API-Version');
        if (headerVersion && exports.API_VERSIONS[headerVersion]) {
            return headerVersion;
        }
        // Check query parameter
        var queryVersion = request.nextUrl.searchParams.get('version');
        if (queryVersion && exports.API_VERSIONS[queryVersion]) {
            return queryVersion;
        }
        return exports.DEFAULT_API_VERSION;
    };
    /**
     * Validate API version
     */
    ApiVersioning.validateVersion = function (version) {
        var versionInfo = exports.API_VERSIONS[version];
        if (!versionInfo) {
            return {
                valid: false,
                error: server_1.NextResponse.json({
                    success: false,
                    error: 'Unsupported API version',
                    message: "API version '".concat(version, "' is not supported. Supported versions: ").concat(Object.keys(exports.API_VERSIONS).join(', ')),
                    code: 'UNSUPPORTED_API_VERSION',
                    supportedVersions: Object.keys(exports.API_VERSIONS),
                    timestamp: new Date().toISOString()
                }, { status: 400 })
            };
        }
        if (!versionInfo.supported) {
            return {
                valid: false,
                error: server_1.NextResponse.json({
                    success: false,
                    error: 'API version not supported',
                    message: "API version '".concat(version, "' is no longer supported"),
                    code: 'API_VERSION_NOT_SUPPORTED',
                    supportedVersions: Object.keys(exports.API_VERSIONS).filter(function (v) { return exports.API_VERSIONS[v].supported; }),
                    timestamp: new Date().toISOString()
                }, { status: 410 })
            };
        }
        return { valid: true };
    };
    /**
     * Add version headers to response
     */
    ApiVersioning.addVersionHeaders = function (response, version) {
        var versionInfo = exports.API_VERSIONS[version];
        response.headers.set('X-API-Version', version);
        response.headers.set('X-API-Supported-Versions', Object.keys(exports.API_VERSIONS).join(', '));
        response.headers.set('X-API-Latest-Version', exports.LATEST_API_VERSION);
        if (versionInfo.deprecated) {
            response.headers.set('X-API-Deprecated', 'true');
            if (versionInfo.sunsetDate) {
                response.headers.set('X-API-Sunset-Date', versionInfo.sunsetDate);
            }
        }
        return response;
    };
    /**
     * Create versioned response wrapper
     */
    ApiVersioning.withVersioning = function (handler) {
        var _this = this;
        return function (request) { return __awaiter(_this, void 0, void 0, function () {
            var version, validation, response, error_1, errorResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        version = this.extractVersion(request);
                        validation = this.validateVersion(version);
                        if (!validation.valid) {
                            return [2 /*return*/, validation.error];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 5]);
                        return [4 /*yield*/, handler(request, version)
                            // Add version headers
                        ];
                    case 2:
                        response = _a.sent();
                        // Add version headers
                        return [2 /*return*/, this.addVersionHeaders(response, version)];
                    case 3:
                        error_1 = _a.sent();
                        return [4 /*yield*/, api_error_response_1.ApiErrorResponseBuilder.createErrorResponse(error_1 instanceof Error ? error_1 : new Error(String(error_1)), request, { apiVersion: version })];
                    case 4:
                        errorResponse = _a.sent();
                        return [2 /*return*/, this.addVersionHeaders(errorResponse, version)];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
    };
    /**
     * Get version-specific route handler
     */
    ApiVersioning.getVersionedHandler = function (handlers) {
        var _this = this;
        return function (request) { return __awaiter(_this, void 0, void 0, function () {
            var version, validation, handler, response, error_2, errorResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        version = this.extractVersion(request);
                        validation = this.validateVersion(version);
                        if (!validation.valid) {
                            return [2 /*return*/, validation.error];
                        }
                        handler = handlers[version] || handlers[exports.DEFAULT_API_VERSION];
                        if (!handler) {
                            return [2 /*return*/, server_1.NextResponse.json({
                                    success: false,
                                    error: 'Handler not found',
                                    message: "No handler found for API version '".concat(version, "'"),
                                    code: 'HANDLER_NOT_FOUND',
                                    timestamp: new Date().toISOString()
                                }, { status: 501 })];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 5]);
                        return [4 /*yield*/, handler(request)];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, this.addVersionHeaders(response, version)];
                    case 3:
                        error_2 = _a.sent();
                        return [4 /*yield*/, api_error_response_1.ApiErrorResponseBuilder.createErrorResponse(error_2 instanceof Error ? error_2 : new Error(String(error_2)), request, { apiVersion: version })];
                    case 4:
                        errorResponse = _a.sent();
                        return [2 /*return*/, this.addVersionHeaders(errorResponse, version)];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
    };
    return ApiVersioning;
}());
exports.ApiVersioning = ApiVersioning;
/**
 * Middleware to handle API versioning
 */
function withApiVersioning(handler) {
    var _this = this;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(_this, void 0, void 0, function () {
            var request, version, validation, response, error_3, errorResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = args[0];
                        version = ApiVersioning.extractVersion(request);
                        validation = ApiVersioning.validateVersion(version);
                        if (!validation.valid) {
                            return [2 /*return*/, validation.error];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 5]);
                        return [4 /*yield*/, handler.apply(void 0, args)];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, ApiVersioning.addVersionHeaders(response, version)];
                    case 3:
                        error_3 = _a.sent();
                        return [4 /*yield*/, api_error_response_1.ApiErrorResponseBuilder.createErrorResponse(error_3 instanceof Error ? error_3 : new Error(String(error_3)), request, { apiVersion: version })];
                    case 4:
                        errorResponse = _a.sent();
                        return [2 /*return*/, ApiVersioning.addVersionHeaders(errorResponse, version)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
}
