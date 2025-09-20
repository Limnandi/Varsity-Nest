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
exports.approveProvider = approveProvider;
exports.rejectProvider = rejectProvider;
exports.viewProviderDocuments = viewProviderDocuments;
exports.getDashboardStats = getDashboardStats;
exports.getTopAccommodations = getTopAccommodations;
exports.getRecentActivity = getRecentActivity;
exports.getPendingApprovals = getPendingApprovals;
// Throw error if used in client-side code
if (typeof window !== 'undefined') {
    throw new Error('Admin operations cannot be performed in client-side code. ' +
        'This module should only be imported in server components, API routes, or server actions.');
}
var database_1 = require("./database");
function approveProvider(providerId) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, database_1.query)("UPDATE providers SET \n        is_verified = true,\n        is_active = true\n      WHERE id = $1", [providerId])];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
                case 2:
                    error_1 = _a.sent();
                    console.error("Failed to approve provider:", error_1);
                    return [2 /*return*/, { success: false, error: "Failed to approve provider" }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function rejectProvider(providerId) {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, database_1.query)("UPDATE providers SET \n        is_active = false,\n        rejection_reason = 'Manual rejection by admin'\n      WHERE id = $1", [providerId])];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
                case 2:
                    error_2 = _a.sent();
                    console.error("Failed to reject provider:", error_2);
                    return [2 /*return*/, { success: false, error: "Failed to reject provider" }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function viewProviderDocuments(providerId) {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, database_1.query)("SELECT documents FROM providers WHERE id = $1", [providerId])];
                case 1:
                    result = _b.sent();
                    return [2 /*return*/, ((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.documents) || []];
                case 2:
                    error_3 = _b.sent();
                    console.error("Failed to fetch provider documents:", error_3);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getDashboardStats() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, currentStats, previousStats, current, previous, error_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.all([
                            (0, database_1.query)("SELECT\n        COUNT(*) as totalAccommodations,\n        COUNT(DISTINCT provider_id) as totalProviders,\n        SUM(price) as totalRevenue,\n        SUM(view_count) as totalViews\n      FROM accommodations"),
                            (0, database_1.query)("SELECT\n        COUNT(*) as totalAccommodations,\n        COUNT(DISTINCT provider_id) as totalProviders,\n        SUM(price) as totalRevenue,\n        SUM(view_count) as totalViews\n      FROM accommodations\n      WHERE created_at >= NOW() - INTERVAL '30 days'")
                        ])];
                case 1:
                    _a = _b.sent(), currentStats = _a[0], previousStats = _a[1];
                    current = currentStats.rows[0];
                    previous = previousStats.rows[0];
                    return [2 /*return*/, {
                            totalAccommodations: current.totalAccommodations,
                            totalProviders: current.totalProviders,
                            totalRevenue: current.totalRevenue,
                            totalViews: current.totalViews,
                            accommodationsChange: calculateChange(current.totalAccommodations, previous.totalAccommodations),
                            providersChange: calculateChange(current.totalProviders, previous.totalProviders),
                            revenueChange: calculateChange(current.totalRevenue, previous.totalRevenue),
                            viewsChange: calculateChange(current.totalViews, previous.totalViews)
                        }];
                case 2:
                    error_4 = _b.sent();
                    console.error("Failed to get dashboard stats:", error_4);
                    return [2 /*return*/, {
                            totalAccommodations: 0,
                            totalProviders: 0,
                            totalRevenue: 0,
                            totalViews: 0,
                            accommodationsChange: 0,
                            providersChange: 0,
                            revenueChange: 0,
                            viewsChange: 0
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function calculateChange(current, previous) {
    if (previous === 0)
        return 0;
    return Math.round(((current - previous) / previous) * 100);
}
function getTopAccommodations() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                // Implementation would fetch real top accommodations from database
                return [2 /*return*/, []];
            }
            catch (error) {
                console.error("Failed to get top accommodations:", error);
                return [2 /*return*/, []];
            }
            return [2 /*return*/];
        });
    });
}
function getRecentActivity() {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, database_1.query)("SELECT id, activity_type as type, message, created_at as time\n       FROM admin_activities\n       ORDER BY created_at DESC\n       LIMIT 5")];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.rows.map(function (row) { return (__assign(__assign({}, row), { time: formatTimeAgo(row.time) })); })];
                case 2:
                    error_5 = _a.sent();
                    console.error("Failed to get recent activity:", error_5);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getPendingApprovals() {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, database_1.query)("SELECT\n        p.id,\n        CASE\n          WHEN p.registration_status = 'pending' THEN 'provider'\n          WHEN a.verification_status = 'pending' THEN 'accommodation'\n        END as type,\n        COALESCE(a.title, p.business_name) as title,\n        COALESCE(p.business_name, 'New Registration') as provider,\n        'pending' as status\n       FROM providers p\n       LEFT JOIN accommodations a ON a.provider_id = p.id\n       WHERE p.registration_status = 'pending' OR a.verification_status = 'pending'")];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.rows];
                case 2:
                    error_6 = _a.sent();
                    console.error("Failed to get pending approvals:", error_6);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function formatTimeAgo(dateString) {
    var date = new Date(dateString);
    var now = new Date();
    var diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60)
        return "".concat(diffInSeconds, " seconds ago");
    if (diffInSeconds < 3600)
        return "".concat(Math.floor(diffInSeconds / 60), " minutes ago");
    if (diffInSeconds < 86400)
        return "".concat(Math.floor(diffInSeconds / 3600), " hours ago");
    return "".concat(Math.floor(diffInSeconds / 86400), " days ago");
}
