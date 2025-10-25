"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.approveProvider = approveProvider;
exports.rejectProvider = rejectProvider;
exports.viewProviderDocuments = viewProviderDocuments;
exports.getPendingProviders = getPendingProviders;
exports.getAllProviders = getAllProviders;
exports.getCurrentProviders = getCurrentProviders;
exports.deleteProvider = deleteProvider;
exports.getDashboardStats = getDashboardStats;
exports.getTopAccommodations = getTopAccommodations;
exports.getRecentActivity = getRecentActivity;
exports.getPendingApprovals = getPendingApprovals;
// Throw error if used in client-side code
if (typeof window !== 'undefined') {
    throw new Error('Admin operations cannot be performed in client-side code. ' +
        'This module should only be imported in server components, API routes, or server actions.');
}
var database_secure_1 = require("./database-secure");
var drizzle_orm_1 = require("drizzle-orm");
var schema = __importStar(require("./schema"));
function approveProvider(providerId) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, database_secure_1.secureDb.db
                            .update(schema.providers)
                            .set({
                            isVerified: true,
                            isActive: true,
                            registrationStatus: 'approved',
                            updatedAt: new Date()
                        })
                            .where((0, drizzle_orm_1.eq)(schema.providers.id, providerId))];
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
                    return [4 /*yield*/, database_secure_1.secureDb.db
                            .update(schema.providers)
                            .set({
                            isActive: false,
                            rejectionReason: 'Manual rejection by admin',
                            registrationStatus: 'rejected',
                            updatedAt: new Date()
                        })
                            .where((0, drizzle_orm_1.eq)(schema.providers.id, providerId))];
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
        var provider, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, database_secure_1.secureDb.db
                            .select({ documents: schema.providers.documents })
                            .from(schema.providers)
                            .where((0, drizzle_orm_1.eq)(schema.providers.id, providerId))
                            .limit(1)];
                case 1:
                    provider = (_a.sent())[0];
                    return [2 /*return*/, (provider === null || provider === void 0 ? void 0 : provider.documents) || []];
                case 2:
                    error_3 = _a.sent();
                    console.error("Failed to fetch provider documents:", error_3);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getPendingProviders() {
    return __awaiter(this, void 0, void 0, function () {
        var allProviders, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, getAllProviders()];
                case 1:
                    allProviders = _a.sent();
                    return [2 /*return*/, allProviders.filter(function (provider) {
                            return (provider.status === 'pending' && provider.isActive === false) ||
                                (provider.status === 'pending' && provider.isVerified === false) ||
                                provider.status === 'rejected';
                        })];
                case 2:
                    error_4 = _a.sent();
                    console.error("Failed to fetch pending providers:", error_4);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getAllProviders() {
    return __awaiter(this, void 0, void 0, function () {
        var providers, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, database_secure_1.secureDb.db
                            .select({
                            id: schema.providers.id,
                            businessName: schema.providers.businessName,
                            contactPerson: schema.providers.contactPerson,
                            contactEmail: schema.providers.contactEmail,
                            contactPhone: schema.providers.contactPhone,
                            address: schema.providers.address,
                            registrationStatus: schema.providers.registrationStatus,
                            createdAt: schema.providers.createdAt,
                            isActive: schema.providers.isActive,
                            isVerified: schema.providers.isVerified,
                            documents: schema.providers.documents,
                            firstName: schema.users.firstName,
                            lastName: schema.users.lastName,
                            email: schema.users.email
                        })
                            .from(schema.providers)
                            .innerJoin(schema.users, (0, drizzle_orm_1.eq)(schema.providers.userId, schema.users.id))
                            .where((0, drizzle_orm_1.eq)(schema.users.role, 'provider'))
                            .orderBy((0, drizzle_orm_1.desc)(schema.providers.createdAt))];
                case 1:
                    providers = _a.sent();
                    return [2 /*return*/, providers.map(function (row) { return ({
                            id: row.id,
                            name: "".concat(row.firstName, " ").concat(row.lastName),
                            email: row.contactEmail,
                            companyName: row.businessName,
                            submittedAt: row.createdAt,
                            status: row.registrationStatus || 'pending',
                            phone: row.contactPhone,
                            address: row.address,
                            isActive: row.isActive,
                            isVerified: row.isVerified,
                            documents: row.documents || []
                        }); })];
                case 2:
                    error_5 = _a.sent();
                    console.error("Failed to fetch all providers:", error_5);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getCurrentProviders() {
    return __awaiter(this, void 0, void 0, function () {
        var allProviders, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, getAllProviders()];
                case 1:
                    allProviders = _a.sent();
                    return [2 /*return*/, allProviders.filter(function (provider) {
                            return provider.status === 'approved' ||
                                (provider.status === 'pending' && provider.isActive === true) ||
                                (provider.status === 'pending' && provider.isVerified === true);
                        })];
                case 2:
                    error_6 = _a.sent();
                    console.error("Failed to fetch current providers:", error_6);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function deleteProvider(providerId) {
    return __awaiter(this, void 0, void 0, function () {
        var error_7;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, database_secure_1.secureDb.withTransaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var provider;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx.db
                                            .select({ userId: schema.providers.userId })
                                            .from(schema.providers)
                                            .where((0, drizzle_orm_1.eq)(schema.providers.id, providerId))
                                            .limit(1)];
                                    case 1:
                                        provider = (_a.sent())[0];
                                        if (!provider) {
                                            return [2 /*return*/, { success: false, error: "Provider not found" }];
                                        }
                                        // Delete provider and user (cascade should handle this, but being explicit)
                                        return [4 /*yield*/, tx.db.delete(schema.providers).where((0, drizzle_orm_1.eq)(schema.providers.id, providerId))];
                                    case 2:
                                        // Delete provider and user (cascade should handle this, but being explicit)
                                        _a.sent();
                                        return [4 /*yield*/, tx.db.delete(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, provider.userId))];
                                    case 3:
                                        _a.sent();
                                        return [2 /*return*/, { success: true }];
                                }
                            });
                        }); })];
                case 1: 
                // Use transaction to ensure atomicity
                return [2 /*return*/, _a.sent()];
                case 2:
                    error_7 = _a.sent();
                    console.error("Failed to delete provider:", error_7);
                    return [2 /*return*/, { success: false, error: "Failed to delete provider" }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getDashboardStats() {
    return __awaiter(this, void 0, void 0, function () {
        var thirtyDaysAgo, _a, totalStats, recentStats, totalAccommodations, totalProviders, totalViews, totalAccommodations30, totalProviders30, totalViews30, error_8;
        var _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    _h.trys.push([0, 2, , 3]);
                    thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    return [4 /*yield*/, Promise.all([
                            // Total stats
                            database_secure_1.secureDb.db
                                .select({
                                totalAccommodations: (0, drizzle_orm_1.count)(schema.accommodations.id),
                                totalProviders: (0, drizzle_orm_1.count)(schema.providers.id),
                                totalViews: (0, drizzle_orm_1.sum)(schema.accommodations.viewCount)
                            })
                                .from(schema.accommodations)
                                .leftJoin(schema.providers, (0, drizzle_orm_1.eq)(schema.accommodations.providerId, schema.providers.id)),
                            // Recent stats (last 30 days)
                            database_secure_1.secureDb.db
                                .select({
                                totalAccommodations: (0, drizzle_orm_1.count)(schema.accommodations.id),
                                totalProviders: (0, drizzle_orm_1.count)(schema.providers.id),
                                totalViews: (0, drizzle_orm_1.sum)(schema.accommodations.viewCount)
                            })
                                .from(schema.accommodations)
                                .leftJoin(schema.providers, (0, drizzle_orm_1.eq)(schema.accommodations.providerId, schema.providers.id))
                                .where((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " >= ", ""], ["", " >= ", ""])), schema.accommodations.createdAt, thirtyDaysAgo))
                        ])];
                case 1:
                    _a = _h.sent(), totalStats = _a[0], recentStats = _a[1];
                    totalAccommodations = Number(((_b = totalStats[0]) === null || _b === void 0 ? void 0 : _b.totalAccommodations) || 0);
                    totalProviders = Number(((_c = totalStats[0]) === null || _c === void 0 ? void 0 : _c.totalProviders) || 0);
                    totalViews = Number(((_d = totalStats[0]) === null || _d === void 0 ? void 0 : _d.totalViews) || 0);
                    totalAccommodations30 = Number(((_e = recentStats[0]) === null || _e === void 0 ? void 0 : _e.totalAccommodations) || 0);
                    totalProviders30 = Number(((_f = recentStats[0]) === null || _f === void 0 ? void 0 : _f.totalProviders) || 0);
                    totalViews30 = Number(((_g = recentStats[0]) === null || _g === void 0 ? void 0 : _g.totalViews) || 0);
                    return [2 /*return*/, {
                            totalAccommodations: totalAccommodations,
                            totalProviders: totalProviders,
                            totalRevenue: 0, // TODO: Implement revenue calculation
                            totalViews: totalViews,
                            accommodationsChange: calculateChange(totalAccommodations, totalAccommodations30),
                            providersChange: calculateChange(totalProviders, totalProviders30),
                            revenueChange: 0, // TODO: Implement revenue change calculation
                            viewsChange: calculateChange(totalViews, totalViews30)
                        }];
                case 2:
                    error_8 = _h.sent();
                    console.error("Failed to get dashboard stats:", error_8);
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
        var activities, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, database_secure_1.secureDb.db
                            .select({
                            id: schema.adminActivities.id,
                            activityType: schema.adminActivities.activityType,
                            message: schema.adminActivities.message,
                            createdAt: schema.adminActivities.createdAt
                        })
                            .from(schema.adminActivities)
                            .orderBy((0, drizzle_orm_1.desc)(schema.adminActivities.createdAt))
                            .limit(5)];
                case 1:
                    activities = _a.sent();
                    return [2 /*return*/, activities.map(function (row) { return ({
                            id: row.id,
                            type: row.activityType,
                            message: row.message,
                            time: formatTimeAgo(row.createdAt.toISOString())
                        }); })];
                case 2:
                    error_9 = _a.sent();
                    console.error("Failed to get recent activity:", error_9);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getPendingApprovals() {
    return __awaiter(this, void 0, void 0, function () {
        var providers, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, database_secure_1.secureDb.db
                            .select({
                            id: schema.providers.id,
                            businessName: schema.providers.businessName,
                            registrationStatus: schema.providers.registrationStatus
                        })
                            .from(schema.providers)
                            .where((0, drizzle_orm_1.eq)(schema.providers.registrationStatus, 'pending'))
                            .limit(100)];
                case 1:
                    providers = _a.sent();
                    return [2 /*return*/, providers.map(function (r) { return ({
                            id: r.id,
                            type: 'provider',
                            title: r.businessName,
                            provider: r.businessName,
                            status: 'pending'
                        }); })];
                case 2:
                    error_10 = _a.sent();
                    console.error("Failed to get pending approvals:", error_10);
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
var templateObject_1;
