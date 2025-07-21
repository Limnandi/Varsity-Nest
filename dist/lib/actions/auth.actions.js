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
exports.login = login;
exports.registerStudent = registerStudent;
exports.registerProvider = registerProvider;
exports.logout = logout;
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var auth_1 = require("@/lib/auth");
var database_1 = require("@/lib/database");
var definitions_1 = require("@/lib/definitions");
var navigation_1 = require("next/navigation");
// A utility function to validate student emails
function isStudentEmailDomainValid(email) {
    return __awaiter(this, void 0, void 0, function () {
        var result, allowedDomains, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, database_1.query)("SELECT value FROM admin_settings WHERE key = 'email_domains'", [])];
                case 1:
                    result = _a.sent();
                    if (result.rows.length === 0) {
                        // Default if not set in DB
                        return [2 /*return*/, email.endsWith(".ac.za")];
                    }
                    allowedDomains = result.rows[0].value;
                    return [2 /*return*/, allowedDomains.some(function (domain) { return email.endsWith(domain); })];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error fetching student email domains:", error_1);
                    return [2 /*return*/, false]; // Fail safely
                case 3: return [2 /*return*/];
            }
        });
    });
}
function login(prevState, formData) {
    return __awaiter(this, void 0, void 0, function () {
        var validatedFields, _a, email, password, result, user, passwordsMatch, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    validatedFields = definitions_1.LoginFormSchema.safeParse(Object.fromEntries(formData.entries()));
                    if (!validatedFields.success) {
                        return [2 /*return*/, {
                                errors: validatedFields.error.flatten().fieldErrors,
                                message: "Invalid fields. Please check your input.",
                            }];
                    }
                    _a = validatedFields.data, email = _a.email, password = _a.password;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, (0, database_1.query)("SELECT id, password_hash, role, is_active FROM users WHERE email = $1", [
                            email.toLowerCase(),
                        ])];
                case 2:
                    result = _b.sent();
                    user = result.rows[0];
                    if (!user) {
                        return [2 /*return*/, { message: "Invalid email or password." }];
                    }
                    if (!user.is_active) {
                        return [2 /*return*/, { message: "Your account has been deactivated. Please contact support." }];
                    }
                    return [4 /*yield*/, bcryptjs_1.default.compare(password, user.password_hash)];
                case 3:
                    passwordsMatch = _b.sent();
                    if (!passwordsMatch) {
                        return [2 /*return*/, { message: "Invalid email or password." }];
                    }
                    return [4 /*yield*/, (0, auth_1.createSession)(user.id, user.role)];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _b.sent();
                    console.error("Login error:", error_2);
                    return [2 /*return*/, { message: "An unexpected error occurred. Please try again." }];
                case 6: 
                // Redirect is handled on the client-side after successful state update
                return [2 /*return*/, { success: true }];
            }
        });
    });
}
function registerStudent(prevState, formData) {
    return __awaiter(this, void 0, void 0, function () {
        var validatedFields, _a, email, password, university, studentNumber, lowerCaseEmail, isEmailValid, existingUserResult, hashedPassword, userResult, newUser, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    validatedFields = definitions_1.StudentRegisterFormSchema.safeParse(Object.fromEntries(formData.entries()));
                    if (!validatedFields.success) {
                        return [2 /*return*/, {
                                errors: validatedFields.error.flatten().fieldErrors,
                                message: "Invalid fields. Please check your input.",
                            }];
                    }
                    _a = validatedFields.data, email = _a.email, password = _a.password, university = _a.university, studentNumber = _a.studentNumber;
                    lowerCaseEmail = email.toLowerCase();
                    return [4 /*yield*/, isStudentEmailDomainValid(lowerCaseEmail)];
                case 1:
                    isEmailValid = _b.sent();
                    if (!isEmailValid) {
                        return [2 /*return*/, { message: "Please use a valid student email address from a supported institution." }];
                    }
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 8, , 9]);
                    return [4 /*yield*/, (0, database_1.query)("SELECT id FROM users WHERE email = $1", [lowerCaseEmail])];
                case 3:
                    existingUserResult = _b.sent();
                    if (existingUserResult.rows.length > 0) {
                        return [2 /*return*/, { message: "An account with this email already exists." }];
                    }
                    return [4 /*yield*/, bcryptjs_1.default.hash(password, 12)];
                case 4:
                    hashedPassword = _b.sent();
                    return [4 /*yield*/, (0, database_1.query)("INSERT INTO users (name, email, password_hash, role, is_verified) VALUES ($1, $2, $3, 'student', true) RETURNING id", [name, lowerCaseEmail, hashedPassword])];
                case 5:
                    userResult = _b.sent();
                    newUser = userResult.rows[0];
                    return [4 /*yield*/, (0, database_1.query)("INSERT INTO students (user_id, university, student_number) VALUES ($1, $2, $3)", [
                            newUser.id,
                            university,
                            studentNumber,
                        ])];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, (0, auth_1.createSession)(newUser.id, "student")];
                case 7:
                    _b.sent();
                    return [3 /*break*/, 9];
                case 8:
                    error_3 = _b.sent();
                    console.error("Student registration error:", error_3);
                    return [2 /*return*/, { message: "An unexpected error occurred during registration." }];
                case 9: return [2 /*return*/, { success: true }];
            }
        });
    });
}
function registerProvider(prevState, formData) {
    return __awaiter(this, void 0, void 0, function () {
        var validatedFields, _a, email, password, businessName, contactPerson, contactPhone, lowerCaseEmail, existingUserResult, hashedPassword, userResult, newUser, error_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    validatedFields = definitions_1.ProviderRegisterFormSchema.safeParse(Object.fromEntries(formData.entries()));
                    if (!validatedFields.success) {
                        return [2 /*return*/, {
                                errors: validatedFields.error.flatten().fieldErrors,
                                message: "Invalid fields. Please check your input.",
                            }];
                    }
                    _a = validatedFields.data, email = _a.email, password = _a.password, businessName = _a.businessName, contactPerson = _a.contactPerson, contactPhone = _a.contactPhone;
                    lowerCaseEmail = email.toLowerCase();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, (0, database_1.query)("SELECT id FROM users WHERE email = $1", [lowerCaseEmail])];
                case 2:
                    existingUserResult = _b.sent();
                    if (existingUserResult.rows.length > 0) {
                        return [2 /*return*/, { message: "An account with this email already exists." }];
                    }
                    return [4 /*yield*/, bcryptjs_1.default.hash(password, 12)];
                case 3:
                    hashedPassword = _b.sent();
                    return [4 /*yield*/, (0, database_1.query)("INSERT INTO users (name, email, password_hash, role, is_verified) VALUES ($1, $2, $3, 'provider', false) RETURNING id", [contactPerson, lowerCaseEmail, hashedPassword])];
                case 4:
                    userResult = _b.sent();
                    newUser = userResult.rows[0];
                    return [4 /*yield*/, (0, database_1.query)("INSERT INTO service_providers (user_id, company_name, contact_number) VALUES ($1, $2, $3)", [
                            newUser.id,
                            businessName,
                            contactPhone,
                        ])
                        // Providers are not logged in automatically. They need verification.
                    ];
                case 5:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 6:
                    error_4 = _b.sent();
                    console.error("Provider registration error:", error_4);
                    return [2 /*return*/, { message: "An unexpected error occurred during registration." }];
                case 7: return [2 /*return*/, { success: true, message: "Registration successful! Your account is pending verification." }];
            }
        });
    });
}
function logout() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.deleteSession)()];
                case 1:
                    _a.sent();
                    (0, navigation_1.redirect)("/");
                    return [2 /*return*/];
            }
        });
    });
}
