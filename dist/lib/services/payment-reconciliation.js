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
exports.PaymentReconciliationService = void 0;
var database_secure_1 = require("@/lib/database-secure");
var drizzle_orm_1 = require("drizzle-orm");
var schema = __importStar(require("@/lib/schema"));
var config_1 = require("@/lib/logging/config");
var payment_audit_1 = require("./payment-audit");
var PaymentReconciliationService = /** @class */ (function () {
    function PaymentReconciliationService() {
    }
    /**
     * Reconcile payment with PayFast records
     */
    PaymentReconciliationService.reconcilePayment = function (transactionId, payfastData) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction, expectedAmount, actualAmount, status_1, reconciliation, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, database_secure_1.secureDb.db
                                .select()
                                .from(schema.paymentTransactions)
                                .where((0, drizzle_orm_1.eq)(schema.paymentTransactions.id, transactionId))
                                .limit(1)];
                    case 1:
                        transaction = (_a.sent())[0];
                        if (!transaction) {
                            throw new Error("Transaction ".concat(transactionId, " not found"));
                        }
                        expectedAmount = Number(transaction.amount);
                        actualAmount = Number(payfastData.amount_gross);
                        status_1 = this.determineReconciliationStatus(expectedAmount, actualAmount, payfastData.payment_status);
                        reconciliation = {
                            transactionId: transactionId,
                            expectedAmount: expectedAmount,
                            actualAmount: actualAmount,
                            status: status_1,
                            notes: this.generateReconciliationNotes(expectedAmount, actualAmount, payfastData)
                        };
                        // Log reconciliation event
                        return [4 /*yield*/, payment_audit_1.PaymentAuditService.logAuditEvent(transactionId, 'reconciled', {
                                amount: actualAmount,
                                providerId: transaction.providerId,
                                reason: "Reconciled with PayFast. Status: ".concat(status_1),
                                metadata: { payfastData: payfastData }
                            })];
                    case 2:
                        // Log reconciliation event
                        _a.sent();
                        return [2 /*return*/, __assign(__assign({}, reconciliation), { reconciliationDate: new Date() })];
                    case 3:
                        error_1 = _a.sent();
                        (0, config_1.captureException)(error_1 instanceof Error ? error_1 : new Error(String(error_1)), { component: 'payment-reconciliation', transactionId: transactionId });
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Determine reconciliation status
     */
    PaymentReconciliationService.determineReconciliationStatus = function (expectedAmount, actualAmount, paymentStatus) {
        var tolerance = 0.01; // 1 cent tolerance
        if (paymentStatus !== 'COMPLETE') {
            return 'mismatch';
        }
        if (Math.abs(expectedAmount - actualAmount) <= tolerance) {
            return 'matched';
        }
        return 'mismatch';
    };
    /**
     * Generate reconciliation notes
     */
    PaymentReconciliationService.generateReconciliationNotes = function (expectedAmount, actualAmount, _payfastData) {
        var amountDiff = Math.abs(expectedAmount - actualAmount);
        if (amountDiff <= 0.01) {
            return 'Amounts match within tolerance';
        }
        return "Amount discrepancy: expected R".concat(expectedAmount.toFixed(2), ", received R").concat(actualAmount.toFixed(2), " (diff: R").concat(amountDiff.toFixed(2), ")");
    };
    /**
     * Detect duplicate payments
     */
    PaymentReconciliationService.detectDuplicatePayments = function (providerId_1, amount_1) {
        return __awaiter(this, arguments, void 0, function (providerId, amount, timeWindow) {
            var startTime, recentTransactions, duplicateTransactions, error_2;
            if (timeWindow === void 0) { timeWindow = 300000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        startTime = new Date(Date.now() - timeWindow);
                        return [4 /*yield*/, database_secure_1.secureDb.db
                                .select()
                                .from(schema.paymentTransactions)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.paymentTransactions.providerId, providerId), (0, drizzle_orm_1.gte)(schema.paymentTransactions.createdAt, startTime)))
                                .orderBy((0, drizzle_orm_1.desc)(schema.paymentTransactions.createdAt))];
                    case 1:
                        recentTransactions = _a.sent();
                        duplicateTransactions = recentTransactions.filter(function (t) {
                            return Math.abs(Number(t.amount) - amount) <= 0.01 &&
                                t.status === 'completed';
                        });
                        return [2 /*return*/, {
                                isDuplicate: duplicateTransactions.length > 0,
                                duplicateTransactions: duplicateTransactions
                            }];
                    case 2:
                        error_2 = _a.sent();
                        (0, config_1.captureException)(error_2 instanceof Error ? error_2 : new Error(String(error_2)), { component: 'payment-reconciliation', providerId: providerId, amount: amount });
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Reconcile all pending transactions
     */
    PaymentReconciliationService.reconcileAllPendingTransactions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pendingTransactions, reconciled, mismatched, errors, _i, pendingTransactions_1, transaction, age, error_3, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 10, , 11]);
                        return [4 /*yield*/, database_secure_1.secureDb.db
                                .select()
                                .from(schema.paymentTransactions)
                                .where((0, drizzle_orm_1.eq)(schema.paymentTransactions.status, 'pending'))
                                .orderBy((0, drizzle_orm_1.desc)(schema.paymentTransactions.createdAt))];
                    case 1:
                        pendingTransactions = _a.sent();
                        reconciled = 0;
                        mismatched = 0;
                        errors = 0;
                        _i = 0, pendingTransactions_1 = pendingTransactions;
                        _a.label = 2;
                    case 2:
                        if (!(_i < pendingTransactions_1.length)) return [3 /*break*/, 9];
                        transaction = pendingTransactions_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 7, , 8]);
                        age = Date.now() - transaction.createdAt.getTime();
                        if (!(age > 24 * 60 * 60 * 1000)) return [3 /*break*/, 6];
                        // Mark as failed if too old
                        return [4 /*yield*/, database_secure_1.secureDb.db
                                .update(schema.paymentTransactions)
                                .set({ status: 'failed' })
                                .where((0, drizzle_orm_1.eq)(schema.paymentTransactions.id, transaction.id))];
                    case 4:
                        // Mark as failed if too old
                        _a.sent();
                        return [4 /*yield*/, payment_audit_1.PaymentAuditService.logAuditEvent(transaction.id, 'failed', {
                                oldStatus: 'pending',
                                newStatus: 'failed',
                                amount: Number(transaction.amount),
                                providerId: transaction.providerId,
                                reason: 'Transaction timeout - no response from PayFast within 24 hours'
                            })];
                    case 5:
                        _a.sent();
                        mismatched++;
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_3 = _a.sent();
                        (0, config_1.captureException)(error_3 instanceof Error ? error_3 : new Error(String(error_3)), { component: 'payment-reconciliation', transactionId: transaction.id });
                        errors++;
                        return [3 /*break*/, 8];
                    case 8:
                        _i++;
                        return [3 /*break*/, 2];
                    case 9: return [2 /*return*/, { reconciled: reconciled, mismatched: mismatched, errors: errors }];
                    case 10:
                        error_4 = _a.sent();
                        (0, config_1.captureException)(error_4 instanceof Error ? error_4 : new Error(String(error_4)), { component: 'payment-reconciliation' });
                        throw error_4;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get reconciliation report
     */
    PaymentReconciliationService.getReconciliationReport = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var transactions, completedTransactions, totalExpectedAmount, matchedTransactions, mismatchedTransactions, discrepancies, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, database_secure_1.secureDb.db
                                .select()
                                .from(schema.paymentTransactions)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema.paymentTransactions.createdAt, startDate), (0, drizzle_orm_1.lte)(schema.paymentTransactions.createdAt, endDate)))
                                .orderBy((0, drizzle_orm_1.desc)(schema.paymentTransactions.createdAt))];
                    case 1:
                        transactions = _a.sent();
                        completedTransactions = transactions.filter(function (t) { return t.status === 'completed'; });
                        totalExpectedAmount = completedTransactions.reduce(function (sum, t) { return sum + Number(t.amount); }, 0);
                        matchedTransactions = completedTransactions.length;
                        mismatchedTransactions = transactions.length - matchedTransactions;
                        discrepancies = transactions
                            .filter(function (t) { return t.status === 'failed' || t.status === 'cancelled'; })
                            .map(function (t) { return ({
                            transactionId: t.id,
                            expectedAmount: Number(t.amount),
                            actualAmount: 0,
                            difference: -Number(t.amount),
                            status: t.status
                        }); });
                        return [2 /*return*/, {
                                totalTransactions: transactions.length,
                                matchedTransactions: matchedTransactions,
                                mismatchedTransactions: mismatchedTransactions,
                                totalExpectedAmount: totalExpectedAmount,
                                totalActualAmount: totalExpectedAmount, // Assuming all completed are matched
                                discrepancies: discrepancies
                            }];
                    case 2:
                        error_5 = _a.sent();
                        (0, config_1.captureException)(error_5 instanceof Error ? error_5 : new Error(String(error_5)), { component: 'payment-reconciliation', startDate: startDate, endDate: endDate });
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return PaymentReconciliationService;
}());
exports.PaymentReconciliationService = PaymentReconciliationService;
