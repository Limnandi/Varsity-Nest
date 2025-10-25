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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadMiddleware = void 0;
var file_upload_1 = require("@/lib/schemas/file-upload");
var file_security_1 = require("@/lib/services/file-security");
var file_validation_1 = require("@/lib/services/file-validation");
var config_1 = require("@/lib/logging/config");
var FileUploadMiddleware = /** @class */ (function () {
    function FileUploadMiddleware() {
    }
    /**
     * Process file uploads with comprehensive security validation
     */
    FileUploadMiddleware.processFileUploads = function (request, options) {
        return __awaiter(this, void 0, void 0, function () {
            var errors, warnings, quarantinedFiles, validFiles, formData, files, config, ipAddress, userAgent, userId, _loop_1, _i, files_1, file, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        errors = [];
                        warnings = [];
                        quarantinedFiles = [];
                        validFiles = [];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, request.formData()
                            // Get files based on purpose
                        ];
                    case 2:
                        formData = _c.sent();
                        files = [];
                        if (options.purpose === 'accommodation') {
                            files = formData.getAll('images');
                        }
                        else if (options.purpose === 'document' || options.purpose === 'accreditation') {
                            files = formData.getAll('documents');
                        }
                        else if (options.purpose === 'profile') {
                            files = formData.getAll('profileImage');
                        }
                        // Filter out empty files
                        files = files.filter(function (file) { return file && file.size > 0; });
                        if (files.length === 0) {
                            return [2 /*return*/, { files: [], errors: ['No files provided'], warnings: [], quarantinedFiles: [] }];
                        }
                        config = this.getUploadConfig(options);
                        // Validate file count
                        if (files.length > config.maxFiles) {
                            errors.push("Maximum ".concat(config.maxFiles, " files allowed, received ").concat(files.length));
                            return [2 /*return*/, { files: [], errors: errors, warnings: warnings, quarantinedFiles: [] }];
                        }
                        ipAddress = ((_b = (_a = request.headers.get('x-forwarded-for')) === null || _a === void 0 ? void 0 : _a.split(',')[0]) === null || _b === void 0 ? void 0 : _b.trim()) ||
                            request.headers.get('x-real-ip') ||
                            'unknown';
                        userAgent = request.headers.get('user-agent') || 'unknown';
                        userId = 'unknown' // This should be extracted from session
                        ;
                        _loop_1 = function (file) {
                            var securityResult, quarantinedName, fileError_1;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        _d.trys.push([0, 4, , 5]);
                                        // Files are already filtered for size > 0, but double-check
                                        if (!file || file.size === 0) {
                                            errors.push("Empty or invalid file: ".concat(file.name));
                                            return [2 /*return*/, "continue"];
                                        }
                                        return [4 /*yield*/, file_security_1.FileSecurityService.validateFileSecurity(file, config, userId, ipAddress, userAgent)];
                                    case 1:
                                        securityResult = _d.sent();
                                        if (!securityResult.isValid) {
                                            errors.push.apply(errors, securityResult.errors.map(function (error) { return "".concat(file.name, ": ").concat(error); }));
                                            return [2 /*return*/, "continue"];
                                        }
                                        // Add warnings
                                        warnings.push.apply(warnings, securityResult.warnings.map(function (warning) { return "".concat(file.name, ": ").concat(warning); }));
                                        if (!securityResult.shouldQuarantine) return [3 /*break*/, 3];
                                        return [4 /*yield*/, file_security_1.FileSecurityService.quarantineFile(file, userId, securityResult.threats.join(', '), securityResult.riskScore, securityResult.threats)];
                                    case 2:
                                        quarantinedName = _d.sent();
                                        quarantinedFiles.push(quarantinedName);
                                        errors.push("".concat(file.name, ": File quarantined due to security concerns"));
                                        return [2 /*return*/, "continue"];
                                    case 3:
                                        // File passed all security checks
                                        validFiles.push(file);
                                        return [3 /*break*/, 5];
                                    case 4:
                                        fileError_1 = _d.sent();
                                        (0, config_1.captureException)(fileError_1 instanceof Error ? fileError_1 : new Error(String(fileError_1)), { component: 'file-upload-middleware', fileName: file === null || file === void 0 ? void 0 : file.name, fileSize: file === null || file === void 0 ? void 0 : file.size });
                                        errors.push("".concat(file.name, ": File processing failed"));
                                        return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, files_1 = files;
                        _c.label = 3;
                    case 3:
                        if (!(_i < files_1.length)) return [3 /*break*/, 6];
                        file = files_1[_i];
                        return [5 /*yield**/, _loop_1(file)];
                    case 4:
                        _c.sent();
                        _c.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [2 /*return*/, {
                            files: validFiles,
                            errors: errors,
                            warnings: warnings,
                            quarantinedFiles: quarantinedFiles
                        }];
                    case 7:
                        error_1 = _c.sent();
                        (0, config_1.captureException)(error_1 instanceof Error ? error_1 : new Error(String(error_1)), { component: 'file-upload-middleware' });
                        return [2 /*return*/, {
                                files: [],
                                errors: ['File upload processing failed'],
                                warnings: [],
                                quarantinedFiles: []
                            }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get upload configuration based on purpose
     */
    FileUploadMiddleware.getUploadConfig = function (options) {
        var baseConfig = file_upload_1.FILE_UPLOAD_LIMITS[options.purpose.toUpperCase()];
        return __assign({ maxFileSize: baseConfig.maxSize, maxFiles: options.maxFiles || baseConfig.maxFiles, allowedMimeTypes: __spreadArray([], baseConfig.allowedTypes, true), allowedExtensions: __spreadArray([], baseConfig.allowedExtensions, true), scanForViruses: true, validateContent: true, generateThumbnails: options.purpose === 'accommodation', compressImages: true, folder: "varsity-nest/".concat(options.purpose) }, options.customConfig);
    };
    /**
     * Validate single file with security checks
     */
    FileUploadMiddleware.validateSingleFile = function (file, purpose, userId, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function () {
            var config, securityResult, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        config = this.getUploadConfig({ purpose: purpose });
                        return [4 /*yield*/, file_security_1.FileSecurityService.validateFileSecurity(file, config, userId, ipAddress, userAgent)];
                    case 1:
                        securityResult = _a.sent();
                        return [2 /*return*/, {
                                isValid: securityResult.isValid,
                                errors: securityResult.errors,
                                warnings: securityResult.warnings,
                                shouldQuarantine: securityResult.shouldQuarantine,
                                riskScore: securityResult.riskScore
                            }];
                    case 2:
                        error_2 = _a.sent();
                        (0, config_1.captureException)(error_2, {
                            tags: { component: 'file-upload-middleware' },
                            extra: { fileName: file.name, purpose: purpose, userId: userId }
                        });
                        return [2 /*return*/, {
                                isValid: false,
                                errors: ['File validation failed'],
                                warnings: [],
                                shouldQuarantine: true,
                                riskScore: 100
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Sanitize filename for safe storage
     */
    FileUploadMiddleware.sanitizeFilename = function (filename) {
        // Remove or replace dangerous characters
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace non-alphanumeric chars except . and -
            .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
            .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
            .substring(0, 255); // Limit length
    };
    /**
     * Generate secure filename
     */
    FileUploadMiddleware.generateSecureFilename = function (originalName, userId) {
        var timestamp = Date.now();
        var random = Math.random().toString(36).substring(2, 8);
        var extension = file_validation_1.FileValidationService.getFileExtension(originalName);
        var sanitizedName = this.sanitizeFilename(originalName.replace(extension, ''));
        return "".concat(userId, "_").concat(timestamp, "_").concat(random, "_").concat(sanitizedName).concat(extension);
    };
    /**
     * Check if file type is allowed for purpose
     */
    FileUploadMiddleware.isFileTypeAllowed = function (file, purpose) {
        var config = file_upload_1.FILE_UPLOAD_LIMITS[purpose.toUpperCase()];
        var extension = file_validation_1.FileValidationService.getFileExtension(file.name);
        return config.allowedTypes.includes(file.type) &&
            config.allowedExtensions.includes(extension);
    };
    /**
     * Get file upload limits for purpose
     */
    FileUploadMiddleware.getFileUploadLimits = function (purpose) {
        return file_upload_1.FILE_UPLOAD_LIMITS[purpose.toUpperCase()];
    };
    return FileUploadMiddleware;
}());
exports.FileUploadMiddleware = FileUploadMiddleware;
