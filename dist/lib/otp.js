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
exports.storeOTP = storeOTP;
exports.generateOTP = generateOTP;
exports.sendOTP = sendOTP;
exports.verifyOTP = verifyOTP;
exports.incrementOTPAttempts = incrementOTPAttempts;
exports.getOTPAttempts = getOTPAttempts;
var resend_1 = require("resend");
var redis_1 = require("./redis");
var resend = new resend_1.Resend(process.env.RESEND_API_KEY);
function storeOTP(email_1, otp_1) {
    return __awaiter(this, arguments, void 0, function (email, otp, type) {
        var key;
        if (type === void 0) { type = "registration"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    key = "otp:".concat(type, ":").concat(email);
                    return [4 /*yield*/, redis_1.redis.setex(key, 300, otp)]; // 5 minutes expiry
                case 1:
                    _a.sent(); // 5 minutes expiry
                    return [4 /*yield*/, redis_1.redis.setex("".concat(key, ":attempts"), 300, "0")]; // Track attempts
                case 2:
                    _a.sent(); // Track attempts
                    return [2 /*return*/];
            }
        });
    });
}
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function sendOTP(email_1) {
    return __awaiter(this, arguments, void 0, function (email, type, userType) {
        var otp, subject, html, error_1;
        if (type === void 0) { type = "registration"; }
        if (userType === void 0) { userType = "student"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    otp = generateOTP();
                    return [4 /*yield*/, storeOTP(email, otp, type)];
                case 1:
                    _a.sent();
                    subject = type === "registration"
                        ? "Varsity Nest - Verify Your ".concat(userType === "student" ? "Student" : "Provider", " Account")
                        : "Varsity Nest - Password Reset Code";
                    html = "\n      <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n        <div style=\"background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); padding: 30px; text-align: center;\">\n          <h1 style=\"color: white; margin: 0; font-size: 28px;\">Varsity Nest</h1>\n          <p style=\"color: #e0f2fe; margin: 10px 0 0 0;\">Student Accommodation Platform</p>\n        </div>\n        \n        <div style=\"padding: 40px 30px; background: white;\">\n          <h2 style=\"color: #0f172a; margin-bottom: 20px;\">\n            ".concat(type === "registration" ? "Verify Your Account" : "Reset Your Password", "\n          </h2>\n          \n          <p style=\"color: #475569; font-size: 16px; line-height: 1.6;\">\n            ").concat(type === "registration"
                        ? "Welcome to Varsity Nest! Please use the verification code below to complete your ".concat(userType, " registration:")
                        : "You requested to reset your password. Use the code below to proceed:", "\n          </p>\n          \n          <div style=\"background: #f1f5f9; border: 2px dashed #0891b2; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;\">\n            <div style=\"font-size: 36px; font-weight: bold; color: #0891b2; letter-spacing: 8px; font-family: monospace;\">\n              ").concat(otp, "\n            </div>\n            <p style=\"color: #64748b; margin: 15px 0 0 0; font-size: 14px;\">\n              This code expires in 5 minutes\n            </p>\n          </div>\n          \n          <div style=\"background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;\">\n            <p style=\"color: #92400e; margin: 0; font-size: 14px;\">\n              <strong>Security Notice:</strong> Never share this code with anyone. Varsity Nest will never ask for your verification code.\n            </p>\n          </div>\n          \n          <p style=\"color: #64748b; font-size: 14px; margin-top: 30px;\">\n            If you didn't request this ").concat(type === "registration" ? "registration" : "password reset", ", please ignore this email.\n          </p>\n        </div>\n        \n        <div style=\"background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;\">\n          <p style=\"color: #64748b; font-size: 12px; margin: 0;\">\n            \u00A9 2024 Varsity Nest - Student Accommodation Platform<br>\n            Powered by Massive Operations\n          </p>\n        </div>\n      </div>\n    ");
                    return [4 /*yield*/, resend.emails.send({
                            from: "Varsity Nest <no-reply@varsitynest.space>", // TODO: Replace with verified domain email for production
                            to: [email],
                            subject: subject,
                            html: html,
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
                case 3:
                    error_1 = _a.sent();
                    console.error("Failed to send OTP:", error_1);
                    return [2 /*return*/, { success: false, error: "Failed to send verification email" }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function verifyOTP(email_1, inputOTP_1) {
    return __awaiter(this, arguments, void 0, function (email, inputOTP, type) {
        var storedOTP, attempts, error_2;
        if (type === void 0) { type = "registration"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 10, , 11]);
                    return [4 /*yield*/, redis_1.redis.get("otp:".concat(type, ":").concat(email))];
                case 1:
                    storedOTP = _a.sent();
                    if (!storedOTP) {
                        return [2 /*return*/, { success: false, error: "OTP has expired or doesn't exist" }];
                    }
                    return [4 /*yield*/, redis_1.redis.get("otp:".concat(type, ":").concat(email, ":attempts"))];
                case 2:
                    attempts = (_a.sent()) || "0";
                    if (!(Number.parseInt(attempts) >= 3)) return [3 /*break*/, 5];
                    return [4 /*yield*/, redis_1.redis.del("otp:".concat(type, ":").concat(email))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, redis_1.redis.del("otp:".concat(type, ":").concat(email, ":attempts"))];
                case 4:
                    _a.sent();
                    return [2 /*return*/, { success: false, error: "Too many failed attempts. Please request a new code." }];
                case 5:
                    if (!(storedOTP !== inputOTP)) return [3 /*break*/, 7];
                    return [4 /*yield*/, redis_1.redis.incr("otp:".concat(type, ":").concat(email, ":attempts"))];
                case 6:
                    _a.sent();
                    return [2 /*return*/, { success: false, error: "Invalid verification code" }];
                case 7: 
                // Success - clean up
                return [4 /*yield*/, redis_1.redis.del("otp:".concat(type, ":").concat(email))];
                case 8:
                    // Success - clean up
                    _a.sent();
                    return [4 /*yield*/, redis_1.redis.del("otp:".concat(type, ":").concat(email, ":attempts"))];
                case 9:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
                case 10:
                    error_2 = _a.sent();
                    console.error("OTP verification error:", error_2);
                    return [2 /*return*/, { success: false, error: "Verification failed" }];
                case 11: return [2 /*return*/];
            }
        });
    });
}
function incrementOTPAttempts(email_1) {
    return __awaiter(this, arguments, void 0, function (email, type) {
        var key, attempts;
        if (type === void 0) { type = "registration"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    key = "otp:".concat(type, ":").concat(email, ":attempts");
                    return [4 /*yield*/, redis_1.redis.incr(key)];
                case 1:
                    attempts = _a.sent();
                    return [4 /*yield*/, redis_1.redis.expire(key, 300)]; // Reset expiry
                case 2:
                    _a.sent(); // Reset expiry
                    return [2 /*return*/, attempts];
            }
        });
    });
}
function getOTPAttempts(email_1) {
    return __awaiter(this, arguments, void 0, function (email, type) {
        var key, attempts;
        if (type === void 0) { type = "registration"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    key = "otp:".concat(type, ":").concat(email, ":attempts");
                    return [4 /*yield*/, redis_1.redis.get(key)];
                case 1:
                    attempts = _a.sent();
                    return [2 /*return*/, attempts ? Number.parseInt(attempts) : 0];
            }
        });
    });
}
