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
exports.StudentAuthService = void 0;
// Default whitelisted domains
var defaultDomains = [
    {
        id: "1",
        domain: "@ufs4life.ac.za",
        university: "UFS",
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: "2",
        domain: "@cut.ac.za",
        university: "CUT",
        createdAt: new Date().toISOString(),
        isActive: true,
    },
];
var StudentAuthService = /** @class */ (function () {
    function StudentAuthService() {
    }
    StudentAuthService.getWhitelistedDomains = function () {
        if (typeof window === "undefined")
            return defaultDomains;
        var stored = localStorage.getItem("whitelistedDomains");
        return stored ? JSON.parse(stored) : defaultDomains;
    };
    StudentAuthService.saveWhitelistedDomains = function (domains) {
        if (typeof window === "undefined")
            return;
        localStorage.setItem("whitelistedDomains", JSON.stringify(domains));
    };
    StudentAuthService.addWhitelistedDomain = function (domain, university) {
        var domains = this.getWhitelistedDomains();
        var newDomain = {
            id: Date.now().toString(),
            domain: domain.startsWith("@") ? domain : "@".concat(domain),
            university: university,
            createdAt: new Date().toISOString(),
            isActive: true,
        };
        domains.push(newDomain);
        this.saveWhitelistedDomains(domains);
        return newDomain;
    };
    StudentAuthService.updateWhitelistedDomain = function (id, updates) {
        var domains = this.getWhitelistedDomains();
        var index = domains.findIndex(function (d) { return d.id === id; });
        if (index === -1)
            return false;
        domains[index] = __assign(__assign({}, domains[index]), updates);
        this.saveWhitelistedDomains(domains);
        return true;
    };
    StudentAuthService.deleteWhitelistedDomain = function (id) {
        var domains = this.getWhitelistedDomains();
        var filtered = domains.filter(function (d) { return d.id !== id; });
        if (filtered.length === domains.length)
            return false;
        this.saveWhitelistedDomains(filtered);
        return true;
    };
    StudentAuthService.isEmailWhitelisted = function (email) {
        var domains = this.getWhitelistedDomains().filter(function (d) { return d.isActive; });
        var emailDomain = email.substring(email.indexOf("@"));
        for (var _i = 0, domains_1 = domains; _i < domains_1.length; _i++) {
            var domain = domains_1[_i];
            if (emailDomain === domain.domain) {
                return { isValid: true, university: domain.university };
            }
        }
        return { isValid: false };
    };
    // OTP functions removed in favor of StackAuth native flows
    StudentAuthService.registerStudent = function (email, name, password) {
        return __awaiter(this, void 0, void 0, function () {
            var university, response, result, error, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        university = this.isEmailWhitelisted(email).university;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, fetch('/api/auth/register', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    email: email,
                                    firstName: name.split(' ')[0],
                                    lastName: name.split(' ').slice(1).join(' ') || '',
                                    password: password,
                                    role: 'student',
                                    university: university
                                }),
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _a.sent();
                        return [2 /*return*/, result.user];
                    case 4: return [4 /*yield*/, response.json()];
                    case 5:
                        error = _a.sent();
                        throw new Error(error.error || 'Registration failed');
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        console.error('Registration error:', error_1);
                        throw error_1;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    StudentAuthService.resetPassword = function (email, newPassword) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch('/api/auth/reset-password', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ email: email, newPassword: newPassword }),
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.ok];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Password reset error:', error_2);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    StudentAuthService.getStudents = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fetch('/api/admin/students')];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data.students || []];
                    case 3: return [2 /*return*/, []];
                    case 4:
                        error_3 = _a.sent();
                        console.error('Error fetching students:', error_3);
                        return [2 /*return*/, []];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    StudentAuthService.getCurrentStudent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, userSession, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fetch('/api/auth/session')];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        userSession = _a.sent();
                        return [2 /*return*/, {
                                id: userSession.userId,
                                email: userSession.email,
                                name: userSession.name,
                                university: userSession.university || 'UFS',
                                isVerified: userSession.emailVerified,
                                createdAt: userSession.createdAt,
                                isBlocked: !userSession.isActive,
                                blockedAt: userSession.isActive ? undefined : userSession.updatedAt,
                                blockedReason: userSession.isActive ? undefined : 'Account deactivated'
                            }];
                    case 3: return [2 /*return*/, null];
                    case 4:
                        error_4 = _a.sent();
                        console.error('Error fetching current student:', error_4);
                        return [2 /*return*/, null];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    StudentAuthService.loginStudent = function (email, password) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, error, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, fetch('/api/auth/secure-login', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ email: email, password: password }),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, { success: true, student: result.user }];
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        error = _a.sent();
                        return [2 /*return*/, { success: false, error: error.error || "Login failed" }];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_5 = _a.sent();
                        console.error('Login error:', error_5);
                        return [2 /*return*/, { success: false, error: "Login failed. Please try again." }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    StudentAuthService.logoutStudent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Call secure logout API
                        return [4 /*yield*/, fetch('/api/auth/secure-logout', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            })];
                    case 1:
                        // Call secure logout API
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        console.error('Logout error:', error_6);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    StudentAuthService.blockStudent = function (studentId, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch('/api/admin/students/toggle-status', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    studentId: studentId,
                                    isActive: false,
                                    reason: reason
                                }),
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.ok];
                    case 2:
                        error_7 = _a.sent();
                        console.error('Error blocking student:', error_7);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    StudentAuthService.unblockStudent = function (studentId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch('/api/admin/students/toggle-status', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    studentId: studentId,
                                    isActive: true
                                }),
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.ok];
                    case 2:
                        error_8 = _a.sent();
                        console.error('Error unblocking student:', error_8);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Report Management
    StudentAuthService.getReports = function () {
        if (typeof window === "undefined")
            return [];
        var stored = localStorage.getItem("reviewReports");
        return stored ? JSON.parse(stored) : [];
    };
    StudentAuthService.saveReports = function (reports) {
        if (typeof window === "undefined")
            return;
        localStorage.setItem("reviewReports", JSON.stringify(reports));
    };
    StudentAuthService.submitReport = function (reviewId, reportedBy, reporterType, reporterName, reason, description) {
        var reports = this.getReports();
        var report = {
            id: Date.now().toString(),
            reviewId: reviewId,
            reportedBy: reportedBy,
            reporterType: reporterType,
            reporterName: reporterName,
            reason: reason,
            description: description,
            createdAt: new Date().toISOString(),
            status: "pending",
        };
        reports.push(report);
        this.saveReports(reports);
        return report;
    };
    StudentAuthService.updateReportStatus = function (reportId, status, action, reviewedBy) {
        var reports = this.getReports();
        var index = reports.findIndex(function (r) { return r.id === reportId; });
        if (index === -1)
            return false;
        reports[index] = __assign(__assign({}, reports[index]), { status: status, action: action, reviewedBy: reviewedBy, reviewedAt: new Date().toISOString() });
        this.saveReports(reports);
        return true;
    };
    return StudentAuthService;
}());
exports.StudentAuthService = StudentAuthService;
