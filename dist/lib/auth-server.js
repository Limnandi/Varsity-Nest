"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
exports.createSecureSession = createSecureSession;
exports.verifySecureSession = verifySecureSession;
exports.getCurrentUserFromRequest = getCurrentUserFromRequest;
exports.getCurrentUserFromStackAuth = getCurrentUserFromStackAuth;
exports.invalidateSession = invalidateSession;
exports.invalidateAllUserSessions = invalidateAllUserSessions;
exports.cleanupExpiredSessions = cleanupExpiredSessions;
exports.hasRequiredRole = hasRequiredRole;
exports.createAuthMiddleware = createAuthMiddleware;
var stack_1 = require("./stack");
var database_1 = require("./database");
var jose_1 = require("jose");
var auth_constants_1 = require("./auth-constants");
// Create secure JWT session token
function createSecureSession(user) {
    return __awaiter(this, void 0, void 0, function () {
        var sessionId, expiresAt, token;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sessionId = crypto.randomUUID();
                    expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                    ;
                    return [4 /*yield*/, new jose_1.SignJWT({
                            userId: user.id,
                            sessionId: sessionId,
                            role: user.role,
                            email: user.email,
                            emailVerified: user.emailVerified,
                        })
                            .setProtectedHeader({ alg: 'HS256' })
                            .setIssuedAt()
                            .setExpirationTime('7d')
                            .sign(auth_constants_1.encodedKey)
                        // Store session in database for validation
                    ];
                case 1:
                    token = _a.sent();
                    // Store session in database for validation
                    return [4 /*yield*/, (0, database_1.query)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    INSERT INTO user_sessions (id, user_id, expires_at, created_at)\n    VALUES (", ", ", ", ", ", NOW())\n    ON CONFLICT (id) DO UPDATE SET\n      expires_at = EXCLUDED.expires_at,\n      updated_at = NOW()\n  "], ["\n    INSERT INTO user_sessions (id, user_id, expires_at, created_at)\n    VALUES (", ", ", ", ", ", NOW())\n    ON CONFLICT (id) DO UPDATE SET\n      expires_at = EXCLUDED.expires_at,\n      updated_at = NOW()\n  "])), sessionId, user.id, expiresAt.toISOString())];
                case 2:
                    // Store session in database for validation
                    _a.sent();
                    return [2 /*return*/, token];
            }
        });
    });
}
// Verify and validate JWT session token
function verifySecureSession(token) {
    return __awaiter(this, void 0, void 0, function () {
        var payload, userId, sessionId, role, email, exp, sessionResult, sessionData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, (0, jose_1.jwtVerify)(token, auth_constants_1.encodedKey, {
                            algorithms: ['HS256']
                        })];
                case 1:
                    payload = (_a.sent()).payload;
                    userId = payload.userId, sessionId = payload.sessionId, role = payload.role, email = payload.email, exp = payload.exp;
                    if (!userId || !sessionId || !role || !email || !exp) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, (0, database_1.query)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      SELECT s.id, s.user_id, s.expires_at, s.created_at,\n             u.email, u.first_name, u.last_name, u.role, u.phone, u.student_number, u.institution,\n             u.is_active, u.email_verified, u.created_at as user_created_at, u.updated_at,\n             st.university, st.year_of_study, st.course, st.emergency_contact_name, st.emergency_contact_phone\n      FROM user_sessions s\n      JOIN users u ON s.user_id = u.id\n      LEFT JOIN students st ON u.id = st.user_id\n      WHERE s.id = ", " AND s.user_id = ", " AND s.expires_at > NOW()\n    "], ["\n      SELECT s.id, s.user_id, s.expires_at, s.created_at,\n             u.email, u.first_name, u.last_name, u.role, u.phone, u.student_number, u.institution,\n             u.is_active, u.email_verified, u.created_at as user_created_at, u.updated_at,\n             st.university, st.year_of_study, st.course, st.emergency_contact_name, st.emergency_contact_phone\n      FROM user_sessions s\n      JOIN users u ON s.user_id = u.id\n      LEFT JOIN students st ON u.id = st.user_id\n      WHERE s.id = ", " AND s.user_id = ", " AND s.expires_at > NOW()\n    "])), sessionId, userId)];
                case 2:
                    sessionResult = _a.sent();
                    if (sessionResult.rows.length === 0) {
                        return [2 /*return*/, null];
                    }
                    sessionData = sessionResult.rows[0];
                    return [2 /*return*/, {
                            user: {
                                id: sessionData.user_id,
                                email: sessionData.email,
                                firstName: sessionData.first_name,
                                lastName: sessionData.last_name,
                                role: sessionData.role,
                                phone: sessionData.phone,
                                studentNumber: sessionData.student_number,
                                institution: sessionData.institution,
                                isActive: sessionData.is_active,
                                emailVerified: sessionData.email_verified,
                                createdAt: new Date(sessionData.user_created_at),
                                updatedAt: new Date(sessionData.updated_at),
                                university: sessionData.university,
                                yearOfStudy: sessionData.year_of_study,
                                course: sessionData.course,
                                emergencyContactName: sessionData.emergency_contact_name,
                                emergencyContactPhone: sessionData.emergency_contact_phone,
                            },
                            sessionId: String(sessionId),
                            expiresAt: new Date(sessionData.expires_at),
                            iat: Math.floor(new Date(sessionData.created_at).getTime() / 1000)
                        }];
                case 3:
                    error_1 = _a.sent();
                    console.error('JWT verification failed:', error_1);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Get current user from request headers
function getCurrentUserFromRequest(request) {
    return __awaiter(this, void 0, void 0, function () {
        var authHeader, cookieToken, token, session;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    authHeader = request.headers.get('authorization');
                    cookieToken = (_a = request.cookies.get('varsity-nest-session')) === null || _a === void 0 ? void 0 : _a.value;
                    token = null;
                    if (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer ')) {
                        token = authHeader.substring(7);
                    }
                    else if (cookieToken) {
                        token = cookieToken;
                    }
                    if (!token) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, verifySecureSession(token)];
                case 1:
                    session = _b.sent();
                    return [2 /*return*/, (session === null || session === void 0 ? void 0 : session.user) || null];
            }
        });
    });
}
// Get current user from StackAuth (fallback for OAuth)
function getCurrentUserFromStackAuth() {
    return __awaiter(this, void 0, void 0, function () {
        var app, stackUser, userResult, user, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    app = (0, stack_1.getStackServerApp)();
                    return [4 /*yield*/, app.getUser({ or: 'return-null' })];
                case 1:
                    stackUser = _a.sent();
                    if (!(stackUser === null || stackUser === void 0 ? void 0 : stackUser.id)) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, (0, database_1.query)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.student_number, u.institution, \n             u.is_active, u.email_verified, u.created_at, u.updated_at, u.profile_image_url, u.profile_image_cloudinary_id,\n             s.university, s.year_of_study, s.course, s.emergency_contact_name, s.emergency_contact_phone\n      FROM users u\n      LEFT JOIN students s ON u.id = s.user_id\n      WHERE u.id = ", "\n    "], ["\n      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.student_number, u.institution, \n             u.is_active, u.email_verified, u.created_at, u.updated_at, u.profile_image_url, u.profile_image_cloudinary_id,\n             s.university, s.year_of_study, s.course, s.emergency_contact_name, s.emergency_contact_phone\n      FROM users u\n      LEFT JOIN students s ON u.id = s.user_id\n      WHERE u.id = ", "\n    "])), stackUser.id)];
                case 2:
                    userResult = _a.sent();
                    if (userResult.rows.length === 0) {
                        return [2 /*return*/, null];
                    }
                    user = userResult.rows[0];
                    return [2 /*return*/, {
                            id: user.id,
                            email: user.email,
                            firstName: user.first_name,
                            lastName: user.last_name,
                            role: user.role,
                            phone: user.phone,
                            studentNumber: user.student_number,
                            institution: user.institution,
                            isActive: user.is_active,
                            emailVerified: user.email_verified,
                            createdAt: new Date(user.created_at),
                            updatedAt: new Date(user.updated_at),
                            university: user.university,
                            yearOfStudy: user.year_of_study,
                            course: user.course,
                            emergencyContactName: user.emergency_contact_name,
                            emergencyContactPhone: user.emergency_contact_phone,
                            profileImageUrl: user.profile_image_url,
                            profileImageCloudinaryId: user.profile_image_cloudinary_id,
                        }];
                case 3:
                    error_2 = _a.sent();
                    console.error('StackAuth user fetch failed:', error_2);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Invalidate session (logout)
function invalidateSession(sessionId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, database_1.query)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n    DELETE FROM user_sessions \n    WHERE id = ", "\n  "], ["\n    DELETE FROM user_sessions \n    WHERE id = ", "\n  "])), sessionId)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Invalidate all sessions for a user
function invalidateAllUserSessions(userId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, database_1.query)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n    DELETE FROM user_sessions \n    WHERE user_id = ", "\n  "], ["\n    DELETE FROM user_sessions \n    WHERE user_id = ", "\n  "])), userId)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Clean up expired sessions
function cleanupExpiredSessions() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, database_1.query)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n    DELETE FROM user_sessions \n    WHERE expires_at < NOW()\n  "], ["\n    DELETE FROM user_sessions \n    WHERE expires_at < NOW()\n  "])))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Role validation helper
function hasRequiredRole(userRole, requiredRole) {
    var roleHierarchy = {
        'student': 1,
        'provider': 2,
        'admin': 3
    };
    return (roleHierarchy[userRole] || 0) >=
        (roleHierarchy[requiredRole] || 0);
}
// Middleware for API route protection
function createAuthMiddleware(requiredRole) {
    var _this = this;
    return function (request) { return __awaiter(_this, void 0, void 0, function () {
        var user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getCurrentUserFromRequest(request)];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, { error: 'Unauthorized', status: 401 }];
                    }
                    if (!user.isActive) {
                        return [2 /*return*/, { error: 'Account deactivated', status: 403 }];
                    }
                    if (!user.emailVerified) {
                        return [2 /*return*/, { error: 'Email not verified', status: 403 }];
                    }
                    if (requiredRole && !hasRequiredRole(user.role, requiredRole)) {
                        return [2 /*return*/, { error: 'Insufficient permissions', status: 403 }];
                    }
                    return [2 /*return*/, { user: user, error: null, status: 200 }];
            }
        });
    }); };
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
