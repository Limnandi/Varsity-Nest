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
exports.withAuth = withAuth;
exports.requireAuth = requireAuth;
exports.createUnauthorizedResponse = createUnauthorizedResponse;
exports.createForbiddenResponse = createForbiddenResponse;
var server_1 = require("next/server");
var auth_server_1 = require("./auth-server");
// Middleware for protecting API routes
function withAuth(requiredRole) {
    return function (handler) {
        return function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var authMiddleware, authResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            authMiddleware = (0, auth_server_1.createAuthMiddleware)(requiredRole);
                            return [4 /*yield*/, authMiddleware(request)];
                        case 1:
                            authResult = _a.sent();
                            if (authResult.error) {
                                return [2 /*return*/, server_1.NextResponse.json({ error: authResult.error }, { status: authResult.status })];
                            }
                            return [2 /*return*/, handler(request, authResult.user)];
                    }
                });
            });
        };
    };
}
// Middleware for protecting pages (server components)
function requireAuth(requiredRole) {
    return __awaiter(this, void 0, void 0, function () {
        var headers, getCurrentUserFromRequest, headersList, request, user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, import('next/headers')];
                case 1:
                    headers = (_a.sent()).headers;
                    return [4 /*yield*/, import('./auth-server')
                        // Get headers and create request object
                    ];
                case 2:
                    getCurrentUserFromRequest = (_a.sent()).getCurrentUserFromRequest;
                    return [4 /*yield*/, headers()];
                case 3:
                    headersList = _a.sent();
                    request = new server_1.NextRequest('http://localhost', {
                        headers: headersList
                    });
                    return [4 /*yield*/, getCurrentUserFromRequest(request)];
                case 4:
                    user = _a.sent();
                    if (!user) {
                        throw new Error('Unauthorized');
                    }
                    if (!user.isActive) {
                        throw new Error('Account deactivated');
                    }
                    if (!user.emailVerified) {
                        throw new Error('Email not verified');
                    }
                    if (requiredRole && !(0, auth_server_1.hasRequiredRole)(user.role, requiredRole)) {
                        throw new Error('Insufficient permissions');
                    }
                    return [2 /*return*/, user];
            }
        });
    });
}
// Redirect helper for unauthorized access
function createUnauthorizedResponse(message) {
    if (message === void 0) { message = 'Unauthorized'; }
    return server_1.NextResponse.json({ error: message }, { status: 401 });
}
function createForbiddenResponse(message) {
    if (message === void 0) { message = 'Forbidden'; }
    return server_1.NextResponse.json({ error: message }, { status: 403 });
}
