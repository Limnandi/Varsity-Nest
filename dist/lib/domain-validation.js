"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
exports.DomainValidationService = void 0;
var database_1 = require("./database");
var DomainValidationService = /** @class */ (function () {
    function DomainValidationService() {
    }
    /**
     * Check if an email domain is whitelisted for student registration
     */
    DomainValidationService.isEmailWhitelisted = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var emailDomain, result, row, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        emailDomain = email.substring(email.indexOf("@"));
                        if (!emailDomain || emailDomain === "@") {
                            return [2 /*return*/, { isValid: false, error: "Invalid email format" }];
                        }
                        return [4 /*yield*/, (0, database_1.query)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT university FROM whitelisted_domains WHERE domain = ", " AND is_active = true LIMIT 1"], ["SELECT university FROM whitelisted_domains WHERE domain = ", " AND is_active = true LIMIT 1"])), emailDomain)];
                    case 1:
                        result = _b.sent();
                        row = (_a = result.rows) === null || _a === void 0 ? void 0 : _a[0];
                        if (row) {
                            return [2 /*return*/, {
                                    isValid: true,
                                    university: row.university
                                }];
                        }
                        return [2 /*return*/, {
                                isValid: false,
                                error: "Email domain not whitelisted for student registration"
                            }];
                    case 2:
                        error_1 = _b.sent();
                        console.error("Domain validation error:", error_1);
                        return [2 /*return*/, {
                                isValid: false,
                                error: "Failed to validate email domain"
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all active whitelisted domains
     */
    DomainValidationService.getActiveWhitelistedDomains = function () {
        return __awaiter(this, void 0, void 0, function () {
            var rows, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, database_1.query)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["SELECT domain FROM whitelisted_domains WHERE is_active = true ORDER BY domain ASC"], ["SELECT domain FROM whitelisted_domains WHERE is_active = true ORDER BY domain ASC"])))];
                    case 1:
                        rows = _a.sent();
                        return [2 /*return*/, rows.rows.map(function (row) { return row.domain; })];
                    case 2:
                        error_2 = _a.sent();
                        console.error("Error fetching whitelisted domains:", error_2);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get domain statistics
     */
    DomainValidationService.getDomainStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, total, active, inactive, error_3;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.all([
                                (function () { return __awaiter(_this, void 0, void 0, function () { var _a, _b; return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            _b = (_a = Number).parseInt;
                                            return [4 /*yield*/, (0, database_1.query)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["SELECT COUNT(*) AS c FROM whitelisted_domains"], ["SELECT COUNT(*) AS c FROM whitelisted_domains"])))];
                                        case 1: return [2 /*return*/, _b.apply(_a, [(_c.sent()).rows[0].c])];
                                    }
                                }); }); })(),
                                (function () { return __awaiter(_this, void 0, void 0, function () { var _a, _b; return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            _b = (_a = Number).parseInt;
                                            return [4 /*yield*/, (0, database_1.query)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["SELECT COUNT(*) AS c FROM whitelisted_domains WHERE is_active = true"], ["SELECT COUNT(*) AS c FROM whitelisted_domains WHERE is_active = true"])))];
                                        case 1: return [2 /*return*/, _b.apply(_a, [(_c.sent()).rows[0].c])];
                                    }
                                }); }); })(),
                                (function () { return __awaiter(_this, void 0, void 0, function () { var _a, _b; return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            _b = (_a = Number).parseInt;
                                            return [4 /*yield*/, (0, database_1.query)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["SELECT COUNT(*) AS c FROM whitelisted_domains WHERE is_active = false"], ["SELECT COUNT(*) AS c FROM whitelisted_domains WHERE is_active = false"])))];
                                        case 1: return [2 /*return*/, _b.apply(_a, [(_c.sent()).rows[0].c])];
                                    }
                                }); }); })(),
                            ])];
                    case 1:
                        _a = _b.sent(), total = _a[0], active = _a[1], inactive = _a[2];
                        return [2 /*return*/, {
                                total: total,
                                active: active,
                                inactive: inactive
                            }];
                    case 2:
                        error_3 = _b.sent();
                        console.error("Error fetching domain stats:", error_3);
                        return [2 /*return*/, { total: 0, active: 0, inactive: 0 }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return DomainValidationService;
}());
exports.DomainValidationService = DomainValidationService;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
