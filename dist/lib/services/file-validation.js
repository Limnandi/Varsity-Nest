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
exports.FileValidationService = void 0;
var file_upload_1 = require("@/lib/schemas/file-upload");
var config_1 = require("@/lib/logging/config");
var FileValidationService = /** @class */ (function () {
    function FileValidationService() {
    }
    /**
     * Validate file content by reading file headers
     */
    FileValidationService.validateFileContent = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var buffer, uint8Array, actualType, isImage, isDocument, isExecutable, hasMaliciousContent, dimensions, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, file.arrayBuffer()];
                    case 1:
                        buffer = _a.sent();
                        uint8Array = new Uint8Array(buffer);
                        actualType = this.getActualFileType(uint8Array);
                        isImage = this.isImageFile(actualType, uint8Array);
                        isDocument = this.isDocumentFile(actualType);
                        isExecutable = this.isExecutableFile(actualType, uint8Array);
                        hasMaliciousContent = this.hasMaliciousContent(uint8Array);
                        dimensions = void 0;
                        if (!isImage) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.getImageDimensions(uint8Array)];
                    case 2:
                        dimensions = _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, {
                            actualType: actualType,
                            isImage: isImage,
                            isDocument: isDocument,
                            dimensions: dimensions,
                            isExecutable: isExecutable,
                            hasMaliciousContent: hasMaliciousContent
                        }];
                    case 4:
                        err_1 = _a.sent();
                        (0, config_1.captureException)(err_1 instanceof Error ? err_1 : new Error(String(err_1)), { component: 'file-validation', fileName: file.name, fileSize: file.size });
                        throw new Error('File validation failed');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get actual file type from file headers
     */
    FileValidationService.getActualFileType = function (uint8Array) {
        var header = uint8Array.slice(0, 16);
        // Check magic numbers for common file types
        if (this.startsWith(header, [0xFF, 0xD8, 0xFF]))
            return 'image/jpeg';
        if (this.startsWith(header, [0x89, 0x50, 0x4E, 0x47]))
            return 'image/png';
        if (this.startsWith(header, [0x47, 0x49, 0x46, 0x38]))
            return 'image/gif';
        if (this.startsWith(header, [0x52, 0x49, 0x46, 0x46]))
            return 'image/webp';
        if (this.startsWith(header, [0x25, 0x50, 0x44, 0x46]))
            return 'application/pdf';
        if (this.startsWith(header, [0x4D, 0x5A]))
            return 'application/x-msdownload'; // EXE
        if (this.startsWith(header, [0x50, 0x4B, 0x03, 0x04]))
            return 'application/zip';
        if (this.startsWith(header, [0x7F, 0x45, 0x4C, 0x46]))
            return 'application/x-executable'; // ELF
        return 'application/octet-stream';
    };
    /**
     * Check if file is an image based on type and content
     */
    FileValidationService.isImageFile = function (actualType, uint8Array) {
        var imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!imageTypes.includes(actualType))
            return false;
        // Additional validation for images
        if (actualType === 'image/jpeg') {
            return this.isValidJPEG(uint8Array);
        }
        if (actualType === 'image/png') {
            return this.isValidPNG(uint8Array);
        }
        if (actualType === 'image/gif') {
            return this.isValidGIF(uint8Array);
        }
        if (actualType === 'image/webp') {
            return this.isValidWebP(uint8Array);
        }
        return true;
    };
    /**
     * Check if file is a document
     */
    FileValidationService.isDocumentFile = function (actualType) {
        var documentTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        return documentTypes.includes(actualType);
    };
    /**
     * Check if file is executable
     */
    FileValidationService.isExecutableFile = function (actualType, uint8Array) {
        var executableTypes = [
            'application/x-msdownload',
            'application/x-executable',
            'application/x-sharedlib',
            'application/x-elf'
        ];
        if (executableTypes.includes(actualType))
            return true;
        // Check for shebang
        var text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array.slice(0, 100));
        return text.startsWith('#!');
    };
    /**
     * Check for malicious content patterns
     */
    FileValidationService.hasMaliciousContent = function (uint8Array) {
        var text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
        return file_upload_1.SUSPICIOUS_PATTERNS.some(function (pattern) { return pattern.test(text); });
    };
    /**
     * Get image dimensions
     */
    FileValidationService.getImageDimensions = function (uint8Array) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    // For JPEG
                    if (this.startsWith(uint8Array.slice(0, 3), [0xFF, 0xD8, 0xFF])) {
                        return [2 /*return*/, this.getJPEGDimensions(uint8Array)];
                    }
                    // For PNG
                    if (this.startsWith(uint8Array.slice(0, 8), [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
                        return [2 /*return*/, this.getPNGDimensions(uint8Array)];
                    }
                    // For GIF
                    if (this.startsWith(uint8Array.slice(0, 6), [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
                        this.startsWith(uint8Array.slice(0, 6), [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) {
                        return [2 /*return*/, this.getGIFDimensions(uint8Array)];
                    }
                    return [2 /*return*/, undefined];
                }
                catch (error) {
                    console.warn('Failed to get image dimensions:', error);
                    return [2 /*return*/, undefined];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get JPEG dimensions
     */
    FileValidationService.getJPEGDimensions = function (uint8Array) {
        var i = 2;
        while (i < uint8Array.length - 1) {
            if (uint8Array[i] === 0xFF && uint8Array[i + 1] === 0xC0) {
                var height = (uint8Array[i + 5] << 8) | uint8Array[i + 6];
                var width = (uint8Array[i + 7] << 8) | uint8Array[i + 8];
                return { width: width, height: height };
            }
            i++;
        }
        return undefined;
    };
    /**
     * Get PNG dimensions
     */
    FileValidationService.getPNGDimensions = function (uint8Array) {
        if (uint8Array.length < 24)
            return undefined;
        var width = (uint8Array[16] << 24) | (uint8Array[17] << 16) | (uint8Array[18] << 8) | uint8Array[19];
        var height = (uint8Array[20] << 24) | (uint8Array[21] << 16) | (uint8Array[22] << 8) | uint8Array[23];
        return { width: width, height: height };
    };
    /**
     * Get GIF dimensions
     */
    FileValidationService.getGIFDimensions = function (uint8Array) {
        if (uint8Array.length < 10)
            return undefined;
        var width = uint8Array[6] | (uint8Array[7] << 8);
        var height = uint8Array[8] | (uint8Array[9] << 8);
        return { width: width, height: height };
    };
    /**
     * Validate JPEG file
     */
    FileValidationService.isValidJPEG = function (uint8Array) {
        if (!this.startsWith(uint8Array.slice(0, 3), [0xFF, 0xD8, 0xFF]))
            return false;
        if (!this.startsWith(uint8Array.slice(-2), [0xFF, 0xD9]))
            return false;
        return true;
    };
    /**
     * Validate PNG file
     */
    FileValidationService.isValidPNG = function (uint8Array) {
        var pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        return this.startsWith(uint8Array.slice(0, 8), pngSignature);
    };
    /**
     * Validate GIF file
     */
    FileValidationService.isValidGIF = function (uint8Array) {
        var gif87a = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61];
        var gif89a = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
        return this.startsWith(uint8Array.slice(0, 6), gif87a) ||
            this.startsWith(uint8Array.slice(0, 6), gif89a);
    };
    /**
     * Validate WebP file
     */
    FileValidationService.isValidWebP = function (uint8Array) {
        if (!this.startsWith(uint8Array.slice(0, 4), [0x52, 0x49, 0x46, 0x46]))
            return false;
        if (!this.startsWith(uint8Array.slice(8, 12), [0x57, 0x45, 0x42, 0x50]))
            return false;
        return true;
    };
    /**
     * Check if array starts with specific bytes
     */
    FileValidationService.startsWith = function (array, pattern) {
        if (array.length < pattern.length)
            return false;
        return pattern.every(function (byte, index) { return array[index] === byte; });
    };
    /**
     * Get file extension from filename
     */
    FileValidationService.getFileExtension = function (filename) {
        var lastDot = filename.lastIndexOf('.');
        return lastDot === -1 ? '' : filename.toLowerCase().substring(lastDot);
    };
    /**
     * Check if file extension is dangerous
     */
    FileValidationService.isDangerousExtension = function (filename) {
        var extension = this.getFileExtension(filename);
        return file_upload_1.DANGEROUS_EXTENSIONS.includes(extension);
    };
    /**
     * Calculate file risk score
     */
    FileValidationService.calculateRiskScore = function (file, contentInfo) {
        var riskScore = 0;
        // Base risk from file type
        if (contentInfo.isExecutable)
            riskScore += 50;
        if (contentInfo.hasMaliciousContent)
            riskScore += 40;
        if (this.isDangerousExtension(file.name))
            riskScore += 30;
        // Risk from file size (unusually large files)
        if (file.size > 50 * 1024 * 1024)
            riskScore += 20; // > 50MB
        if (file.size > 100 * 1024 * 1024)
            riskScore += 30; // > 100MB
        // Risk from filename patterns
        var suspiciousNames = /\.(exe|bat|cmd|scr|vbs|js|jar|php|asp|jsp)$/i;
        if (suspiciousNames.test(file.name))
            riskScore += 25;
        // Risk from MIME type mismatch
        if (file.type !== contentInfo.actualType)
            riskScore += 15;
        return Math.min(riskScore, 100);
    };
    return FileValidationService;
}());
exports.FileValidationService = FileValidationService;
