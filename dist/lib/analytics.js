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
exports.AnalyticsService = void 0;
var AnalyticsService = /** @class */ (function () {
    function AnalyticsService() {
    }
    AnalyticsService.getOverviewData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch('/api/admin/analytics/overview')];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch analytics data');
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Failed to fetch analytics overview:', error_1);
                        // Return empty/zero data instead of mock data
                        return [2 /*return*/, {
                                revenue: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
                                accommodations: { total: 0, active: 0, pending: 0, growth: 0 },
                                providers: { total: 0, active: 0, newThisMonth: 0, growth: 0 },
                                bookings: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
                                views: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AnalyticsService.getRevenueChart = function (period) {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("/api/admin/analytics/revenue?period=".concat(period))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch revenue chart data');
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Failed to fetch revenue chart:', error_2);
                        // Return empty chart data instead of mock data
                        return [2 /*return*/, {
                                labels: [],
                                datasets: [{
                                        label: "Revenue (R)",
                                        data: [],
                                        borderColor: "rgb(59, 130, 246)",
                                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                                        tension: 0.4,
                                    }],
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AnalyticsService.getTopPerformers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch('/api/admin/analytics/top-performers')];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch top performers');
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data.performers || []];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Failed to fetch top performers:', error_3);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AnalyticsService.getSystemHealth = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch('/api/admin/analytics/system-health')];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch system health');
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 3:
                        error_4 = _a.sent();
                        console.error('Failed to fetch system health:', error_4);
                        // Return degraded status instead of mock data
                        return [2 /*return*/, {
                                apiLatency: { average: 0, status: "poor" },
                                errorRate: { rate: 100, status: "poor" },
                                database: { status: "offline" },
                                uptime: { percentage: 0, status: "poor" },
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return AnalyticsService;
}());
exports.AnalyticsService = AnalyticsService;
