"use server";
"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.getPlatformSettings = getPlatformSettings;
exports.updateProductionMode = updateProductionMode;
var database_1 = require("../../lib/database");
var cache_1 = require("next/cache");
var zod_1 = require("zod");
var session_1 = require("@/lib/session");
var SETTINGS_KEY = "platform_settings";
var SettingsSchema = zod_1.z.object({
    production_mode: zod_1.z.boolean(),
    registration_enabled: zod_1.z.boolean(),
    reviews_enabled: zod_1.z.boolean(),
});
function getPlatformSettings() {
    return __awaiter(this, void 0, void 0, function () {
        var data, settings, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, database_1.query)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      SELECT value FROM admin_settings WHERE key = ", "\n    "], ["\n      SELECT value FROM admin_settings WHERE key = ", "\n    "])), SETTINGS_KEY)];
                case 1:
                    data = _a.sent();
                    if (data.length === 0) {
                        throw new Error("Platform settings not found. Please run the seed script.");
                    }
                    settings = SettingsSchema.parse(data[0].value);
                    return [2 /*return*/, settings];
                case 2:
                    error_1 = _a.sent();
                    console.error("Failed to fetch platform settings:", error_1);
                    return [2 /*return*/, {
                            production_mode: true,
                            registration_enabled: false,
                            reviews_enabled: false,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function updateProductionMode(isProduction) {
    return __awaiter(this, void 0, void 0, function () {
        var session, currentSettings, newSettings, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, session_1.getSession)()];
                case 1:
                    session = _a.sent();
                    if ((session === null || session === void 0 ? void 0 : session.role) !== "admin") {
                        return [2 /*return*/, { success: false, message: "Unauthorized" }];
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, getPlatformSettings()];
                case 3:
                    currentSettings = _a.sent();
                    newSettings = __assign(__assign({}, currentSettings), { production_mode: isProduction });
                    return [4 /*yield*/, (0, database_1.query)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      UPDATE admin_settings\n      SET value = ", "::jsonb\n      WHERE key = ", "\n    "], ["\n      UPDATE admin_settings\n      SET value = ", "::jsonb\n      WHERE key = ", "\n    "])), JSON.stringify(newSettings), SETTINGS_KEY)];
                case 4:
                    _a.sent();
                    (0, cache_1.revalidatePath)("/admin/dashboard");
                    return [2 /*return*/, { success: true, message: "Production mode set to ".concat(isProduction ? "ON" : "OFF", ".") }];
                case 5:
                    error_2 = _a.sent();
                    console.error("Failed to update production mode:", error_2);
                    return [2 /*return*/, { success: false, message: "Failed to update settings." }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
var templateObject_1, templateObject_2;
