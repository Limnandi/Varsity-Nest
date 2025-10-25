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
exports.sendVerificationEmailViaStack = sendVerificationEmailViaStack;
var stack_1 = require("@/lib/stack");
function sendVerificationEmailViaStack(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var app, user_1, contactChannels, emailChannel, appUrl, callbackUrl, response, errorData, error_1, app, user, fallbackError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 14]);
                    app = (0, stack_1.getStackServerApp)();
                    return [4 /*yield*/, app.getUser(userId)];
                case 1:
                    user_1 = _a.sent();
                    if (!user_1) {
                        return [2 /*return*/, { success: false, message: 'User not found' }];
                    }
                    return [4 /*yield*/, user_1.listContactChannels()];
                case 2:
                    contactChannels = _a.sent();
                    emailChannel = contactChannels.find(function (channel) {
                        return channel.type === 'email' && channel.value === user_1.primaryEmail;
                    });
                    if (!emailChannel) {
                        return [2 /*return*/, { success: false, message: 'Email contact channel not found' }];
                    }
                    appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.varsitynest.space';
                    callbackUrl = "".concat(appUrl, "/auth/verify-email?userId=").concat(userId);
                    return [4 /*yield*/, fetch("https://api.stack-auth.com/api/v1/contact-channels/".concat(userId, "/").concat(emailChannel.id, "/send-verification-code"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-stack-access-type': 'server',
                                'x-stack-project-id': process.env.STACK_PROJECT_ID,
                                'x-stack-secret-server-key': process.env.STACK_SECRET_SERVER_KEY,
                            },
                            body: JSON.stringify({
                                callback_url: callbackUrl
                            })
                        })];
                case 3:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 6];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 4:
                    errorData = _a.sent();
                    console.error('Stack Auth verification email failed:', errorData);
                    return [4 /*yield*/, sendCustomVerificationEmail(userId, user_1.primaryEmail || '')];
                case 5: 
                // Fallback to custom email with Stack Auth's sendEmail method
                return [2 /*return*/, _a.sent()];
                case 6: return [2 /*return*/, { success: true }];
                case 7:
                    error_1 = _a.sent();
                    console.error('Stack Auth verification email error:', error_1);
                    _a.label = 8;
                case 8:
                    _a.trys.push([8, 12, , 13]);
                    app = (0, stack_1.getStackServerApp)();
                    return [4 /*yield*/, app.getUser(userId)];
                case 9:
                    user = _a.sent();
                    if (!(user === null || user === void 0 ? void 0 : user.primaryEmail)) return [3 /*break*/, 11];
                    return [4 /*yield*/, sendCustomVerificationEmail(userId, user.primaryEmail)];
                case 10: return [2 /*return*/, _a.sent()];
                case 11: return [3 /*break*/, 13];
                case 12:
                    fallbackError_1 = _a.sent();
                    console.error('Fallback email also failed:', fallbackError_1);
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/, { success: false, message: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Failed to send verification email' }];
                case 14: return [2 /*return*/];
            }
        });
    });
}
function sendCustomVerificationEmail(userId, _email) {
    return __awaiter(this, void 0, void 0, function () {
        var app, appUrl, verificationLink, result, err, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    app = (0, stack_1.getStackServerApp)();
                    appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.varsitynest.space';
                    verificationLink = "".concat(appUrl, "/auth/verify-email?userId=").concat(userId, "&token=stack-auth-verification");
                    return [4 /*yield*/, app.sendEmail({
                            userIds: [userId],
                            subject: 'Verify your Varsity Nest account',
                            html: "\n        <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n          <div style=\"background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 24px; color: #fff;\">\n            <h1 style=\"margin: 0; font-size: 20px;\">Varsity Nest</h1>\n          </div>\n          <div style=\"padding: 24px; background: #ffffff; color: #0f172a;\">\n            <h2 style=\"margin: 0 0 12px 0; font-size: 18px;\">Verify your email</h2>\n            <p style=\"margin: 0 0 16px 0; line-height: 1.5;\">To complete your registration, please verify your email:</p>\n            <p style=\"margin: 0 0 16px 0; line-height: 1.5;\">\n              <a href=\"".concat(verificationLink, "\" style=\"display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;\">\n                Verify Email\n              </a>\n            </p>\n            <p style=\"margin: 0 0 8px 0; font-size: 12px; color: #475569;\">If you didn't request this, you can safely ignore this email.</p>\n          </div>\n          <div style=\"padding: 16px 24px; background: #f8fafc; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;\">\n            \u00A9 Varsity Nest\n          </div>\n        </div>\n      "),
                        })];
                case 1:
                    result = _a.sent();
                    if (result.status === 'error') {
                        err = result.error || {};
                        return [2 /*return*/, { success: false, code: err.code, message: err.message || 'Failed to send verification email' }];
                    }
                    return [2 /*return*/, { success: true }];
                case 2:
                    error_2 = _a.sent();
                    return [2 /*return*/, { success: false, message: (error_2 === null || error_2 === void 0 ? void 0 : error_2.message) || 'Failed to send verification email' }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
