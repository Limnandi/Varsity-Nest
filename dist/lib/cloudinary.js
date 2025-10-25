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
exports.cloudinary = void 0;
exports.uploadImageSecurely = uploadImageSecurely;
exports.uploadDocumentSecurely = uploadDocumentSecurely;
exports.uploadImage = uploadImage;
exports.uploadDocument = uploadDocument;
exports.uploadImageFromBase64 = uploadImageFromBase64;
exports.deleteImage = deleteImage;
exports.deleteDocument = deleteDocument;
var cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
var env_1 = require("@/lib/env");
var file_validation_1 = require("@/lib/services/file-validation");
var file_security_1 = require("@/lib/services/file-security");
var file_upload_1 = require("@/lib/middleware/file-upload");
var config_1 = require("@/lib/logging/config");
// Design pattern: Facade
cloudinary_1.v2.config({
    cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.env.CLOUDINARY_API_KEY,
    api_secret: env_1.env.CLOUDINARY_API_SECRET,
});
function uploadImageSecurely(file_1) {
    return __awaiter(this, arguments, void 0, function (file, options) {
        var _a, folder_1, _b, userId_1, _c, purpose_1, _d, generateThumbnails, _e, compressImages_1, _f, maxWidth_1, _g, maxHeight_1, _h, quality_1, securityResult, contentInfo, secureFilename_1, bytes, buffer_1, uploadResult, error_1;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    _j.trys.push([0, 7, , 8]);
                    _a = options.folder, folder_1 = _a === void 0 ? "varsity-nest" : _a, _b = options.userId, userId_1 = _b === void 0 ? "unknown" : _b, _c = options.purpose, purpose_1 = _c === void 0 ? "accommodation" : _c, _d = options.generateThumbnails, generateThumbnails = _d === void 0 ? true : _d, _e = options.compressImages, compressImages_1 = _e === void 0 ? true : _e, _f = options.maxWidth, maxWidth_1 = _f === void 0 ? 1200 : _f, _g = options.maxHeight, maxHeight_1 = _g === void 0 ? 800 : _g, _h = options.quality, quality_1 = _h === void 0 ? "auto" : _h;
                    return [4 /*yield*/, file_security_1.FileSecurityService.validateFileSecurity(file, {
                            maxFileSize: 10 * 1024 * 1024, // 10MB
                            maxFiles: 1,
                            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
                            allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
                            scanForViruses: true,
                            validateContent: true,
                            generateThumbnails: generateThumbnails,
                            compressImages: compressImages_1,
                            folder: folder_1
                        }, userId_1, 'unknown', // IP address should be passed
                        'unknown' // User agent should be passed
                        )];
                case 1:
                    securityResult = _j.sent();
                    if (!securityResult.isValid) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Security validation failed: ".concat(securityResult.errors.join(', ')),
                                warnings: securityResult.warnings
                            }];
                    }
                    if (!securityResult.shouldQuarantine) return [3 /*break*/, 3];
                    return [4 /*yield*/, file_security_1.FileSecurityService.quarantineFile(file, userId_1, securityResult.threats.join(', '), securityResult.riskScore, securityResult.threats)];
                case 2:
                    _j.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: "File quarantined due to security concerns",
                            warnings: securityResult.warnings
                        }];
                case 3: return [4 /*yield*/, file_validation_1.FileValidationService.validateFileContent(file)];
                case 4:
                    contentInfo = _j.sent();
                    if (!contentInfo.isImage) {
                        return [2 /*return*/, {
                                success: false,
                                error: "File is not a valid image",
                                warnings: securityResult.warnings
                            }];
                    }
                    secureFilename_1 = file_upload_1.FileUploadMiddleware.generateSecureFilename(file.name, userId_1);
                    return [4 /*yield*/, file.arrayBuffer()];
                case 5:
                    bytes = _j.sent();
                    buffer_1 = Buffer.from(bytes);
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var transformations = [];
                            if (compressImages_1) {
                                transformations.push({ width: maxWidth_1, height: maxHeight_1, crop: "limit" });
                                transformations.push({ quality: quality_1 });
                                transformations.push({ fetch_format: "auto" });
                            }
                            cloudinary_1.v2.uploader
                                .upload_stream({
                                folder: folder_1,
                                public_id: secureFilename_1,
                                resource_type: "image",
                                use_filename: false,
                                unique_filename: false,
                                overwrite: false,
                                transformation: transformations,
                                // Security tags
                                tags: ["user:".concat(userId_1), "purpose:".concat(purpose_1), 'secure-upload'],
                                // Access control
                                access_mode: "authenticated",
                                // Metadata
                                context: {
                                    original_filename: file.name,
                                    uploaded_by: userId_1,
                                    upload_purpose: purpose_1,
                                    security_validated: "true"
                                }
                            }, function (error, result) {
                                if (error) {
                                    (0, config_1.captureException)(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-upload', fileName: file.name, userId: userId_1, purpose: purpose_1 });
                                    reject(error);
                                }
                                else {
                                    resolve(result);
                                }
                            })
                                .end(buffer_1);
                        })];
                case 6:
                    uploadResult = _j.sent();
                    return [2 /*return*/, {
                            success: true,
                            result: uploadResult,
                            warnings: securityResult.warnings
                        }];
                case 7:
                    error_1 = _j.sent();
                    (0, config_1.captureException)(error_1 instanceof Error ? error_1 : new Error(String(error_1)), { component: 'cloudinary-upload', fileName: file.name, userId: options.userId });
                    return [2 /*return*/, {
                            success: false,
                            error: "Upload failed due to internal error"
                        }];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function uploadDocumentSecurely(file_1) {
    return __awaiter(this, arguments, void 0, function (file, options) {
        var _a, folder_2, _b, userId_2, _c, purpose_2, securityResult, secureFilename_2, bytes, buffer_2, uploadResult, error_2;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 6, , 7]);
                    _a = options.folder, folder_2 = _a === void 0 ? "varsity-nest/documents" : _a, _b = options.userId, userId_2 = _b === void 0 ? "unknown" : _b, _c = options.purpose, purpose_2 = _c === void 0 ? "document" : _c;
                    return [4 /*yield*/, file_security_1.FileSecurityService.validateFileSecurity(file, {
                            maxFileSize: 25 * 1024 * 1024, // 25MB
                            maxFiles: 1,
                            allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
                            allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
                            scanForViruses: true,
                            validateContent: true,
                            generateThumbnails: false,
                            compressImages: false,
                            folder: folder_2
                        }, userId_2, 'unknown', 'unknown')];
                case 1:
                    securityResult = _d.sent();
                    if (!securityResult.isValid) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Security validation failed: ".concat(securityResult.errors.join(', ')),
                                warnings: securityResult.warnings
                            }];
                    }
                    if (!securityResult.shouldQuarantine) return [3 /*break*/, 3];
                    return [4 /*yield*/, file_security_1.FileSecurityService.quarantineFile(file, userId_2, securityResult.threats.join(', '), securityResult.riskScore, securityResult.threats)];
                case 2:
                    _d.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: "File quarantined due to security concerns",
                            warnings: securityResult.warnings
                        }];
                case 3:
                    secureFilename_2 = file_upload_1.FileUploadMiddleware.generateSecureFilename(file.name, userId_2);
                    return [4 /*yield*/, file.arrayBuffer()];
                case 4:
                    bytes = _d.sent();
                    buffer_2 = Buffer.from(bytes);
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            cloudinary_1.v2.uploader
                                .upload_stream({
                                folder: folder_2,
                                public_id: secureFilename_2,
                                resource_type: "raw",
                                use_filename: false,
                                unique_filename: false,
                                overwrite: false,
                                // Security tags
                                tags: ["user:".concat(userId_2), "purpose:".concat(purpose_2), 'secure-document'],
                                // Access control
                                access_mode: "authenticated",
                                // Metadata
                                context: {
                                    original_filename: file.name,
                                    uploaded_by: userId_2,
                                    upload_purpose: purpose_2,
                                    security_validated: "true"
                                }
                            }, function (error, result) {
                                if (error) {
                                    (0, config_1.captureException)(error instanceof Error ? error : new Error(String(error)), { component: 'cloudinary-upload', fileName: file.name, userId: userId_2, purpose: purpose_2 });
                                    reject(error);
                                }
                                else {
                                    resolve(result);
                                }
                            })
                                .end(buffer_2);
                        })];
                case 5:
                    uploadResult = _d.sent();
                    return [2 /*return*/, {
                            success: true,
                            result: uploadResult,
                            warnings: securityResult.warnings
                        }];
                case 6:
                    error_2 = _d.sent();
                    (0, config_1.captureException)(error_2 instanceof Error ? error_2 : new Error(String(error_2)), { component: 'cloudinary-upload', fileName: file.name, userId: options.userId });
                    return [2 /*return*/, {
                            success: false,
                            error: "Document upload failed due to internal error"
                        }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Legacy functions for backward compatibility (now use secure versions)
function uploadImage(file_1) {
    return __awaiter(this, arguments, void 0, function (file, folder) {
        var result;
        if (folder === void 0) { folder = "varsity-nest"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.warn("Using legacy uploadImage function. Consider using uploadImageSecurely for enhanced security.");
                    return [4 /*yield*/, uploadImageSecurely(file, { folder: folder })];
                case 1:
                    result = _a.sent();
                    if (!result.success) {
                        throw new Error(result.error || "Failed to upload image");
                    }
                    return [2 /*return*/, result.result];
            }
        });
    });
}
function uploadDocument(file_1) {
    return __awaiter(this, arguments, void 0, function (file, folder) {
        var result;
        if (folder === void 0) { folder = "varsity-nest/documents"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.warn("Using legacy uploadDocument function. Consider using uploadDocumentSecurely for enhanced security.");
                    return [4 /*yield*/, uploadDocumentSecurely(file, { folder: folder })];
                case 1:
                    result = _a.sent();
                    if (!result.success) {
                        throw new Error(result.error || "Failed to upload document");
                    }
                    return [2 /*return*/, result.result];
            }
        });
    });
}
function uploadImageFromBase64(base64Data_1) {
    return __awaiter(this, arguments, void 0, function (base64Data, options) {
        var _a, folder, public_id, transformation, _b, userId, _c, purpose, uploadResult, error_3;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    _a = options.folder, folder = _a === void 0 ? "varsity-nest" : _a, public_id = options.public_id, transformation = options.transformation, _b = options.userId, userId = _b === void 0 ? "unknown" : _b, _c = options.purpose, purpose = _c === void 0 ? "profile" : _c;
                    return [4 /*yield*/, cloudinary_1.v2.uploader.upload("data:image/jpeg;base64,".concat(base64Data), {
                            folder: folder,
                            public_id: public_id,
                            resource_type: "image",
                            use_filename: false,
                            unique_filename: true,
                            overwrite: true,
                            transformation: transformation || {
                                width: 400,
                                height: 400,
                                crop: "fill",
                                gravity: "face",
                                quality: "auto",
                                format: "auto"
                            },
                            tags: ["user:".concat(userId), "purpose:".concat(purpose), 'profile-image'],
                            context: {
                                uploaded_by: userId,
                                upload_purpose: purpose,
                                source: "base64"
                            }
                        })];
                case 1:
                    uploadResult = _d.sent();
                    return [2 /*return*/, {
                            success: true,
                            result: uploadResult,
                            warnings: []
                        }];
                case 2:
                    error_3 = _d.sent();
                    (0, config_1.captureException)(error_3 instanceof Error ? error_3 : new Error(String(error_3)), { component: 'cloudinary-base64-upload', userId: options.userId });
                    return [2 /*return*/, {
                            success: false,
                            error: "Failed to upload image from base64 data"
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function deleteImage(publicId) {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, cloudinary_1.v2.uploader.destroy(publicId)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result];
                case 2:
                    error_4 = _a.sent();
                    (0, config_1.captureException)(error_4 instanceof Error ? error_4 : new Error(String(error_4)), { component: 'cloudinary-delete', publicId: publicId });
                    throw new Error("Failed to delete image");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function deleteDocument(publicId) {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, cloudinary_1.v2.uploader.destroy(publicId, { resource_type: "raw" })];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result];
                case 2:
                    error_5 = _a.sent();
                    (0, config_1.captureException)(error_5 instanceof Error ? error_5 : new Error(String(error_5)), { component: 'cloudinary-delete', publicId: publicId });
                    throw new Error("Failed to delete document");
                case 3: return [2 /*return*/];
            }
        });
    });
}
