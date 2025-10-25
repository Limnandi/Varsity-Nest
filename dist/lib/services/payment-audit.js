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
exports.PaymentAuditService = void 0;
var database_secure_1 = require("@/lib/database-secure");
var drizzle_orm_1 = require("drizzle-orm");
var schema = __importStar(require("@/lib/schema"));
var config_1 = require("@/lib/logging/config");
var PaymentAuditService = /** @class */ (function () {
    function PaymentAuditService() {
    }
    /**
     * Log payment audit event
     */
    PaymentAuditService.logAuditEvent = function (transactionId, action, details) {
        return __awaiter(this, void 0, void 0, function () {
            var auditLog, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        auditLog = {
                            transactionId: transactionId,
                            action: action,
                            oldStatus: details.oldStatus,
                            newStatus: details.newStatus,
                            amount: details.amount,
                            providerId: details.providerId,
                            adminId: details.adminId,
                            reason: details.reason,
                            metadata: details.metadata,
                        };
                        return [4 /*yield*/, database_secure_1.secureDb.db.insert(schema.paymentAuditLogs).values(__assign(__assign({ id: crypto.randomUUID() }, auditLog), { createdAt: new Date() }))
                            // Also log to Sentry for critical events
                        ];
                    case 1:
                        _a.sent();
                        // Also log to Sentry for critical events
                        if (['failed', 'cancelled'].includes(action)) {
                            (0, config_1.captureMessage)("Payment ".concat(action, ": ").concat(transactionId), __assign({ level: 'warning', component: 'payment-audit', action: action, transactionId: transactionId }, details));
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        (0, config_1.captureException)(error_1 instanceof Error ? error_1 : new Error(String(error_1)), { component: 'payment-audit', action: action, transactionId: transactionId, details: details });
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get payment audit trail
     */
    PaymentAuditService.getAuditTrail = function (transactionId) {
        return __awaiter(this, void 0, void 0, function () {
            var logs, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, database_secure_1.secureDb.db
                                .select()
                                .from(schema.paymentAuditLogs)
                                .where((0, drizzle_orm_1.eq)(schema.paymentAuditLogs.transactionId, transactionId))
                                .orderBy((0, drizzle_orm_1.desc)(schema.paymentAuditLogs.createdAt))];
                    case 1:
                        logs = _a.sent();
                        return [2 /*return*/, logs.map(function (log) { return ({
                                id: log.id,
                                transactionId: log.transactionId,
                                action: log.action,
                                oldStatus: log.oldStatus,
                                newStatus: log.newStatus,
                                amount: log.amount,
                                providerId: log.providerId,
                                adminId: log.adminId,
                                reason: log.reason,
                                metadata: log.metadata,
                                createdAt: log.createdAt,
                            }); })];
                    case 2:
                        error_2 = _a.sent();
                        (0, config_1.captureException)(error_2 instanceof Error ? error_2 : new Error(String(error_2)), { component: 'payment-audit', transactionId: transactionId });
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get payment audit summary for provider
     */
    PaymentAuditService.getProviderAuditSummary = function (providerId_1) {
        return __awaiter(this, arguments, void 0, function (providerId, days) {
            var startDate, transactions, summary, error_3;
            if (days === void 0) { days = 30; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        startDate = new Date();
                        startDate.setDate(startDate.getDate() - days);
                        return [4 /*yield*/, database_secure_1.secureDb.db
                                .select()
                                .from(schema.paymentTransactions)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.paymentTransactions.providerId, providerId), (0, drizzle_orm_1.gte)(schema.paymentTransactions.createdAt, startDate)))
                                .orderBy((0, drizzle_orm_1.desc)(schema.paymentTransactions.createdAt))];
                    case 1:
                        transactions = _a.sent();
                        summary = {
                            totalTransactions: transactions.length,
                            successfulPayments: transactions.filter(function (t) { return t.status === 'completed'; }).length,
                            failedPayments: transactions.filter(function (t) { return t.status === 'failed'; }).length,
                            totalAmount: transactions
                                .filter(function (t) { return t.status === 'completed'; })
                                .reduce(function (sum, t) { return sum + Number(t.amount); }, 0),
                            lastPaymentDate: transactions.length > 0 ? transactions[0].createdAt : null,
                        };
                        return [2 /*return*/, summary];
                    case 2:
                        error_3 = _a.sent();
                        (0, config_1.captureException)(error_3 instanceof Error ? error_3 : new Error(String(error_3)), { component: 'payment-audit', providerId: providerId, days: days });
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get payment audit summary for admin
     */
    PaymentAuditService.getAdminAuditSummary = function () {
        return __awaiter(this, arguments, void 0, function (days) {
            var startDate, transactions, successfulTransactions, totalRevenue, providerStats_1, topProviders, error_4;
            if (days === void 0) { days = 30; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        startDate = new Date();
                        startDate.setDate(startDate.getDate() - days);
                        return [4 /*yield*/, database_secure_1.secureDb.db
                                .select()
                                .from(schema.paymentTransactions)
                                .where((0, drizzle_orm_1.gte)(schema.paymentTransactions.createdAt, startDate))
                                .orderBy((0, drizzle_orm_1.desc)(schema.paymentTransactions.createdAt))];
                    case 1:
                        transactions = _a.sent();
                        successfulTransactions = transactions.filter(function (t) { return t.status === 'completed'; });
                        totalRevenue = successfulTransactions.reduce(function (sum, t) { return sum + Number(t.amount); }, 0);
                        providerStats_1 = new Map();
                        successfulTransactions.forEach(function (t) {
                            if (t.providerId) {
                                var existing = providerStats_1.get(t.providerId) || { count: 0, amount: 0 };
                                providerStats_1.set(t.providerId, {
                                    count: existing.count + 1,
                                    amount: existing.amount + Number(t.amount)
                                });
                            }
                        });
                        topProviders = Array.from(providerStats_1.entries())
                            .map(function (_a) {
                            var providerId = _a[0], stats = _a[1];
                            return ({
                                providerId: providerId,
                                transactionCount: stats.count,
                                totalAmount: stats.amount
                            });
                        })
                            .sort(function (a, b) { return b.totalAmount - a.totalAmount; })
                            .slice(0, 10);
                        return [2 /*return*/, {
                                totalTransactions: transactions.length,
                                successfulPayments: successfulTransactions.length,
                                failedPayments: transactions.filter(function (t) { return t.status === 'failed'; }).length,
                                pendingPayments: transactions.filter(function (t) { return t.status === 'pending'; }).length,
                                totalRevenue: totalRevenue,
                                averageTransactionValue: successfulTransactions.length > 0
                                    ? totalRevenue / successfulTransactions.length
                                    : 0,
                                topProviders: topProviders,
                            }];
                    case 2:
                        error_4 = _a.sent();
                        (0, config_1.captureException)(error_4 instanceof Error ? error_4 : new Error(String(error_4)), { component: 'payment-audit', days: days });
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Detect suspicious payment patterns
     */
    PaymentAuditService.detectSuspiciousActivity = function (providerId) {
        return __awaiter(this, void 0, void 0, function () {
            var reasons, riskScore, recentTransactions, failedTransactions, amounts, avgAmount, maxAmount, paymentIds, uniqueIds, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        reasons = [];
                        riskScore = 0;
                        return [4 /*yield*/, database_secure_1.secureDb.db
                                .select()
                                .from(schema.paymentTransactions)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.paymentTransactions.providerId, providerId), (0, drizzle_orm_1.gte)(schema.paymentTransactions.createdAt, new Date(Date.now() - 60 * 60 * 1000)) // Last hour
                            ))
                                .orderBy((0, drizzle_orm_1.desc)(schema.paymentTransactions.createdAt))];
                    case 1:
                        recentTransactions = _a.sent();
                        if (recentTransactions.length > 5) {
                            reasons.push('High frequency of payment attempts');
                            riskScore += 30;
                        }
                        failedTransactions = recentTransactions.filter(function (t) { return t.status === 'failed'; });
                        if (failedTransactions.length > 3) {
                            reasons.push('Multiple failed payment attempts');
                            riskScore += 25;
                        }
                        amounts = recentTransactions.map(function (t) { return Number(t.amount); });
                        avgAmount = amounts.reduce(function (sum, amount) { return sum + amount; }, 0) / amounts.length;
                        maxAmount = Math.max.apply(Math, amounts);
                        if (maxAmount > avgAmount * 3) {
                            reasons.push('Unusually high payment amount');
                            riskScore += 20;
                        }
                        paymentIds = recentTransactions.map(function (t) { return t.mPaymentId; });
                        uniqueIds = new Set(paymentIds);
                        if (paymentIds.length !== uniqueIds.size) {
                            reasons.push('Duplicate payment IDs detected');
                            riskScore += 40;
                        }
                        return [2 /*return*/, {
                                isSuspicious: riskScore > 50,
                                reasons: reasons,
                                riskScore: Math.min(riskScore, 100)
                            }];
                    case 2:
                        error_5 = _a.sent();
                        (0, config_1.captureException)(error_5 instanceof Error ? error_5 : new Error(String(error_5)), { component: 'payment-audit', providerId: providerId });
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return PaymentAuditService;
}());
exports.PaymentAuditService = PaymentAuditService;
