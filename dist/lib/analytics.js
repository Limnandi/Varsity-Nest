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
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Simulate API call
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 1:
                        // Simulate API call
                        _a.sent();
                        return [2 /*return*/, {
                                revenue: {
                                    total: 125000,
                                    thisMonth: 12500,
                                    lastMonth: 11200,
                                    growth: 11.6,
                                },
                                accommodations: {
                                    total: 45,
                                    active: 42,
                                    pending: 3,
                                    growth: 8.5,
                                },
                                providers: {
                                    total: 28,
                                    active: 26,
                                    newThisMonth: 3,
                                    growth: 12.0,
                                },
                                bookings: {
                                    total: 1250,
                                    thisMonth: 145,
                                    lastMonth: 132,
                                    growth: 9.8,
                                },
                                views: {
                                    total: 25000,
                                    thisMonth: 3200,
                                    lastMonth: 2800,
                                    growth: 14.3,
                                },
                            }];
                }
            });
        });
    };
    AnalyticsService.getRevenueChart = function (period) {
        return __awaiter(this, void 0, void 0, function () {
            var labels, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 800); })];
                    case 1:
                        _a.sent();
                        labels = period === "7d"
                            ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                            : period === "30d"
                                ? Array.from({ length: 30 }, function (_, i) { return "Day ".concat(i + 1); })
                                : period === "90d"
                                    ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                                    : ["Q1", "Q2", "Q3", "Q4"];
                        data = labels.map(function () { return Math.floor(Math.random() * 5000) + 1000; });
                        return [2 /*return*/, {
                                labels: labels,
                                datasets: [
                                    {
                                        label: "Revenue (R)",
                                        data: data,
                                        borderColor: "rgb(59, 130, 246)",
                                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                                        tension: 0.4,
                                    },
                                ],
                            }];
                }
            });
        });
    };
    AnalyticsService.getTopPerformers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 600); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, [
                                { id: "1", name: "Campus View Apartments", value: 4200, change: 15.2, type: "accommodation" },
                                { id: "2", name: "Sunny Side Residence", value: 3500, change: 8.7, type: "accommodation" },
                                { id: "3", name: "Smith Properties", value: 8500, change: 22.1, type: "provider" },
                                { id: "4", name: "Modern Student Hub", value: 3800, change: 12.3, type: "accommodation" },
                                { id: "5", name: "ABC Housing Ltd", value: 6200, change: 18.9, type: "provider" },
                            ]];
                }
            });
        });
    };
    AnalyticsService.getSystemHealth = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Simulate API call
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 1:
                        // Simulate API call
                        _a.sent();
                        return [2 /*return*/, {
                                apiLatency: {
                                    average: 85,
                                    status: "good",
                                },
                                errorRate: {
                                    rate: 0.2,
                                    status: "good",
                                },
                                database: {
                                    status: "online",
                                },
                                uptime: {
                                    percentage: 99.98,
                                    status: "good",
                                },
                            }];
                }
            });
        });
    };
    return AnalyticsService;
}());
exports.AnalyticsService = AnalyticsService;
