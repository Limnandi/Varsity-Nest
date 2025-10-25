"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.FileSecurityService = void 0;
var file_validation_1 = require("./file-validation");
var config_1 = require("@/lib/logging/config");
var database_secure_1 = require("@/lib/database-secure");
var drizzle_orm_1 = require("drizzle-orm");
var schema = __importStar(require("@/lib/schema"));
var FileSecurityService = /** @class */ (function () {
    function FileSecurityService() {
    }
    /**
     * Comprehensive file security validation
     */
    FileSecurityService.validateFileSecurity = function (file, config, userId, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function () {
            var errors, warnings, threats, extension, contentInfo, _a, width, height, riskScore, shouldQuarantine, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        errors = [];
                        warnings = [];
                        threats = [];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        // 1. Basic file validation
                        if (!file || file.size === 0) {
                            errors.push("Empty or invalid file");
                            return [2 /*return*/, { isValid: false, errors: errors, warnings: warnings, riskScore: 100, threats: ["Empty file"], shouldQuarantine: false }];
                        }
                        // 2. File size validation
                        if (file.size > config.maxFileSize) {
                            errors.push("File size ".concat((file.size / 1024 / 1024).toFixed(2), "MB exceeds maximum allowed ").concat((config.maxFileSize / 1024 / 1024).toFixed(2), "MB"));
                        }
                        // 3. File type validation
                        if (!config.allowedMimeTypes.includes(file.type)) {
                            errors.push("File type ".concat(file.type, " is not allowed"));
                        }
                        extension = file_validation_1.FileValidationService.getFileExtension(file.name);
                        if (!config.allowedExtensions.includes(extension)) {
                            errors.push("File extension ".concat(extension, " is not allowed"));
                        }
                        // 5. Dangerous extension check
                        if (file_validation_1.FileValidationService.isDangerousExtension(file.name)) {
                            errors.push("File extension ".concat(extension, " is potentially dangerous"));
                            threats.push("Dangerous file extension");
                        }
                        return [4 /*yield*/, file_validation_1.FileValidationService.validateFileContent(file)
                            // 7. MIME type vs actual content validation
                        ];
                    case 2:
                        contentInfo = _b.sent();
                        // 7. MIME type vs actual content validation
                        if (file.type !== contentInfo.actualType) {
                            warnings.push("MIME type mismatch: declared ".concat(file.type, ", actual ").concat(contentInfo.actualType));
                            threats.push("MIME type spoofing");
                        }
                        // 8. Executable file check
                        if (contentInfo.isExecutable) {
                            errors.push("File appears to be executable");
                            threats.push("Executable file detected");
                        }
                        // 9. Malicious content check
                        if (contentInfo.hasMaliciousContent) {
                            errors.push("File contains potentially malicious content");
                            threats.push("Malicious content detected");
                        }
                        // 10. Image-specific validation
                        if (contentInfo.isImage && config.allowedMimeTypes.some(function (type) { return type.startsWith('image/'); })) {
                            if (!contentInfo.dimensions) {
                                warnings.push("Could not determine image dimensions");
                            }
                            else {
                                _a = contentInfo.dimensions, width = _a.width, height = _a.height;
                                if (width > 10000 || height > 10000) {
                                    warnings.push("Image dimensions are unusually large");
                                    threats.push("Oversized image");
                                }
                            }
                        }
                        riskScore = file_validation_1.FileValidationService.calculateRiskScore(file, contentInfo);
                        shouldQuarantine = riskScore > 70 || threats.length > 0 || contentInfo.isExecutable;
                        // 13. Log security event
                        return [4 /*yield*/, this.logSecurityEvent(file, userId, ipAddress, userAgent, {
                                riskScore: riskScore,
                                threats: threats,
                                contentInfo: contentInfo,
                                isValid: errors.length === 0,
                                shouldQuarantine: shouldQuarantine
                            })];
                    case 3:
                        // 13. Log security event
                        _b.sent();
                        return [2 /*return*/, {
                                isValid: errors.length === 0,
                                errors: errors,
                                warnings: warnings,
                                riskScore: riskScore,
                                threats: threats,
                                shouldQuarantine: shouldQuarantine
                            }];
                    case 4:
                        error_1 = _b.sent();
                        (0, config_1.captureException)(error_1 instanceof Error ? error_1 : new Error(String(error_1)), { component: 'file-security', fileName: file.name, fileSize: file.size, userId: userId });
                        errors.push("File validation failed due to internal error");
                        return [2 /*return*/, { isValid: false, errors: errors, warnings: warnings, riskScore: 100, threats: ["Validation error"], shouldQuarantine: true }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Quarantine suspicious file
     */
    FileSecurityService.quarantineFile = function (file, userId, reason, riskScore, threats) {
        return __awaiter(this, void 0, void 0, function () {
            var quarantinedFileName, expiresAt, quarantineData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        quarantinedFileName = "quarantine_".concat(Date.now(), "_").concat(file.name);
                        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                        ;
                        quarantineData = {
                            originalFileName: file.name,
                            quarantinedFileName: quarantinedFileName,
                            reason: reason,
                            riskScore: riskScore,
                            threats: threats,
                            userId: userId,
                            expiresAt: expiresAt,
                            status: 'quarantined'
                        };
                        // Insert quarantine record
                        return [4 /*yield*/, database_secure_1.secureDb.db
                                .insert(schema.fileQuarantines)
                                .values(quarantineData)
                            // Log quarantine event
                        ];
                    case 1:
                        // Insert quarantine record
                        _a.sent();
                        // Log quarantine event
                        return [4 /*yield*/, this.logSecurityEvent(file, userId, 'unknown', 'unknown', {
                                riskScore: riskScore,
                                threats: threats,
                                contentInfo: { isExecutable: false, hasMaliciousContent: false },
                                isValid: false,
                                shouldQuarantine: true,
                                action: 'quarantined'
                            })];
                    case 2:
                        // Log quarantine event
                        _a.sent();
                        return [2 /*return*/, quarantinedFileName];
                    case 3:
                        error_2 = _a.sent();
                        (0, config_1.captureException)(error_2 instanceof Error ? error_2 : new Error(String(error_2)), { component: 'file-security', fileName: file.name, userId: userId, reason: reason });
                        throw new Error('Failed to quarantine file');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Scan file for viruses (placeholder for actual virus scanning)
     */
    FileSecurityService.scanForViruses = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var contentInfo, threats, isClean, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, file_validation_1.FileValidationService.validateFileContent(file)];
                    case 1:
                        contentInfo = _a.sent();
                        threats = [];
                        isClean = true;
                        if (contentInfo.isExecutable) {
                            threats.push("Executable file detected");
                            isClean = false;
                        }
                        if (contentInfo.hasMaliciousContent) {
                            threats.push("Malicious content detected");
                            isClean = false;
                        }
                        if (file_validation_1.FileValidationService.isDangerousExtension(file.name)) {
                            threats.push("Dangerous file extension");
                            isClean = false;
                        }
                        return [2 /*return*/, {
                                isClean: isClean,
                                threats: threats,
                                scanResult: isClean ? "Clean" : "Threats detected: ".concat(threats.join(', '))
                            }];
                    case 2:
                        error_3 = _a.sent();
                        (0, config_1.captureException)(error_3 instanceof Error ? error_3 : new Error(String(error_3)), { component: 'file-security', fileName: file.name, fileSize: file.size });
                        return [2 /*return*/, {
                                isClean: false,
                                threats: ["Scan failed"],
                                scanResult: "Scan failed due to error"
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Log security event
     */
    FileSecurityService.logSecurityEvent = function (file, userId, ipAddress, userAgent, securityInfo) {
        return __awaiter(this, void 0, void 0, function () {
            var auditData, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        auditData = {
                            userId: userId,
                            fileName: file.name,
                            fileSize: file.size,
                            fileType: file.type,
                            purpose: 'accommodation', // This should be passed as parameter
                            status: securityInfo.shouldQuarantine ? 'quarantined' : (securityInfo.isValid ? 'uploaded' : 'rejected'),
                            reason: securityInfo.threats.join(', ') || (securityInfo.isValid ? 'File uploaded successfully' : 'File validation failed'),
                            securityChecks: {
                                riskScore: securityInfo.riskScore,
                                threats: securityInfo.threats,
                                isSuspicious: securityInfo.riskScore > 50
                            },
                            ipAddress: ipAddress,
                            userAgent: userAgent
                        };
                        // Insert audit log into database
                        return [4 /*yield*/, database_secure_1.secureDb.db
                                .insert(schema.fileUploadAudits)
                                .values(auditData)
                            // Log to Sentry for high-risk files
                        ];
                    case 1:
                        // Insert audit log into database
                        _a.sent();
                        // Log to Sentry for high-risk files
                        if (securityInfo.riskScore > 70) {
                            (0, config_1.captureMessage)('High-risk file upload attempt', { level: 'warning', component: 'file-security', fileName: file.name, fileSize: file.size, riskScore: securityInfo.riskScore, threats: securityInfo.threats, userId: userId, ipAddress: ipAddress });
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        (0, config_1.captureException)(error_4 instanceof Error ? error_4 : new Error(String(error_4)), { component: 'file-security', fileName: file.name, userId: userId });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get file upload statistics for user
     */
    FileSecurityService.getUserFileStats = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, days) {
            var startDate, audits, totalUploads, successfulUploads, rejectedUploads, quarantinedFiles, totalSize, averageRiskScore, error_5;
            if (days === void 0) { days = 30; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        startDate = new Date();
                        startDate.setDate(startDate.getDate() - days);
                        return [4 /*yield*/, database_secure_1.secureDb.db
                                .select()
                                .from(schema.fileUploadAudits)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.fileUploadAudits.userId, userId), (0, drizzle_orm_1.gte)(schema.fileUploadAudits.createdAt, startDate)))];
                    case 1:
                        audits = _a.sent();
                        totalUploads = audits.length;
                        successfulUploads = audits.filter(function (a) { return a.status === 'uploaded'; }).length;
                        rejectedUploads = audits.filter(function (a) { return a.status === 'rejected'; }).length;
                        quarantinedFiles = audits.filter(function (a) { return a.status === 'quarantined'; }).length;
                        totalSize = audits.reduce(function (sum, a) { return sum + a.fileSize; }, 0);
                        averageRiskScore = audits.length > 0
                            ? audits.reduce(function (sum, a) { return sum + a.securityChecks.riskScore; }, 0) / audits.length
                            : 0;
                        return [2 /*return*/, {
                                totalUploads: totalUploads,
                                successfulUploads: successfulUploads,
                                rejectedUploads: rejectedUploads,
                                quarantinedFiles: quarantinedFiles,
                                totalSize: totalSize,
                                averageRiskScore: averageRiskScore
                            }];
                    case 2:
                        error_5 = _a.sent();
                        (0, config_1.captureException)(error_5 instanceof Error ? error_5 : new Error(String(error_5)), { component: 'file-security', userId: userId, days: days });
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clean up expired quarantined files
     */
    FileSecurityService.cleanupExpiredQuarantinedFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, expiredFiles, cleaned, errors, _i, expiredFiles_1, file, error_6, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        now = new Date();
                        return [4 /*yield*/, database_secure_1.secureDb.db
                                .select()
                                .from(schema.fileQuarantines)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.fileQuarantines.status, 'quarantined'), (0, drizzle_orm_1.lte)(schema.fileQuarantines.expiresAt, now)))];
                    case 1:
                        expiredFiles = _a.sent();
                        cleaned = 0;
                        errors = 0;
                        _i = 0, expiredFiles_1 = expiredFiles;
                        _a.label = 2;
                    case 2:
                        if (!(_i < expiredFiles_1.length)) return [3 /*break*/, 7];
                        file = expiredFiles_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, database_secure_1.secureDb.db
                                .update(schema.fileQuarantines)
                                .set({ status: 'deleted' })
                                .where((0, drizzle_orm_1.eq)(schema.fileQuarantines.id, file.id))];
                    case 4:
                        _a.sent();
                        cleaned++;
                        return [3 /*break*/, 6];
                    case 5:
                        error_6 = _a.sent();
                        console.error("Failed to delete quarantined file ".concat(file.id, ":"), error_6);
                        errors++;
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, { cleaned: cleaned, errors: errors }];
                    case 8:
                        error_7 = _a.sent();
                        (0, config_1.captureException)(error_7 instanceof Error ? error_7 : new Error(String(error_7)), { component: 'file-security' });
                        throw error_7;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return FileSecurityService;
}());
exports.FileSecurityService = FileSecurityService;
