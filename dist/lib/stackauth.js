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
exports.auth = exports.StackProvider = exports.getAdminSettings = exports.updateAdminSettings = exports.deleteUser = exports.toggleUserStatus = exports.getAllStudents = exports.verifyToken = exports.getCurrentUser = exports.signOut = exports.signIn = exports.getSession = void 0;
var stack_1 = require("@stackframe/stack");
Object.defineProperty(exports, "StackProvider", { enumerable: true, get: function () { return stack_1.StackProvider; } });
var stack_2 = require("@/lib/stack");
// Use server app to get current user/session from StackAuth cookies
var getSession = function () { return __awaiter(void 0, void 0, void 0, function () {
    var app, current, query, userResult, user, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                app = (0, stack_2.getStackServerApp)();
                return [4 /*yield*/, app.getUser()];
            case 1:
                current = _a.sent();
                if (!current)
                    return [2 /*return*/, null
                        // Get user data from database instead of relying on metadata
                    ];
                return [4 /*yield*/, import('./database')];
            case 2:
                query = (_a.sent()).query;
                return [4 /*yield*/, query(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.student_number, u.institution, \n             u.is_active, u.email_verified, u.created_at, u.updated_at, u.profile_image_url, u.profile_image_cloudinary_id,\n             s.university, s.year_of_study, s.course, s.emergency_contact_name, s.emergency_contact_phone\n      FROM users u\n      LEFT JOIN students s ON u.id = s.user_id\n      WHERE u.id = ", "\n    "], ["\n      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.student_number, u.institution, \n             u.is_active, u.email_verified, u.created_at, u.updated_at, u.profile_image_url, u.profile_image_cloudinary_id,\n             s.university, s.year_of_study, s.course, s.emergency_contact_name, s.emergency_contact_phone\n      FROM users u\n      LEFT JOIN students s ON u.id = s.user_id\n      WHERE u.id = ", "\n    "])), current.id)];
            case 3:
                userResult = _a.sent();
                if (userResult.rows.length === 0) {
                    return [2 /*return*/, null];
                }
                user = userResult.rows[0];
                return [2 /*return*/, { user: {
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
                            name: "".concat(user.first_name, " ").concat(user.last_name).trim(),
                            university: user.university,
                            yearOfStudy: user.year_of_study,
                            course: user.course,
                            emergencyContactName: user.emergency_contact_name,
                            emergencyContactPhone: user.emergency_contact_phone,
                            profileImageUrl: user.profile_image_url,
                            profileImageCloudinaryId: user.profile_image_cloudinary_id,
                        } }];
            case 4:
                error_1 = _a.sent();
                console.error('getSession error:', error_1);
                return [2 /*return*/, null];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getSession = getSession;
// For compatibility, expose no-op wrappers that rely on handler routes
var signIn = function (_credentials) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, { success: false, error: 'Use Stack handler via /handler routes' }];
    });
}); };
exports.signIn = signIn;
var signOut = function (_token) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            // StackServerApp does not expose logout server-side; rely on client handler or cookie invalidation
            return [2 /*return*/, { success: true }];
        }
        catch (_e) {
            return [2 /*return*/, { success: false, error: 'Logout failed' }];
        }
        return [2 /*return*/];
    });
}); };
exports.signOut = signOut;
// Additional auth functions needed by various components
var getCurrentUser = function () { return __awaiter(void 0, void 0, void 0, function () {
    var getStackClientApp, clientApp, user, error_2, session;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (!(typeof window !== 'undefined')) return [3 /*break*/, 6];
                _c.label = 1;
            case 1:
                _c.trys.push([1, 4, , 5]);
                return [4 /*yield*/, import('@/lib/stack')];
            case 2:
                getStackClientApp = (_c.sent()).getStackClientApp;
                clientApp = getStackClientApp();
                return [4 /*yield*/, clientApp.getUser()];
            case 3:
                user = _c.sent();
                if (user) {
                    // Convert StackAuth user to our SessionUser format
                    return [2 /*return*/, {
                            id: user.id,
                            email: user.primaryEmail || '',
                            firstName: ((_a = user.displayName) === null || _a === void 0 ? void 0 : _a.split(' ')[0]) || '',
                            lastName: ((_b = user.displayName) === null || _b === void 0 ? void 0 : _b.split(' ').slice(1).join(' ')) || '',
                            role: user.role || 'student',
                            phone: user.phone,
                            studentNumber: user.studentNumber,
                            institution: user.institution,
                            isActive: true,
                            emailVerified: user.primaryEmailVerified,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        }];
                }
                return [3 /*break*/, 5];
            case 4:
                error_2 = _c.sent();
                console.error('Error getting user from StackAuth client:', error_2);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/, null];
            case 6: return [4 /*yield*/, (0, exports.getSession)()];
            case 7:
                session = _c.sent();
                return [2 /*return*/, (session === null || session === void 0 ? void 0 : session.user) || null];
        }
    });
}); };
exports.getCurrentUser = getCurrentUser;
var verifyToken = function (_token) { return __awaiter(void 0, void 0, void 0, function () {
    var s;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.getSession)()];
            case 1:
                s = _a.sent();
                return [2 /*return*/, (s === null || s === void 0 ? void 0 : s.user) || null];
        }
    });
}); };
exports.verifyToken = verifyToken;
// User management functions
var getAllStudents = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, []];
    });
}); };
exports.getAllStudents = getAllStudents;
var toggleUserStatus = function (_userId, _isActive) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, { success: true }];
    });
}); };
exports.toggleUserStatus = toggleUserStatus;
var deleteUser = function (_userId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, { success: true }];
    });
}); };
exports.deleteUser = deleteUser;
// Admin settings functions
var updateAdminSettings = function (settings) { return __awaiter(void 0, void 0, void 0, function () {
    var getSQL, error_3;
    var _a, _b, _c, _d;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                _f.trys.push([0, 3, , 4]);
                return [4 /*yield*/, import('./database')
                    // Update or insert admin settings
                ];
            case 1:
                getSQL = (_f.sent()).getSQL;
                // Update or insert admin settings
                return [4 /*yield*/, getSQL()(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      INSERT INTO admin_settings (\n        maintenance_mode,\n        registration_enabled,\n        payments_enabled,\n        show_provisionally_accredited,\n        show_non_accredited,\n        updated_at\n      ) VALUES (\n        ", ",\n        ", ",\n        ", ",\n        ", ",\n        ", ",\n        NOW()\n      )\n      ON CONFLICT (id) DO UPDATE SET\n        maintenance_mode = EXCLUDED.maintenance_mode,\n        registration_enabled = EXCLUDED.registration_enabled,\n        payments_enabled = EXCLUDED.payments_enabled,\n        show_provisionally_accredited = EXCLUDED.show_provisionally_accredited,\n        show_non_accredited = EXCLUDED.show_non_accredited,\n        updated_at = EXCLUDED.updated_at\n    "], ["\n      INSERT INTO admin_settings (\n        maintenance_mode,\n        registration_enabled,\n        payments_enabled,\n        show_provisionally_accredited,\n        show_non_accredited,\n        updated_at\n      ) VALUES (\n        ", ",\n        ", ",\n        ", ",\n        ", ",\n        ", ",\n        NOW()\n      )\n      ON CONFLICT (id) DO UPDATE SET\n        maintenance_mode = EXCLUDED.maintenance_mode,\n        registration_enabled = EXCLUDED.registration_enabled,\n        payments_enabled = EXCLUDED.payments_enabled,\n        show_provisionally_accredited = EXCLUDED.show_provisionally_accredited,\n        show_non_accredited = EXCLUDED.show_non_accredited,\n        updated_at = EXCLUDED.updated_at\n    "])), settings.maintenanceMode || false, (_a = settings.registrationEnabled) !== null && _a !== void 0 ? _a : true, (_b = settings.paymentsEnabled) !== null && _b !== void 0 ? _b : true, (_c = settings.showProvisionallyAccredited) !== null && _c !== void 0 ? _c : true, (_d = settings.showNonAccredited) !== null && _d !== void 0 ? _d : true)];
            case 2:
                // Update or insert admin settings
                _f.sent();
                return [2 /*return*/, { success: true }];
            case 3:
                error_3 = _f.sent();
                console.error('Error updating admin settings:', error_3);
                return [2 /*return*/, { success: false, error: 'Failed to update settings' }];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateAdminSettings = updateAdminSettings;
var getAdminSettings = function () { return __awaiter(void 0, void 0, void 0, function () {
    var getSQL, result, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, import('./database')];
            case 1:
                getSQL = (_a.sent()).getSQL;
                return [4 /*yield*/, getSQL()(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n      SELECT \n        maintenance_mode,\n        registration_enabled,\n        payments_enabled,\n        show_provisionally_accredited,\n        show_non_accredited\n      FROM admin_settings\n      ORDER BY updated_at DESC\n      LIMIT 1\n    "], ["\n      SELECT \n        maintenance_mode,\n        registration_enabled,\n        payments_enabled,\n        show_provisionally_accredited,\n        show_non_accredited\n      FROM admin_settings\n      ORDER BY updated_at DESC\n      LIMIT 1\n    "])))];
            case 2:
                result = _a.sent();
                if (result.length > 0) {
                    return [2 /*return*/, result[0]];
                }
                // Return default settings if none exist
                return [2 /*return*/, {
                        maintenance_mode: false,
                        registration_enabled: true,
                        payments_enabled: true,
                        show_provisionally_accredited: true,
                        show_non_accredited: true
                    }];
            case 3:
                error_4 = _a.sent();
                console.error('Error fetching admin settings:', error_4);
                return [2 /*return*/, {
                        maintenance_mode: false,
                        registration_enabled: true,
                        payments_enabled: true,
                        show_provisionally_accredited: true,
                        show_non_accredited: true
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getAdminSettings = getAdminSettings;
// Export a simple auth object for compatibility
exports.auth = {
    getSession: exports.getSession,
    signIn: exports.signIn,
    signOut: exports.signOut,
    getCurrentUser: exports.getCurrentUser,
    verifyToken: exports.verifyToken
};
var templateObject_1, templateObject_2, templateObject_3;
