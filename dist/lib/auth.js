"use server";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.authenticateUser = authenticateUser;
exports.createSession = createSession;
exports.getSession = getSession;
exports.getCurrentUser = getCurrentUser;
exports.deleteSession = deleteSession;
exports.login = login;
exports.createUser = createUser;
exports.getUserByEmail = getUserByEmail;
exports.getAllStudents = getAllStudents;
exports.toggleUserStatus = toggleUserStatus;
exports.deleteUser = deleteUser;
exports.getAdminSettings = getAdminSettings;
exports.updateAdminSettings = updateAdminSettings;
exports.verifyToken = verifyToken;
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var jose_1 = require("jose");
var headers_1 = require("next/headers");
var database_1 = require("./database");
var auth_constants_1 = require("./auth-constants");
function hashPassword(password) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, bcryptjs_1.default.hash(password, 12)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function verifyPassword(password, hashedPassword) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, bcryptjs_1.default.compare(password, hashedPassword)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function authenticateUser(email, password) {
    return __awaiter(this, void 0, void 0, function () {
        var result, user, isValidPassword, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    console.log("🔍 Authenticating user:", email);
                    return [4 /*yield*/, (0, database_1.query)("SELECT id, email, password, first_name, last_name, role, is_active, email_verified, created_at FROM users WHERE email = $1", [email])];
                case 1:
                    result = _a.sent();
                    if (!result.rows || result.rows.length === 0) {
                        console.log("❌ User not found");
                        return [2 /*return*/, null];
                    }
                    user = result.rows[0];
                    console.log("👤 Found user:", { id: user.id, email: user.email, role: user.role });
                    return [4 /*yield*/, bcryptjs_1.default.compare(password, user.password)];
                case 2:
                    isValidPassword = _a.sent();
                    if (!isValidPassword) {
                        console.log("❌ Invalid password");
                        return [2 /*return*/, null];
                    }
                    if (!user.is_active) {
                        console.log("❌ User account is not active");
                        return [2 /*return*/, null];
                    }
                    console.log("✅ Authentication successful");
                    return [2 /*return*/, {
                            id: user.id,
                            email: user.email,
                            name: "".concat(user.first_name, " ").concat(user.last_name),
                            role: user.role,
                            isVerified: user.email_verified || false,
                            isActive: user.is_active,
                            createdAt: user.created_at,
                            firstName: user.first_name,
                            lastName: user.last_name,
                        }];
                case 3:
                    error_1 = _a.sent();
                    console.error("❌ Authentication error:", error_1);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function createSession(user) {
    return __awaiter(this, void 0, void 0, function () {
        var expiresAt, session, cookieStore;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    return [4 /*yield*/, encrypt({
                            id: user.id,
                            email: user.email,
                            name: "".concat(user.firstName, " ").concat(user.lastName),
                            role: user.role,
                            expiresAt: expiresAt
                        })];
                case 1:
                    session = _a.sent();
                    return [4 /*yield*/, (0, headers_1.cookies)()];
                case 2:
                    cookieStore = _a.sent();
                    cookieStore.set("session", session, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        expires: expiresAt,
                        sameSite: "lax",
                        path: "/",
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function getSession() {
    return __awaiter(this, void 0, void 0, function () {
        var cookieStore, cookie, session;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, headers_1.cookies)()];
                case 1:
                    cookieStore = _b.sent();
                    cookie = (_a = cookieStore.get("session")) === null || _a === void 0 ? void 0 : _a.value;
                    return [4 /*yield*/, decrypt(cookie)];
                case 2:
                    session = _b.sent();
                    return [2 /*return*/, session];
            }
        });
    });
}
function getCurrentUser() {
    return __awaiter(this, void 0, void 0, function () {
        var session, result, user, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getSession()];
                case 1:
                    session = _a.sent();
                    if (!(session === null || session === void 0 ? void 0 : session.id))
                        return [2 /*return*/, null];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, database_1.query)("SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, u.email_verified, u.created_at, s.university\n       FROM users u\n       LEFT JOIN students s ON u.id = s.user_id\n       WHERE u.id = $1", [session.id])];
                case 3:
                    result = _a.sent();
                    if (!result.rows || result.rows.length === 0)
                        return [2 /*return*/, null];
                    user = result.rows[0];
                    return [2 /*return*/, {
                            id: user.id,
                            email: user.email,
                            name: "".concat(user.first_name, " ").concat(user.last_name),
                            role: user.role,
                            isVerified: user.email_verified || false,
                            isActive: user.is_active,
                            createdAt: user.created_at,
                            firstName: user.first_name,
                            lastName: user.last_name,
                            university: user.university,
                        }];
                case 4:
                    error_2 = _a.sent();
                    console.error("Failed to fetch session user:", error_2);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function deleteSession() {
    return __awaiter(this, void 0, void 0, function () {
        var cookieStore;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, headers_1.cookies)()];
                case 1:
                    cookieStore = _a.sent();
                    cookieStore.delete("session");
                    return [2 /*return*/];
            }
        });
    });
}
function login(email, password) {
    return __awaiter(this, void 0, void 0, function () {
        "use server";
        var user, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, authenticateUser(email, password)];
                case 1:
                    user = _a.sent();
                    if (!user) return [3 /*break*/, 3];
                    return [4 /*yield*/, createSession(user)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true, user: user }];
                case 3: return [2 /*return*/, { success: false, error: "Invalid credentials" }];
                case 4:
                    error_3 = _a.sent();
                    console.error("Login error:", error_3);
                    return [2 /*return*/, { success: false, error: "Login failed" }];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function encrypt(payload) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new jose_1.SignJWT(payload)
                    .setProtectedHeader({ alg: "HS256" })
                    .setIssuedAt()
                    .setExpirationTime("7d")
                    .sign(auth_constants_1.encodedKey)];
        });
    });
}
function decrypt() {
    return __awaiter(this, arguments, void 0, function (session) {
        var payload, error_4;
        if (session === void 0) { session = ""; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!session)
                        return [2 /*return*/, null];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, jose_1.jwtVerify)(session, auth_constants_1.encodedKey, {
                            algorithms: ["HS256"],
                        })];
                case 2:
                    payload = (_a.sent()).payload;
                    return [2 /*return*/, payload];
                case 3:
                    error_4 = _a.sent();
                    console.error("Failed to verify session:", error_4);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function createUser(userData) {
    return __awaiter(this, void 0, void 0, function () {
        var hashedPassword, result, user, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, bcryptjs_1.default.hash(userData.password, 12)];
                case 1:
                    hashedPassword = _a.sent();
                    return [4 /*yield*/, (0, database_1.query)("INSERT INTO users (email, password, first_name, last_name, role, phone, student_number, institution, created_at, updated_at)\n       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())\n       RETURNING id, email, first_name, last_name, role, phone, student_number, institution, created_at, updated_at", [
                            userData.email,
                            hashedPassword,
                            userData.firstName,
                            userData.lastName,
                            userData.role,
                            userData.phone || null,
                            userData.studentNumber || null,
                            userData.institution || null,
                        ])];
                case 2:
                    result = _a.sent();
                    user = result.rows[0];
                    return [2 /*return*/, {
                            id: user.id,
                            email: user.email,
                            name: "".concat(user.first_name, " ").concat(user.last_name),
                            role: user.role,
                            isVerified: false,
                            isActive: true,
                            createdAt: user.created_at,
                            firstName: user.first_name,
                            lastName: user.last_name,
                            phone: user.phone,
                            studentNumber: user.student_number,
                            institution: user.institution,
                        }];
                case 3:
                    error_5 = _a.sent();
                    console.error("Error creating user:", error_5);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getUserByEmail(email) {
    return __awaiter(this, void 0, void 0, function () {
        var result, user, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, database_1.query)("SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, u.email_verified, u.created_at, s.university\n       FROM users u\n       LEFT JOIN students s ON u.id = s.user_id\n       WHERE u.email = $1", [email])];
                case 1:
                    result = _a.sent();
                    if (!result.rows || result.rows.length === 0)
                        return [2 /*return*/, null];
                    user = result.rows[0];
                    return [2 /*return*/, {
                            id: user.id,
                            email: user.email,
                            name: "".concat(user.first_name, " ").concat(user.last_name),
                            role: user.role,
                            isVerified: user.email_verified || false,
                            isActive: user.is_active,
                            createdAt: user.created_at,
                            firstName: user.first_name,
                            lastName: user.last_name,
                            university: user.university,
                        }];
                case 2:
                    error_6 = _a.sent();
                    console.error("Error getting user by email:", error_6);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getAllStudents() {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, database_1.query)("SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, u.email_verified, u.created_at, s.university\n       FROM users u\n       JOIN students s ON u.id = s.user_id\n       WHERE u.role = 'student'\n       ORDER BY u.created_at DESC")];
                case 1:
                    result = _a.sent();
                    if (!result.rows)
                        return [2 /*return*/, []];
                    return [2 /*return*/, result.rows.map(function (row) { return ({
                            id: row.id,
                            email: row.email,
                            name: "".concat(row.first_name, " ").concat(row.last_name),
                            role: row.role,
                            isVerified: row.email_verified || false,
                            isActive: row.is_active,
                            createdAt: row.created_at,
                            firstName: row.first_name,
                            lastName: row.last_name,
                            university: row.university,
                        }); })];
                case 2:
                    error_7 = _a.sent();
                    console.error("Error getting all students:", error_7);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function toggleUserStatus(userId, isActive) {
    return __awaiter(this, void 0, void 0, function () {
        var error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, database_1.query)("UPDATE users SET is_active = $1 WHERE id = $2", [isActive, userId])];
                case 1:
                    _a.sent();
                    return [2 /*return*/, true];
                case 2:
                    error_8 = _a.sent();
                    console.error("Error toggling user status:", error_8);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function deleteUser(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, database_1.query)("DELETE FROM users WHERE id = $1", [userId])];
                case 1:
                    _a.sent();
                    return [2 /*return*/, true];
                case 2:
                    error_9 = _a.sent();
                    console.error("Error deleting user:", error_9);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getAdminSettings() {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, database_1.query)("SELECT * FROM admin_settings LIMIT 1")];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.rows[0] || null];
                case 2:
                    error_10 = _a.sent();
                    console.error("Error getting admin settings:", error_10);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function updateAdminSettings(settings) {
    return __awaiter(this, void 0, void 0, function () {
        var error_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, database_1.query)("INSERT INTO admin_settings (maintenance_mode, registration_enabled, payments_enabled)\n       VALUES ($1, $2, $3)\n       ON CONFLICT (id) DO UPDATE SET\n         maintenance_mode = EXCLUDED.maintenance_mode,\n         registration_enabled = EXCLUDED.registration_enabled,\n         payments_enabled = EXCLUDED.payments_enabled", [settings.maintenanceMode, settings.registrationEnabled, settings.paymentsEnabled])];
                case 1:
                    _a.sent();
                    return [2 /*return*/, true];
                case 2:
                    error_11 = _a.sent();
                    console.error("Error updating admin settings:", error_11);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function verifyToken(token) {
    return __awaiter(this, void 0, void 0, function () {
        "use server";
        var payload, error_12;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, jose_1.jwtVerify)(token, auth_constants_1.encodedKey, {
                            algorithms: ["HS256"],
                        })];
                case 1:
                    payload = (_a.sent()).payload;
                    return [2 /*return*/, payload];
                case 2:
                    error_12 = _a.sent();
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
