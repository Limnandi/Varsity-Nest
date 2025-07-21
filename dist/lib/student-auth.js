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
    StudentAuthService.generateOTP = function () {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };
    StudentAuthService.hashOTP = function (otp) {
        // Simple hash for demo - use proper hashing in production
        return btoa(otp + "salt").substring(0, 6);
    };
    // 🔥 REAL EMAIL SENDING WITH RESEND
    StudentAuthService.sendRealOTP = function (email_1) {
        return __awaiter(this, arguments, void 0, function (email, type) {
            var _a, isValid, university, students, existingStudent, otp, hashedOTP, response, result, verification, error_1;
            if (type === void 0) { type = "registration"; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.isEmailWhitelisted(email), isValid = _a.isValid, university = _a.university;
                        if (!isValid) {
                            return [2 /*return*/, { success: false, error: "Email domain not whitelisted for student access" }];
                        }
                        // For password reset, check if user exists
                        if (type === "password_reset") {
                            students = this.getStudents();
                            existingStudent = students.find(function (s) { return s.email === email; });
                            if (!existingStudent) {
                                return [2 /*return*/, { success: false, error: "No account found with this email address" }];
                            }
                            if (existingStudent.isBlocked) {
                                return [2 /*return*/, { success: false, error: "Your account has been suspended. Please contact support." }];
                            }
                        }
                        otp = this.generateOTP();
                        hashedOTP = this.hashOTP(otp);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch("/api/send-otp", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    email: email,
                                    otp: otp,
                                    type: type,
                                    university: university === "UFS" ? "University of the Free State" : "Central University of Technology",
                                }),
                            })];
                    case 2:
                        response = _b.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _b.sent();
                        if (result.success) {
                            verification = {
                                email: email,
                                otp: hashedOTP,
                                expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
                                attempts: 0,
                                type: type,
                            };
                            localStorage.setItem("otp_".concat(email), JSON.stringify(verification));
                            return [2 /*return*/, { success: true, hashedOTP: hashedOTP }];
                        }
                        else {
                            return [2 /*return*/, { success: false, error: result.error || "Failed to send email" }];
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        console.error("Failed to send OTP:", error_1);
                        return [2 /*return*/, { success: false, error: "Failed to send verification email. Please try again." }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // 🚨 DEMO OTP (Keep for testing)
    StudentAuthService.sendOTP = function (email_1) {
        return __awaiter(this, arguments, void 0, function (email, type) {
            var _a, isValid, university, students, existingStudent, otp, hashedOTP, verification;
            if (type === void 0) { type = "registration"; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.isEmailWhitelisted(email), isValid = _a.isValid, university = _a.university;
                        if (!isValid) {
                            return [2 /*return*/, { success: false, error: "Email domain not whitelisted for student access" }];
                        }
                        // For password reset, check if user exists
                        if (type === "password_reset") {
                            students = this.getStudents();
                            existingStudent = students.find(function (s) { return s.email === email; });
                            if (!existingStudent) {
                                return [2 /*return*/, { success: false, error: "No account found with this email address" }];
                            }
                            if (existingStudent.isBlocked) {
                                return [2 /*return*/, { success: false, error: "Your account has been suspended. Please contact support." }];
                            }
                        }
                        otp = this.generateOTP();
                        hashedOTP = this.hashOTP(otp);
                        // 🚨 DEMO MODE - Just a timeout, no real email!
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })
                            // Store OTP verification data
                        ];
                    case 1:
                        // 🚨 DEMO MODE - Just a timeout, no real email!
                        _b.sent();
                        verification = {
                            email: email,
                            otp: hashedOTP,
                            expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
                            attempts: 0,
                            type: type,
                        };
                        localStorage.setItem("otp_".concat(email), JSON.stringify(verification));
                        // 🚨 DEMO ONLY - In development, log the actual OTP to console
                        console.log("\uD83D\uDD25 DEMO OTP for ".concat(email, " (").concat(type, "): ").concat(otp, " (Hashed: ").concat(hashedOTP, ")"));
                        // 🚨 DEMO ALERT - Show OTP in browser for testing
                        if (typeof window !== "undefined") {
                            alert("DEMO MODE: Your OTP is ".concat(otp, "\n\nIn production, this would be sent to your email."));
                        }
                        return [2 /*return*/, { success: true, hashedOTP: hashedOTP }];
                }
            });
        });
    };
    StudentAuthService.verifyOTP = function (email, inputOTP) {
        return __awaiter(this, void 0, void 0, function () {
            var stored, verification, hashedInput;
            return __generator(this, function (_a) {
                stored = localStorage.getItem("otp_".concat(email));
                if (!stored) {
                    return [2 /*return*/, { success: false, error: "No OTP found for this email" }];
                }
                verification = JSON.parse(stored);
                // Check expiry
                if (new Date() > new Date(verification.expiresAt)) {
                    localStorage.removeItem("otp_".concat(email));
                    return [2 /*return*/, { success: false, error: "OTP has expired" }];
                }
                // Check attempts
                if (verification.attempts >= 3) {
                    localStorage.removeItem("otp_".concat(email));
                    return [2 /*return*/, { success: false, error: "Too many failed attempts" }];
                }
                hashedInput = this.hashOTP(inputOTP);
                if (hashedInput !== verification.otp) {
                    verification.attempts++;
                    localStorage.setItem("otp_".concat(email), JSON.stringify(verification));
                    return [2 /*return*/, { success: false, error: "Invalid OTP" }];
                }
                // Success - clean up
                localStorage.removeItem("otp_".concat(email));
                return [2 /*return*/, { success: true }];
            });
        });
    };
    StudentAuthService.registerStudent = function (email, name, password) {
        return __awaiter(this, void 0, void 0, function () {
            var university, student, students;
            return __generator(this, function (_a) {
                university = this.isEmailWhitelisted(email).university;
                student = {
                    id: Date.now().toString(),
                    email: email,
                    name: name,
                    university: university,
                    isVerified: true,
                    createdAt: new Date().toISOString(),
                    isBlocked: false,
                };
                students = this.getStudents();
                students.push(student);
                localStorage.setItem("students", JSON.stringify(students));
                // Store password (in production, hash this!)
                localStorage.setItem("password_".concat(email), password);
                // Set current student
                localStorage.setItem("currentStudent", JSON.stringify(student));
                return [2 /*return*/, student];
            });
        });
    };
    StudentAuthService.resetPassword = function (email, newPassword) {
        return __awaiter(this, void 0, void 0, function () {
            var students, student;
            return __generator(this, function (_a) {
                students = this.getStudents();
                student = students.find(function (s) { return s.email === email; });
                if (!student || student.isBlocked) {
                    return [2 /*return*/, false];
                }
                // Update password (in production, hash this!)
                localStorage.setItem("password_".concat(email), newPassword);
                return [2 /*return*/, true];
            });
        });
    };
    StudentAuthService.getStudents = function () {
        if (typeof window === "undefined")
            return [];
        var stored = localStorage.getItem("students");
        return stored ? JSON.parse(stored) : [];
    };
    StudentAuthService.getCurrentStudent = function () {
        if (typeof window === "undefined")
            return null;
        var stored = localStorage.getItem("currentStudent");
        return stored ? JSON.parse(stored) : null;
    };
    StudentAuthService.loginStudent = function (email, password) {
        var students = this.getStudents();
        var student = students.find(function (s) { return s.email === email; });
        if (!student) {
            return { success: false, error: "No account found with this email" };
        }
        if (student.isBlocked) {
            return {
                success: false,
                error: "Your account has been suspended".concat(student.blockedReason ? " for: ".concat(student.blockedReason) : "", ". Please contact support."),
            };
        }
        // Check password if provided (for regular login)
        if (password) {
            var storedPassword = localStorage.getItem("password_".concat(email));
            if (storedPassword !== password) {
                return { success: false, error: "Invalid password" };
            }
        }
        localStorage.setItem("currentStudent", JSON.stringify(student));
        return { success: true, student: student };
    };
    StudentAuthService.logoutStudent = function () {
        localStorage.removeItem("currentStudent");
    };
    StudentAuthService.blockStudent = function (studentId, reason) {
        var students = this.getStudents();
        var index = students.findIndex(function (s) { return s.id === studentId; });
        if (index === -1)
            return false;
        students[index] = __assign(__assign({}, students[index]), { isBlocked: true, blockedAt: new Date().toISOString(), blockedReason: reason });
        localStorage.setItem("students", JSON.stringify(students));
        return true;
    };
    StudentAuthService.unblockStudent = function (studentId) {
        var students = this.getStudents();
        var index = students.findIndex(function (s) { return s.id === studentId; });
        if (index === -1)
            return false;
        students[index] = __assign(__assign({}, students[index]), { isBlocked: false, blockedAt: undefined, blockedReason: undefined });
        localStorage.setItem("students", JSON.stringify(students));
        return true;
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
