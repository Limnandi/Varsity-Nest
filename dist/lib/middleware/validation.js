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
exports.validateRequest = validateRequest;
var server_1 = require("next/server");
var zod_1 = require("zod");
var CustomErrors_1 = require("../errors/CustomErrors");
var logger_1 = require("../logging/logger");
var security_utils_1 = require("../security/security-utils");
function validateRequest(schemas) {
    var _this = this;
    return function (request, handler) { return __awaiter(_this, void 0, void 0, function () {
        var body, query, params, queryParams, requestBody, sanitizedBody, newRequest, error_1, urlParams, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    body = schemas.body, query = schemas.query, params = schemas.params;
                    // Validate query parameters
                    if (query) {
                        queryParams = Object.fromEntries(request.nextUrl.searchParams);
                        try {
                            query.parse(queryParams);
                        }
                        catch (error) {
                            if (error instanceof zod_1.z.ZodError) {
                                throw new CustomErrors_1.ValidationError('Invalid query parameters', error.errors);
                            }
                        }
                    }
                    if (!(body && ['POST', 'PUT', 'PATCH'].includes(request.method))) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, request.json()];
                case 2:
                    requestBody = _a.sent();
                    sanitizedBody = sanitizeObjectStrings(requestBody);
                    body.parse(sanitizedBody);
                    newRequest = new Request(request.url, {
                        method: request.method,
                        headers: request.headers,
                        body: JSON.stringify(sanitizedBody),
                    });
                    return [2 /*return*/, handler(newRequest)];
                case 3:
                    error_1 = _a.sent();
                    if (error_1 instanceof zod_1.z.ZodError) {
                        throw new CustomErrors_1.ValidationError('Invalid request body', error_1.errors);
                    }
                    throw error_1;
                case 4:
                    // Validate URL parameters
                    if (params) {
                        urlParams = extractUrlParams(request.nextUrl.pathname);
                        try {
                            params.parse(urlParams);
                        }
                        catch (error) {
                            if (error instanceof zod_1.z.ZodError) {
                                throw new CustomErrors_1.ValidationError('Invalid URL parameters', error.errors);
                            }
                        }
                    }
                    return [2 /*return*/, handler(request)];
                case 5:
                    error_2 = _a.sent();
                    logger_1.log.warn('Request validation failed', {
                        path: request.nextUrl.pathname,
                        method: request.method,
                        error: error_2 instanceof Error ? error_2.message : 'Unknown error'
                    });
                    if (error_2 instanceof CustomErrors_1.ValidationError) {
                        return [2 /*return*/, server_1.NextResponse.json({
                                success: false,
                                error: {
                                    code: error_2.code,
                                    message: error_2.message,
                                    details: error_2.details,
                                    statusCode: error_2.statusCode
                                }
                            }, { status: error_2.statusCode })];
                    }
                    return [2 /*return*/, server_1.NextResponse.json({
                            success: false,
                            error: {
                                code: 'VALIDATION_ERROR',
                                message: 'Request validation failed',
                                statusCode: 400
                            }
                        }, { status: 400 })];
                case 6: return [2 /*return*/];
            }
        });
    }); };
}
// Helper functions
function sanitizeObjectStrings(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObjectStrings);
    }
    var sanitized = {};
    for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (typeof value === 'string') {
            sanitized[key] = security_utils_1.SecurityUtils.sanitizeInput(value);
        }
        else if (typeof value === 'object') {
            sanitized[key] = sanitizeObjectStrings(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
function extractUrlParams(pathname) {
    var params = {};
    var pathParts = pathname.split('/');
    pathParts.forEach(function (part, index) {
        if (part.startsWith('[') && part.endsWith(']')) {
            var paramName = part.slice(1, -1);
            params[paramName] = pathParts[index];
        }
    });
    return params;
}
