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
exports.securityMiddleware = securityMiddleware;
var server_1 = require("next/server");
var redis_1 = require("@/lib/redis");
var logger_1 = require("@/lib/logging/logger");
var security_utils_1 = require("../security/security-utils");
var RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
var MAX_REQUESTS = 60; // 60 requests per minute
function securityMiddleware(request) {
    return __awaiter(this, void 0, void 0, function () {
        var rateLimitKey, path, requests, response, responseHeaders_1, securityHeaders, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rateLimitKey = security_utils_1.SecurityUtils.getRateLimitKey(request);
                    path = request.nextUrl.pathname;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, redis_1.redis.incr(rateLimitKey)];
                case 2:
                    requests = _a.sent();
                    if (!(requests === 1)) return [3 /*break*/, 4];
                    return [4 /*yield*/, redis_1.redis.expire(rateLimitKey, RATE_LIMIT_WINDOW / 1000)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    if (requests > MAX_REQUESTS) {
                        logger_1.log.warn('Rate limit exceeded', { path: path, requests: requests });
                        return [2 /*return*/, new server_1.NextResponse('Too Many Requests', { status: 429 })];
                    }
                    response = server_1.NextResponse.next();
                    responseHeaders_1 = response.headers;
                    // CORS headers
                    responseHeaders_1.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
                    responseHeaders_1.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                    responseHeaders_1.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                    securityHeaders = security_utils_1.SecurityUtils.getSecurityHeaders();
                    Object.entries(securityHeaders).forEach(function (_a) {
                        var header = _a[0], value = _a[1];
                        responseHeaders_1.set(header, value);
                    });
                    return [2 /*return*/, response];
                case 5:
                    error_1 = _a.sent();
                    logger_1.log.error('Security middleware error', error_1 instanceof Error ? error_1 : new Error('Unknown error'));
                    return [2 /*return*/, server_1.NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
